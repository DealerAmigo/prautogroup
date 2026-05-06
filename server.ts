import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

// Initialize AI Clients lazily
let genAI: GoogleGenAI | null = null;
let anthropic: Anthropic | null = null;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no configurada. Por favor, ve a la pestaña Settings.");
  }
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY no configurada. Por favor, ve a la pestaña Settings.");
  }
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey });
  }
  return anthropic;
}

// Google Sheets & Apps Script URLs (Defaults)
const INVENTORY_SCRIPT_URL = process.env.INVENTORY_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbx9YrI32v4IZP5PHj6F3rBFZ4d-0jhhM3ki5EtjtwI7YW5vLyEVUIZ1BSVHFGzMXyeabQ/exec";
const LEADS_SCRIPT_URL = process.env.LEADS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbxyPVn1moxv8CZR6Fp-n2QdbFs8DlDJZfCiXiZAROiNKao2U21xoVKwJ73H3N0dYug/exec";

// Security & Consistency (Adjusted for user's proxy preference)
const VALID_TOKEN = process.env.APPS_SCRIPT_TOKEN || "dealeramigo-pr-2026-xK9mPqR";

// Stable models
const CLAUDE_MODEL = "claude-3-5-sonnet-20241022";
const GEMINI_MODEL = "gemini-1.5-flash"; // Standard stable flash for Gemini AI Studio

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Inventory Proxy (Using authorized GET)
  app.get("/api/inventory", async (req, res) => {
    try {
      console.log(`[Inventory] Fetching data via GET...`);
      
      const url = new URL(INVENTORY_SCRIPT_URL);
      url.searchParams.append("_token", VALID_TOKEN);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { "Accept": "application/json" },
        redirect: "follow"
      });

      if (!response.ok) throw new Error(`Status: ${response.status}`);
      
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("[Inventory API Error]:", error.message);
      res.status(500).json({ error: "Error de conexión con el motor de inventario", details: error.message });
    }
  });

  // Lead Registration Proxy (Matching Apps Script fields)
  app.post("/api/leads", async (req, res) => {
    try {
      console.log(`[Leads] Processing lead registration...`);
      const leadData = req.body;

      // Mapping common names to Apps Script names exactly as expected by your GS saveLead()
      const payload = {
        _token: VALID_TOKEN,
        nombre: leadData.name || leadData.nombre || "",
        telefono: leadData.phone || leadData.telefono || "",
        email: leadData.email || "",
        presupuesto: leadData.budget || leadData.presupuesto || leadData.presupuesto_mensual || "",
        vehiculo: leadData.vehicleInterest || leadData.vehiculo_interes || leadData.vehiculo || "",
        notas: leadData.notes || leadData.notas || leadData.resumen || "",
        // Extended fields for the dedicated leads sheet if needed
        tipo_cliente: leadData.clientType || leadData.tipo_cliente || "",
        fuente: leadData.source || leadData.fuente || "Web Chat",
        agendo_cita: leadData.appointmentScheduled || leadData.agendo_cita || "No",
        fecha_cita: leadData.appointmentDate || leadData.fecha_cita || ""
      };

      const response = await fetch(LEADS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        redirect: "follow"
      });

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        res.json(data);
      } catch (e) {
        res.json({ success: true, message: text || "Lead registrado" });
      }
    } catch (error: any) {
      console.error("[Leads API Error]:", error.message);
      res.status(500).json({ success: false, error: "Error al registrar Lead" });
    }
  });

  // Chat Proxy (Apps Script Motor)
  app.post("/api/chat", async (req, res) => {
    const { message, history } = req.body;
    
    try {
      console.log(`[Chat] Routing message to motor...`);
      
      const payload = {
        _token: VALID_TOKEN,
        messages: (history || []).concat({ role: 'user', content: message })
      };

      const response = await fetch(INVENTORY_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        redirect: "follow"
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Apps Script Error (${response.status}): ${errText.substring(0, 100)}`);
      }
      
      const json: any = await response.json();
      
      // The Apps Script returns the Claude message structure
      if (json.content && Array.isArray(json.content) && json.content[0]?.text) {
        return res.json({ text: json.content[0].text });
      }

      // Fallback for other formats
      const reply = json.reply || json.text || (typeof json === 'string' ? json : "Respuesta recibida en formato desconocido.");
      res.json({ text: reply });

    } catch (error: any) {
      console.error("[Chat API Error]:", error.message);
      res.status(500).json({ error: "Error de comunicación con el motor inteligente" });
    }
  });

  // Catch-all for missing API routes to prevent HTML fallback
  app.all("/api/*", (req, res) => {
    console.warn(`[404] API Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ 
      error: "Ruta de API no encontrada", 
      method: req.method,
      path: req.url 
    });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[READY] Server running on http://localhost:${PORT}`);
    console.log(`[ENV] Gemini Key: ${process.env.GEMINI_API_KEY ? 'Set' : 'Missing'}`);
    console.log(`[ENV] Anthropic Key: ${process.env.ANTHROPIC_API_KEY ? 'Set' : 'Missing'}`);
  });
}

// Global error handler for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();
