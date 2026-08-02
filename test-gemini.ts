import { GoogleGenAI } from "@google/genai";
const geminiKey = process.env.GEMINI_API_KEY;
const gemini = geminiKey ? new GoogleGenAI({ apiKey: geminiKey }) : null;

async function testGeminiModel(model: string) {
  if (!gemini) {
    console.log("No GEMINI_API_KEY");
    return;
  }
  try {
    const res = await gemini.models.generateContent({
      model,
      contents: "hi"
    });
    console.log(`GEMINI SUCCESS: ${model} -> ${res.text?.substring(0, 30)}`);
  } catch (e: any) {
    console.log(`GEMINI FAILED: ${model} -> ${e.message}`);
  }
}

async function main() {
  await testGeminiModel("gemini-3.6-flash");
  await testGeminiModel("gemini-flash-latest");
}

main();
