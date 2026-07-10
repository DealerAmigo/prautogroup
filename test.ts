import { processAI, generateResponse } from "./ai/ai.ts";
import { config } from "dotenv";
config();

async function test() {
  try {
    const r1 = await processAI("Quiero ver un Mirage. Me llamo Juan.", { inventory: [], history: [] });
    console.log("processAI:", r1);
  } catch (e) {
    console.error("processAI error:", e);
  }

  try {
    const r2 = await generateResponse("Hola", "Responde hola.", { inventory: [], history: [] });
    console.log("generateResponse:", r2);
  } catch (e) {
    console.error("generateResponse error:", e);
  }
}
test();
