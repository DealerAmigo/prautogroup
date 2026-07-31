import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function testClaudeFull() {
  try {
    console.log("Calling claude-sonnet-5...");
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: "Eres Camilo, asistente de ventas de GT Auto Imports.",
      messages: [{ role: "user", content: "Hola, busco una SUV" }]
    });
    console.log("ALL BLOCKS:", msg.content);
    const textBlock = msg.content.find((b: any) => b.type === "text") as { type: string; text: string } | undefined;
    console.log("EXTRACTED TEXT:", textBlock ? textBlock.text : "NONE");
  } catch (err: any) {
    console.log("ERROR:", err);
  }
}

testClaudeFull();
