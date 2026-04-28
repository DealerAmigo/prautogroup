import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

// Google Sheets Setup
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
async function getSheetsClient() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON) : undefined,
      scopes: SCOPES,
    });
    return google.sheets({ version: "v4", auth });
  } catch (error) {
    console.error("[Sheets] Auth Error:", (error as Error).message);
    return null;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // APIs Setup
  const anthropic = (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim().length > 0)
    ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    : null;

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      anthropicConfigured: !!process.env.ANTHROPIC_API_KEY,
      geminiConfigured: !!process.env.GEMINI_API_KEY
    });
  });

  // Lead Registration in Google Sheets
  app.post("/api/leads", async (req, res) => {
    console.log("[API] /api/leads - Processing...");
    try {
      const lead = req.body;
      const spreadsheetId = process.env.GOOGLE_SHEET_ID;
      
      if (!spreadsheetId) {
        console.warn("[Sheets] No Spreadsheet ID configured");
        return res.json({ success: true, savedLocally: true, message: "Lead processed (Simulation)" });
      }

      const sheets = await getSheetsClient();
      if (!sheets) {
        throw new Error("Could not initialize Sheets client");
      }

      const values = [
        [
          new Date().toISOString(),
          lead.name || lead.nombre || "N/A",
          lead.phone || lead.telefono || "N/A",
          lead.email || "N/A",
          lead.vehicleInterest || lead.vehiculo || "N/A",
          lead.notes || lead.presupuesto || lead.fullText || "N/A",
          lead.source || "Chat Assistant",
          lead.type || "Lead",
          lead.credito || "N/A"
        ]
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Leads!A:I",
        valueInputOption: "RAW",
        requestBody: { values },
      });

      console.log("[Sheets] Lead saved successfully");
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Sheets] Error saving lead:", error.message);
      // Don't fail the user request if sheets fails, just log it.
      // In a real app we might want to store in DB as fallback.
      res.json({ success: true, error: error.message });
    }
  });

  app.post("/api/chat", async (req, res) => {
    const messagePart = req.body.message?.substring(0, 50);
    console.log(`[API] /api/chat - Message: ${messagePart}...`);
    try {
      const { message, history, systemInstruction, tools } = req.body;
      
      const hasContent = (message && message.trim()) || (history && history.length > 0);
      if (!hasContent) {
        return res.status(400).json({ error: "No content provided" });
      }

      // If Anthropic is configured, we could handle it here.
      // But for now, the frontend handles Gemini directly.
      // We return a 501 or a specific message if no backend AI is ready.
      
      return res.status(501).json({ 
        error: "Backend chat not implemented",
        text: "La IA del servidor no está configurada. Usando IA local."
      });

    } catch (outerError: any) {
      console.error("[API] Error:", outerError.message);
      return res.status(500).json({ 
        error: "System error", 
        details: outerError.message
      });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
