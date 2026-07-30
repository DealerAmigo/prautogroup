import { processCamiloMessage } from "./ai/ai";
async function run() {
    try {
        console.log("STARTING TEST PROD...");
        const res = await processCamiloMessage("Hola, quiero un auto", { inventory: [], history: [] });
        console.log("RESULT:", res);
    } catch(e) {
        console.error("ERROR:", e);
    }
}
run();
