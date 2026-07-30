import { processCamiloMessage } from "./ai/ai";

async function run() {
  const history: any[] = [];
  
  console.log("=== STEP 1: User asks about a car ===");
  const m1 = "Hola, me interesa la Hyundai Tucson 2022";
  const r1 = await processCamiloMessage(m1, { inventory: [], history });
  console.log("CAMILO:", r1);
  history.push({ role: "user", content: m1 }, { role: "assistant", content: r1 });

  console.log("\n=== STEP 2: User accepts test drive ('Sí me gustaría') ===");
  const m2 = "Sí me gustaría probarla";
  const r2 = await processCamiloMessage(m2, { inventory: [], history });
  console.log("CAMILO:", r2);
  history.push({ role: "user", content: m2 }, { role: "assistant", content: r2 });

  console.log("\n=== STEP 3: User specifies day ('Mañana') ===");
  const m3 = "Mañana";
  const r3 = await processCamiloMessage(m3, { inventory: [], history });
  console.log("CAMILO:", r3);
  history.push({ role: "user", content: m3 }, { role: "assistant", content: r3 });

  console.log("\n=== STEP 4: User specifies time + contact info ('10am, me llamo Pedro Gomez 7871112222') ===");
  const m4 = "10am, me llamo Pedro Gomez y mi num es 7871112222";
  const r4 = await processCamiloMessage(m4, { inventory: [], history });
  console.log("CAMILO:", r4);
  history.push({ role: "user", content: m4 }, { role: "assistant", content: r4 });

  console.log("\n=== STEP 5: User says 'Gracias' ===");
  const m5 = "Gracias";
  const r5 = await processCamiloMessage(m5, { inventory: [], history });
  console.log("CAMILO:", r5);
  history.push({ role: "user", content: m5 }, { role: "assistant", content: r5 });
}

run().catch(console.error);
