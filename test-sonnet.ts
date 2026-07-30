import Anthropic from "@anthropic-ai/sdk";

const key = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || process.env.AI_API_KEY;
if (key) {
  const anthropic = new Anthropic({ apiKey: key });
  try {
    const res = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 50,
      messages: [{ role: "user", content: "Hola, responde OK" }]
    });
    console.log("SUCCESS:", res.content[0].type === "text" ? res.content[0].text : "other");
  } catch (e: any) {
    console.error("FAILED:", e.message);
  }
}
