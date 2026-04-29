import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { google } from "googleapis";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// AI Setup
const aiKey = process.env.GEMINI_API_KEY;
const ai = aiKey ? new GoogleGenerativeAI(aiKey) : null;

// Google Sheets & Apps Script URLs
const INVENTORY_CSV_URL = "https://docs.google.com/spreadsheets/d/1eP8zbvY5Ifsno2g2AsJoc5YV4q-PxNxzQaM6SSNy-dk/export?format=csv";
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw4v2NF-Vv-7Ge-T7MPqfAfUD5zDemwl_PJXybg6oyu702i8imxQKMhyTfdzByr45hyMg/exec";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      geminiConfigured: !!ai
    });
  });

  // Fetch Inventory directly via CSV (More reliable than Apps Script for reading large data)
  app.get("/api/inventory", async (req, res) => {
    try {
      const response = await fetch(INVENTORY_CSV_URL);
      if (!response.ok) throw new Error("No se pudo acceder al CSV de la hoja.");
      const csvText = await response.text();
      res.send(csvText); // Send raw CSV to be parsed by the client
    } catch (error: any) {
      console.error("[Inventory Error]:", error.message);
      res.status(500).json({ error: "Failed to load inventory" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      if (!ai) {
        throw new Error("GEMINI_API_KEY is not configured on the server.");
      }

      const { message, history, systemInstruction, tools } = req.body;
      const model = ai.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction,
      });

      const chat = model.startChat({
        history: history.map((h: any) => ({
          role: h.role === "model" ? "model" : "user",
          parts: h.parts.map((p: any) => {
            if (p.functionCall) return { functionCall: p.functionCall };
            if (p.functionResponse) return { functionResponse: p.functionResponse };
            return { text: p.text };
          }),
        })),
        tools: tools ? [{ functionDeclarations: tools }] : undefined,
      });

      const result = await chat.sendMessage(message || "");
      const response = result.response;
      
      const candidates = response.candidates || [];
      const parts = candidates[0]?.content?.parts || [];

      return res.json({
        text: response.text(),
        functionCalls: parts.filter(p => p.functionCall).map(p => p.functionCall)
      });

    } catch (error: any) {
      console.error("[API Chat Error]:", error);
      res.status(500).json({ error: "AI processing failed", details: error.message });
    }
  });

  // Lead Registration via Apps Script (Forwarding exactly what Apps Script expects)
  app.post("/api/leads", async (req, res) => {
    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
        redirect: "follow"
      });

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("[Apps Script Error] saving lead:", error.message);
      res.json({ success: false, error: error.message });
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
