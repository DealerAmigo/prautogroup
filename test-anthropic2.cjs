const Anthropic = require("@anthropic-ai/sdk");
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
async function run(modelId) {
  try {
    await anthropic.messages.create({
      model: modelId,
      max_tokens: 10,
      messages: [{ role: "user", content: "hi" }]
    });
    console.log("SUCCESS with", modelId);
  } catch (e) {
    console.log("ERROR with", modelId, ":", e.message);
  }
}
async function testAll() {
  await run("claude-3-5-sonnet-20241022");
  await run("claude-sonnet-4-6");
  await run("claude-sonnet-4-5");
  await run("claude-sonnet-4-0");
}
testAll();
