import { processCamiloMessage } from "./ai/ai";
import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
async function run() {
    try {
        console.log("STARTING TEST PROD...");
        const prTimeStr = "now";
        const systemPrompt = "test system prompt";
        const msg = await anthropic.messages.create({
            model: "claude-sonnet-5",
            max_tokens: 1024,
            messages: [{ role: "user", content: "¿Me pueden tasar mi trade-in?" }]
        });
        console.log("MSG:", JSON.stringify(msg, null, 2));
    } catch(e) {
        console.error("ERROR:", e);
    }
}
run();
