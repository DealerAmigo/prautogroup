import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Google Sheets & Apps Script URLs
const INVENTORY_CSV_URL = "https://docs.google.com/spreadsheets/d/1eP8zbvY5Ifsno2g2AsJoc5YV4q-PxNxzQaM6SSNy-dk/export?format=csv";
const LEADS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby84hfUAZ4ddagrcaE85eKjnjDzl5OGU2UiccHlMsosgjNmraYhLj-qx77HHb13JvCY/exec";

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

  // Lead Registration via Apps Script (Forwarding exactly what Apps Script expects)
  app.post("/api/leads", async (req, res) => {
    try {
      const response = await fetch(LEADS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
        redirect: "follow"
      });

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        res.json(data);
      } catch (e) {
        console.error("[Apps Script Lead Error] Result not JSON:", text.substring(0, 500));
        res.json({ success: false, error: "Apps Script no devolvió JSON válido" });
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
