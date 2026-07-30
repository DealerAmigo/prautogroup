import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
async function main() {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 100,
    messages: [{ role: "user", content: "hello" }]
  });
  console.log(msg);
}
main().catch(console.error);
