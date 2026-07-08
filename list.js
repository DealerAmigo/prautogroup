import { GoogleGenAI } from "@google/genai";
async function run() {
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const res = await ai.models.list();
for await (const m of res) { console.log(m.name); }
}
run().catch(console.error);
