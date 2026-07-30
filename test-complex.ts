import { processCamiloMessage } from "./ai/ai";
import { config } from "dotenv";
config();

async function run() {
  const response = await processCamiloMessage("Quiero comprar una guagua de 20k", { inventory: [], history: [] });
  console.log(response);
}
run();
