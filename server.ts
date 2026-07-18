import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { processCamiloMessage } from "./ai/ai";
import twilioAgentRouter from "./twilioAgent";

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  // Twilio manda sus webhooks (voice/SMS) como application/x-www-form-urlencoded,
  // no JSON -- necesario para que req.body funcione en /api/twilio/*.
  app.use(express.urlencoded({ extended: false }));

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
  
  app.get("/api/inventory", async (req, res) => {
    try {
      const inventoryUrl = process.env.INVENTORY_SCRIPT_URL;
      if (!inventoryUrl) {
        throw new Error("INVENTORY_SCRIPT_URL environment variable is missing.");
      }
      
      const response = await fetch(inventoryUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch inventory from Google Script");
      }
      
      const data = await response.json();
      return res.json(data);
    } catch (error: any) {
      console.error("Inventory fetch error:", error);
      return res.status(500).json({ status: "error", message: error.message });
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
        .replace(/LEAD_DATA:\s*\{.*\}/gs, "")
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
      console.error("Chat error:", error);
      return res.status(500).json({
        error: "Internal server error",
        message: error?.message || "unknown"
      });
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

      // Map lead data to the exact names expected by the GAS script
      const payload = {
        action: "saveLead",
        _token: proxyKey,
        proxyKey: proxyKey,
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
        consentimiento: lead.consentimiento !== undefined ? lead.consentimiento : true,
        resumenIA: lead.fullText || lead.resumenIA || "",
        estadoLead: lead.estadoLead || "Nuevo",
        fuente: lead.source || lead.fuente || "web_chat",
        agendo_cita: lead.agendo_cita || (lead.fecha_cita ? true : false) || false,
        fecha_cita: lead.fecha_cita || lead.appointmentDate || "",
        notas: lead.notas || lead.notes || lead.content || "",
        eventType: lead.eventType || "nuevo_lead",
        metodoPago: lead.metodoPago || "",
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

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚗 GT Auto CRM running on port ${PORT}`);
  });
}

startServer();
