import Anthropic from "@anthropic-ai/sdk";

const key = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || process.env.AI_API_KEY;
console.log("KEY EXISTS?", !!key);

if (key) {
  const anthropic = new Anthropic({ apiKey: key });
  try {
    const response = await anthropic.models.list();
    console.log("AVAILABLE MODELS:", response.data.map(m => m.id));
  } catch (e: any) {
    console.error("Failed to list models:", e.message);
  }
}
