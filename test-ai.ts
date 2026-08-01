import { processCamiloMessage } from "./ai/ai.ts";
processCamiloMessage("hello", { inventory: [], history: [] }).then(() => console.log("Success!")).catch(console.error);
