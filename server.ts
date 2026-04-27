import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // APIs Setup
  const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY || "");
  const anthropic = process.env.ANTHROPIC_API_KEY 
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

  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, systemInstruction, tools } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      if (anthropic) {
        // Use Claude
        console.log("Calling Claude 3.7 Sonnet (Latest)...");
        const anthropicMessages: any[] = (history || [])
          .filter((h: any) => h.parts && h.parts.length > 0 && h.parts[0].text)
          .map((h: any) => ({
            role: h.role === "model" ? "assistant" : "user",
            content: h.parts[0].text,
          }));
        
        anthropicMessages.push({ 
          role: "user", 
          content: message 
        });

        // Map tools if available
        let anthropicTools: any = undefined;
        if (tools && tools[0] && tools[0].functionDeclarations) {
          anthropicTools = tools[0].functionDeclarations.map((fn: any) => ({
            name: fn.name,
            description: fn.description,
            input_schema: {
              type: "object",
              properties: Object.entries(fn.parameters.properties || {}).reduce((acc: any, [key, val]: [string, any]) => {
                acc[key] = {
                  type: val.type.toLowerCase(),
                  description: val.description
                };
                return acc;
              }, {}),
              required: fn.parameters.required || []
            }
          }));
        }

        const response = await anthropic.messages.create({
          model: "claude-3-7-sonnet-latest",
          max_tokens: 2048,
          system: systemInstruction,
          messages: anthropicMessages,
          tools: anthropicTools,
        });

        const textContent = response.content.find(c => c.type === 'text');
        const toolCalls = response.content.filter(c => c.type === 'tool_use');
        
        const functionCalls = toolCalls.map((tc: any) => ({
          name: tc.name,
          args: tc.input
        }));

        return res.json({
          text: textContent && 'text' in textContent ? textContent.text : '',
          functionCalls: functionCalls.length > 0 ? functionCalls : null
        });
      } else {
        // Fallback to Gemini if no Anthropic key
        const chatModel = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          systemInstruction,
          tools,
        });

        const chat = chatModel.startChat({
          history: history || [],
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        
        res.json({
          text: response.text(),
          functionCalls: response.functionCalls ? response.functionCalls() : null
        });
      }
    } catch (error: any) {
      console.error("Gemini Server Error:", error);
      res.status(500).json({ error: error.message });
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
