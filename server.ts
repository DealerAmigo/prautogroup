import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { processCamiloMessage } from "./ai/ai";
import twilioAgentRouter from "./twilioAgent";
import { parseAppointmentDateTime } from "./src/lib/calendar";

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  // Twilio manda sus webhooks (voice/SMS) como application/x-www-form-urlencoded,
  // no JSON -- necesario para que req.body funcione en /api/twilio/*.
  app.use(express.urlencoded({ extended: false, limit: '50mb' }));

  /**
   * AGENTE DE RECEPCIÓN (Twilio) -- missed-call text-back + SMS
   * Mismo motor de Camilo (ai/ai.ts), mismo saveLead hacia GAS.
   * Configurar en la consola de Twilio cuando se compre el número:
   *   Voice webhook     -> POST {dominio}/api/twilio/voice-missed
   *   Messaging webhook -> POST {dominio}/api/twilio/sms
   */
  app.use("/api/twilio", twilioAgentRouter);

  /**
   * HEALTH CHECK
   */
  app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "gt-auto-crm" });
  });

  /**
   * MAIN CHAT ENDPOINT
   * Frontend NO cambia
   */
  
let serverInventoryCache: { data: any; ts: number } | null = null;
const INVENTORY_CACHE_MS = 5 * 60 * 1000; // 5 minutos de cache

  app.get("/api/inventory", async (req, res) => {
    try {
      const bypass = req.query.bypass === "true";
      const now = Date.now();
      if (!bypass && serverInventoryCache && (now - serverInventoryCache.ts < INVENTORY_CACHE_MS)) {
        return res.json(serverInventoryCache.data);
      }

      const inventoryUrl = process.env.INVENTORY_SCRIPT_URL;
      if (!inventoryUrl) {
        if (serverInventoryCache) return res.json(serverInventoryCache.data);
        throw new Error("INVENTORY_SCRIPT_URL environment variable is missing.");
      }
      
      const response = await fetch(inventoryUrl, {
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch inventory from Google Script: status ${response.status}`);
      }
      
      const data = await response.json();
      serverInventoryCache = { data, ts: now };
      return res.json(data);
    } catch (error: any) {
      console.error("Inventory fetch error:", error.message || error);
      if (serverInventoryCache) {
        console.log("Serving stale inventory cache following error");
        return res.json(serverInventoryCache.data);
      }
      return res.status(500).json({ status: "error", message: error.message || "Failed to fetch inventory" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { message, inventory, history } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message required" });
      }

      /**
       * LLAMADA ÚNICA A CAMILO (Claude, con Gemini como fallback)
       * Extrae datos, decide la fase y genera la respuesta en una sola pasada.
       */
      const responseText = await processCamiloMessage(message, {
        inventory,
        history
      });

      // Log de auditoria (pregunta + respuesta) hacia GAS -- se espera a que
      // termine ANTES de responder al cliente, por la misma razon que en
      // twilioAgent.ts: Cloud Run puede congelar el CPU del contenedor apenas
      // se envia la respuesta HTTP, y un log "fire and forget" despues de
      // res.json() se podria perder silenciosamente.
      // IMPORTANTE: se limpia de tags (NUDGES, LEAD_DATA, etc.) antes de
      // guardar -- el log de auditoria debe mostrar lo que el cliente
      // realmente vio, no la metadata cruda interna.
      const cleanReplyForLog = responseText
        .replace(/CITA_CONFIRMADA:.*$/gm, "")
        .replace(/HANDOFF_URGENTE:.*$/gm, "")
        .replace(/NUDGES:.*$/gm, "")
        .replace(/MOSTRAR_VEHICULO:.*$/gm, "")
        .replace(/LEAD_DATA:\s*\{.*?\}/gs, "")
        .trim();

      const leadsScriptUrl = process.env.LEADS_SCRIPT_URL;
      if (leadsScriptUrl) {
        const proxyKey = process.env.PROXY_KEY || process.env.APPS_SCRIPT_TOKEN || "test_token";
        try {
          await fetch(leadsScriptUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "logChat",
              _token: proxyKey,
              proxyKey,
              sheetId: "1nUrfRkkjXWcXgp68i17htYXcHukI4i4FKCsAHyaRyg0",
              userMessage: message,
              botReply: cleanReplyForLog
            })
          });
        } catch (logErr) {
          console.error("Error guardando chat log de auditoria:", logErr);
        }
      }

      return res.json({
        text: responseText
      });
    } catch (error: any) {
      console.error("Chat error:", error.stack || error);
      return res.status(500).json({
        error: "Internal server error",
        message: error?.message || "unknown"
      });
    }
  });

  app.post("/api/calendar/event", async (req, res) => {
    try {
      const details = req.body || {};
      const customerName = details.customerName || details.nombre || 'Cliente GT Auto Imports';
      const dateStr = details.date || details.fecha || '';
      const timeStr = details.time || details.hora || '';
      const interest = details.interest || details.vehiculoInteres || 'Prueba de Manejo';
      const phone = details.phone || details.telefono || '';
      const email = details.email || '';
      const calendarId = details.calendarId || process.env.GOOGLE_CALENDAR_ID || "1884c8cd8bbf5c721bbf22a27a81096fa4f81023c7f999973801f9b3e1efed15@group.calendar.google.com";

      const parsedDates = details.startISO && details.endISO
        ? { startISO: details.startISO, endISO: details.endISO }
        : parseAppointmentDateTime(dateStr, timeStr);

      const leadsScriptUrl = process.env.LEADS_SCRIPT_URL;
      const proxyKey = process.env.PROXY_KEY || process.env.APPS_SCRIPT_TOKEN || "test_token";

      const payload = {
        action: "createCalendarEvent",
        _token: proxyKey,
        proxyKey: proxyKey,
        calendarId: calendarId,
        summary: `Cita GT Auto Imports: ${customerName} - ${interest}`,
        description: `Cliente: ${customerName}\nTeléfono: ${phone}\nEmail: ${email}\nVehículo de Interés: ${interest}\nCreado automáticamente por Asistente Camilo`,
        location: "PR-2 km 26.1, Dorado, Puerto Rico 00646",
        customerName: customerName,
        nombre: customerName,
        phone: phone,
        telefono: phone,
        email: email,
        interest: interest,
        vehiculoInteres: interest,
        date: dateStr,
        time: timeStr,
        startISO: parsedDates.startISO,
        endISO: parsedDates.endISO,
        timeZone: "America/Puerto_Rico"
      };

      console.log(`[Calendar API] Requesting calendar event creation on calendar ${calendarId}...`, parsedDates);

      if (leadsScriptUrl) {
        try {
          const gasResponse = await fetch(leadsScriptUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const gasData = await gasResponse.text().catch(() => '');
          console.log("[Calendar API] GAS response:", gasData);
        } catch (gasErr) {
          console.error("[Calendar API] GAS forward error:", gasErr);
        }
      }

      return res.json({
        status: "success",
        message: "Calendar event payload sent to backend pipeline",
        calendarId,
        event: parsedDates
      });
    } catch (error: any) {
      console.error("[Calendar API] Error creating event:", error);
      return res.status(500).json({ status: "error", message: error.message || "Calendar error" });
    }
  });

  app.post("/api/leads", async (req, res) => {
    try {
      const lead = req.body;
      
      const leadsScriptUrl = process.env.LEADS_SCRIPT_URL;
      if (!leadsScriptUrl) {
        throw new Error("LEADS_SCRIPT_URL environment variable is missing. Please configure it in the Secrets section.");
      }

      const proxyKey = process.env.PROXY_KEY || process.env.APPS_SCRIPT_TOKEN || "test_token";

      // Normalize consent to exact string expected by GAS ("Si" / "No")
      const rawConsent = lead.consentimiento;
      let consentVal = "No";
      if (rawConsent === true || rawConsent === "Si" || rawConsent === "si" || rawConsent === "Sí" || rawConsent === "true" || rawConsent === "1") {
        consentVal = "Si";
      } else if (rawConsent === false || rawConsent === "No" || rawConsent === "no" || rawConsent === "false" || rawConsent === "0") {
        consentVal = "No";
      } else if (typeof rawConsent === "string" && rawConsent.trim()) {
        consentVal = rawConsent;
      }

      const fechaCitaVal = lead.fecha_cita || lead.appointmentDate || "";
      const isAgendoCita =
        lead.agendo_cita === true ||
        lead.agendo_cita === "Si" ||
        lead.agendo_cita === "Sí" ||
        lead.agendo_cita === "si" ||
        lead.agendo_cita === "sí" ||
        lead.eventType === "cita_confirmada" ||
        ["appointment", "ai_appointment_confirmation", "appointment_booking_form"].includes(lead.type) ||
        Boolean(fechaCitaVal && fechaCitaVal.trim() !== "");

      const agendoCitaVal = isAgendoCita ? "Si" : (lead.agendo_cita === "Si" || lead.agendo_cita === "Sí" ? "Si" : "No");
      const estadoLeadVal = isAgendoCita ? "Cita Agendada" : (lead.estadoLead || "Seguimiento");

      let fuenteVal = lead.source || lead.fuente || "Web Chat";
      if (fuenteVal === "web_chat" || fuenteVal === "chat" || fuenteVal === "web") {
        fuenteVal = "Web Chat";
      } else if (fuenteVal === "missed_call_sms") {
        fuenteVal = "missed_call";
      }

      // Parse appointment ISO dates if fecha_cita exists
      let startISO = lead.startISO || "";
      let endISO = lead.endISO || "";
      if (isAgendoCita && fechaCitaVal && (!startISO || !endISO)) {
        try {
          const dates = parseAppointmentDateTime(fechaCitaVal, lead.time || "");
          startISO = dates.startISO;
          endISO = dates.endISO;
        } catch (e) {
          console.warn("[Leads API] Could not parse appointment date:", e);
        }
      }

      // Ensure consistent lead ID using provided id or clean phone number
      const rawPhone = lead.telefono || lead.phone || "";
      const cleanPhone = String(rawPhone).replace(/\D/g, "");
      const leadId = (cleanPhone.length >= 7 ? `lead_${cleanPhone}` : "") || lead.id || "";

      // Map lead data to the exact names expected by the GAS script
      const payload = {
        action: "saveLead",
        _token: proxyKey,
        proxyKey: proxyKey,
        sheetId: "1nUrfRkkjXWcXgp68i17htYXcHukI4i4FKCsAHyaRyg0",
        id: leadId,
        nombre: lead.nombre || lead.name || "",
        telefono: lead.telefono || lead.phone || "",
        email: lead.email || "",
        vehiculoInteres: lead.vehiculoInteres || lead.vehicleInterest || lead.vehiculo_interes || lead.vehicle || "",
        creditTier: lead.creditTier || "",
        scoreInformado: lead.scoreInformado || "",
        tienePronto: lead.tienePronto || "",
        cantidadPronto: lead.cantidadPronto || "",
        tieneTradeIn: lead.tieneTradeIn || "",
        tradeAno: lead.tradeAno || "",
        tradeMarca: lead.tradeMarca || "",
        tradeModelo: lead.tradeModelo || "",
        estadoTrade: lead.estadoTrade || "",
        consentimiento: consentVal,
        resumenIA: lead.resumenIA || lead.resumen || lead.fullText || "",
        estadoLead: estadoLeadVal,
        fuente: fuenteVal,
        agendo_cita: agendoCitaVal,
        fecha_cita: fechaCitaVal,
        fecha_cita_start_iso: startISO,
        fecha_cita_end_iso: endISO,
        startISO: startISO,
        endISO: endISO,
        timeZone: "America/Puerto_Rico",
        notas: lead.notas || lead.notes || lead.content || "",
        eventType: isAgendoCita ? "cita_confirmada" : (lead.eventType || "nuevo_lead"),
        metodoPago: lead.metodoPago || "",
        calendarId: process.env.GOOGLE_CALENDAR_ID || "1884c8cd8bbf5c721bbf22a27a81096fa4f81023c7f999973801f9b3e1efed15@group.calendar.google.com",
        handoffUrgente: lead.handoffUrgente || false,
        conversationHistory: lead.conversationHistory || []
      };

      console.log("Sending lead to Google Apps Script...");
      const gasResponse = await fetch(leadsScriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!gasResponse.ok) {
        throw new Error(`Google Apps Script error: ${gasResponse.statusText}`);
      }

      const gasData = await gasResponse.text();
      console.log("GAS Response:", gasData);

      // FIX: Apps Script Web Apps almost always return HTTP 200 even when the
      // script itself failed. Without this, a failed save was reported as "success".
      // TODO: confirm the exact error field name(s) saveLead() actually returns.
      let gasResult: any = null;
      try {
        gasResult = JSON.parse(gasData);
      } catch {
        // Not JSON -- fall through to prior behavior, but it's logged above.
      }

      if (gasResult && (gasResult.status === "error" || gasResult.success === false)) {
        console.error("GAS reported an internal failure saving the lead:", gasResult);
        return res.status(502).json({
          error: gasResult.message || gasResult.error || "GAS reported an error saving the lead",
          gasResponse: gasData
        });
      }

      return res.json({
        status: "success",
        id: lead?.id,
        gasResponse: gasData
      });
    } catch (error: any) {
      console.error("Lead save error:", error);
      return res.status(500).json({ error: error.message || "lead error" });
    }
  });
  /**
   * PÁGINAS LEGALES (Términos y Privacidad) -- rutas explícitas y directas.
   * Se registran ANTES del middleware de Vite/catch-all de la SPA para
   * garantizar que /terminos-y-condiciones.html y /privacy-policy.html
   * siempre respondan como página HTML normal -- sin login, sin sesión de
   * chat, accesibles por cualquiera con el link. Esto es requisito para el
   * review de la campaña A2P de Twilio (el revisor visita el link directo).
   * Intenta servir desde /public (fuente) y si no existe cae a /dist
   * (copia que genera "vite build" en producción).
   */
  const legalPagesDir = path.join(process.cwd(), "public");
  const legalPagesDistDir = path.join(process.cwd(), "dist");
  const serveLegalPage = (filename: string) => (req: express.Request, res: express.Response) => {
    res.sendFile(path.join(legalPagesDir, filename), (err) => {
      if (err) {
        res.sendFile(path.join(legalPagesDistDir, filename), (err2) => {
          if (err2) res.status(404).send("Not found");
        });
      }
    });
  };
  app.get("/terminos-y-condiciones.html", serveLegalPage("terminos-y-condiciones.html"));
  app.get("/privacy-policy.html", serveLegalPage("privacy-policy.html"));
  app.get("/twilio-domain-verification=22f75d31b7d74ecb5294d43fa76bde92.html", serveLegalPage("twilio-domain-verification=22f75d31b7d74ecb5294d43fa76bde92.html"));
  app.get("/twilio-domain-verification=22f75d31b7d74ecb5294d43fa76bde92", serveLegalPage("twilio-domain-verification=22f75d31b7d74ecb5294d43fa76bde92"));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // widget-loader.js se sirve con URL fija (nunca cambia de nombre entre
  // deploys) -- sin esto, los navegadores lo cachean con heuristica propia
  // y pueden quedarse con una version vieja por dias aunque el servidor ya
  // tenga la nueva. Los demas assets estaticos (camilo.jpg, bundle de React
  // con hash en el nombre) SI pueden cachear normal, no llevan este header.
  app.get("/widget-loader.js", (req, res, next) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    next();
  });
  app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚗 GT Auto CRM running on port ${PORT}`);
  });
}

startServer();
