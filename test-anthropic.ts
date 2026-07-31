import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function testModel(model: string) {
  try {
    const msg = await anthropic.messages.create({
      model,
      max_tokens: 10,
      messages: [{ role: "user", content: "hi" }]
    });
    console.log(`SUCCESS: ${model}`);
  } catch (err: any) {
    console.log(`FAILED: ${model} -> ${err.message}`);
  }
}

async function main() {
  await testModel("claude-sonnet-5");
  await testModel("claude-3-5-sonnet-20241022");
  await testModel("claude-3-5-haiku-20241022");
  await testModel("claude-3-haiku-20240307");
  await testModel("claude-3-5-sonnet-latest");
}

main();
