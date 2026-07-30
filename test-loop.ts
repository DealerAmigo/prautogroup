import { processCamiloMessage } from "./ai/ai";

async function run() {
  const history = [
    { role: "user", content: "Hola, me interesa la Nissan Rogue 2021" },
    { role: "assistant", content: "¡Excelente elección! La Nissan Rogue 2021 es muy cómoda y espaciosa. ¿Le gustaría coordinar una prueba de manejo para que la vea en persona?" },
    { role: "user", content: "Sí, me gustaría ir el sábado" },
    { role: "assistant", content: "Perfecto, ¿a qué hora le viene mejor el sábado? Estamos abiertos de 9:00 AM a 6:00 PM." },
    { role: "user", content: "A las 10:00 AM, me llamo Carlos Rivera y mi teléfono es 787-555-9999" },
    { role: "assistant", content: "¡Excelente Carlos! Su cita para ver la Nissan Rogue 2021 queda confirmada para este sábado a las 10:00 AM. Para su cita, por favor traiga: Licencia de conducir, Tarjeta de Seguro Social, Comprobante de residencia, y Comprobante de ingreso.\n\nCITA_CONFIRMADA: Carlos Rivera|787-555-9999|Cash|Nissan Rogue 2021|2026-08-01 10:00|Prueba de manejo\nLEAD_DATA: {\"nombre\":\"Carlos Rivera\",\"telefono\":\"787-555-9999\",\"vehiculoInteres\":\"Nissan Rogue 2021\",\"agendo_cita\":true,\"fecha_cita\":\"2026-08-01 10:00\",\"eventType\":\"cita_confirmada\"}\nNUDGES: ..." }
  ];

  console.log("=== USER SAYS 'Gracias, allá nos vemos' ===");
  const res1 = await processCamiloMessage("Gracias, allá nos vemos", { inventory: [], history });
  console.log("RESPONSE 1:", res1);

  console.log("\n=== USER SAYS 'Ok perfecto' AFTER THAT ===");
  const history2 = [
    ...history,
    { role: "user", content: "Gracias, allá nos vemos" },
    { role: "assistant", content: res1 }
  ];
  const res2 = await processCamiloMessage("Ok perfecto", { inventory: [], history: history2 });
  console.log("RESPONSE 2:", res2);
}

run().catch(console.error);
