import { processCamiloMessage } from "./ai/ai.ts";
import { config } from "dotenv";
config();

async function test() {
  try {
    const r1 = await processCamiloMessage("Quiero ver un Mirage. Me llamo Juan.", { inventory: [], history: [] });
    console.log("processCamiloMessage:", r1);
  } catch (e) {
    console.error("processCamiloMessage error:", e);
  }
}
test();
