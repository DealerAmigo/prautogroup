import { GoogleGenAI } from "@google/genai";
import { config } from "dotenv";
config();

const geminiKey = process.env.GEMINI_API_KEY;
if (geminiKey) {
  const gemini = new GoogleGenAI({ apiKey: geminiKey });
  gemini.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Hola, responde OK"
  }).then(res => console.log("GEMINI SUCCESS:", res.text)).catch(e => console.error("GEMINI FAILED:", e.message));
} else {
  console.log("No GEMINI_API_KEY");
}
