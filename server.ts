import express from "express";
import cors from "cors";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { processAI, generateResponse } from "./ai/ai";
import { CRMEngine } from "./core/crmEngine";

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

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
       * 1. AI INTERPRETATION LAYER
       * SOLO entiende intención, NO ejecuta nada
       */
      const aiResult = await processAI(message, {
        inventory,
        history
      });

      /**
       * 2. CRM DECISION LAYER (NUEVO CEREBRO REAL)
       */
      const crmDecision = await CRMEngine.handle("MESSAGE_RECEIVED", {
        leadId: aiResult.leadId || crypto.randomUUID(),
        name: aiResult.name,
        phone: aiResult.phone,
        email: aiResult.email,
        message,
        vehicleInterest: aiResult.vehicleInterest,
        creditTier: aiResult.creditTier,
        source: "web_chat",
        raw: aiResult
      });

      /**
       * 3. RESPONSE GENERATION
       * El AI genera la respuesta final basada en las instrucciones del CRM
       */
      const responseText = await generateResponse(message, crmDecision, {
        inventory,
        history
      });

      /**
       * 4. RESPONSE TO FRONTEND (CLEAN)
       */
      return res.json({
        text: responseText,
        crm: crmDecision
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
        notas: lead.notas || lead.notes || lead.content || lead.type || ""
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
