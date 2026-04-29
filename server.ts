import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
      status: "ok"
    });
  });

  // Gemini Chat Proxy
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, systemInstruction, tools } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("Missing GEMINI_API_KEY in environment variables.");
      }

      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: systemInstruction
      });

      const chat = model.startChat({
        history: history || [],
        tools: tools || [],
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      
      res.json({
        text: response.text(),
        functionCalls: response.functionCalls() || []
      });
    } catch (error: any) {
      console.error("[Gemini API Error]:", error.message);
      res.status(500).json({ 
        error: "Internal Server Error during AI processing",
        details: error.message 
      });
    }
  });

  // Fetch Inventory directly via CSV
  app.get("/api/inventory", async (req, res) => {
    try {
      const response = await fetch(INVENTORY_CSV_URL);
      if (!response.ok) throw new Error("No se pudo acceder al CSV de la hoja.");
      const csvText = await response.text();
      res.send(csvText); 
    } catch (error: any) {
      console.error("[Inventory Error]:", error.message);
      res.status(500).json({ error: "Failed to load inventory" });
    }
  });

  // Lead Registration via Apps Script
  app.post("/api/leads", async (req, res) => {
    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
        redirect: "follow"
      });

      // El App Script a veces no devuelve JSON válido o redirecciona
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        res.json(data);
      } catch (e) {
        res.json({ success: true, message: "Lead enviado (respuesta no-JSON)" });
      }
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
