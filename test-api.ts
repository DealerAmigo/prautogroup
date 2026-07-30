import { processCamiloMessage } from "./ai/ai";
async function main() {
  const response = await processCamiloMessage("Hola", { inventory: [], history: [] });
  console.log("RESPONSE:", response);
}
main().catch(console.error);
