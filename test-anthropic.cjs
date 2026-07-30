const Anthropic = require("@anthropic-ai/sdk");
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
async function run() {
  try {
    await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 10,
      messages: [{ role: "user", content: "hi" }]
    });
    console.log("SUCCESS with claude-3-5-sonnet-latest");
  } catch (e) {
    console.log("ERROR with claude-3-5-sonnet-latest:", e.message);
  }
}
run();
