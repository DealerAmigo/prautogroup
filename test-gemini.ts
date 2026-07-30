import { GoogleGenAI } from "@google/genai";
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function main() {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
  const data = await response.json();
  console.log(data.models.map(m => m.name));
}
main().catch(console.error);
