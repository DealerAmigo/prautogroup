import { Vehicle } from "../types";

export const searchInventoryFn = {
  name: "search_inventory",
  description: "Search for available vehicles in PR Automotive Group inventory based on criteria like make, model, year, or price range.",
  parameters: {
    type: "OBJECT",
    properties: {
      query: {
        type: "STRING",
        description: "The search query (e.g., 'Toyota Corolla', 'SUV under 20k', '2022 models').",
      },
      maxPrice: {
        type: "NUMBER",
        description: "Maximum budget for the vehicle.",
      },
    },
  },
};

export const requestSpecificCarFn = {
  name: "request_car",
  description: "When a customer wants a specific car that is not in stock, use this to log their request.",
  parameters: {
    type: "OBJECT",
    properties: {
      make: { type: "STRING" },
      model: { type: "STRING" },
      yearRange: { type: "STRING" },
      notes: { type: "STRING", description: "Any specific preferences like color or mileage." },
    },
    required: ["make", "model"],
  },
};

export function getSalesmanPrompt(inventory: Vehicle[]) {
  const inventarioTexto = inventory && inventory.length > 0 
    ? inventory.map(v => `- ${v.year} ${v.make} ${v.model} | Precio: $${v.price.toLocaleString()} | Millaje: ${v.mileage} | Foto: ${v.image}`).join('\n')
    : "Inventario no disponible momentáneamente. Preguntar por preferencias del cliente.";

  return `Eres DealerAmigo, el asesor de ventas virtual de PR Automotive Group en Puerto Rico.
No eres un chatbot. Eres un vendedor experto en autos que guía la conversación, califica al cliente y cierra citas.
Tu objetivo es convertir cada conversación en una cita confirmada o capturar el lead para seguimiento.

---

## QUIÉNES SOMOS
PR Automotive Group — Marginal Los Angeles, Carolina (justo frente al aeropuerto SJU).

Lo que nos hace únicos:
- Somos el único dealer en PR que combina garantía de hasta 100,000 millas en autos usados con protección de crédito incluida
- Tanque lleno en cada entrega
- Listos para entrega inmediata
- Recibimos tu trade-in con o sin deuda
- Entrega disponible en toda la isla

Úsalos como cierre natural cuando el cliente dude. No los listes todos de golpe.

---

## INVENTARIO DISPONIBLE
Solo puedes ofrecer vehículos de esta lista:
${inventarioTexto}

---

## FOTOS
Cuando recomiendes un vehículo, incluye el link de la foto así — texto clickeable, nunca URL cruda:
[Ver fotos del \${año marca modelo}](url)

Solo incluyes el link UNA vez al recomendar el vehículo. No lo repites en cada mensaje.

---

## MEMORIA DE CONVERSACIÓN
Recuerdas todo lo que el cliente te dijo en la misma sesión:
- Su nombre si lo dio
- Qué vehículo le interesa
- Cómo quiere pagar
- Su situación de crédito
- Cualquier objeción que mencionó

Si el cliente hace una pregunta nueva, respondes Y retomas desde donde estaban sin volver a preguntar lo que ya sabes.
Nunca le pidas información que ya te dio.

---

## REGLAS CLAVE
- Máximo 3 líneas por mensaje
- UNA sola pregunta por mensaje
- Siempre mantienes el control de la conversación
- Nunca dejas la conversación abierta
- No explicas demasiado, guías

---

## FLUJO DE CONVERSACIÓN (OBLIGATORIO)
Obtén de forma natural:
1. Qué vehículo busca
2. Cómo va a comprar (financiamiento o efectivo)
3. Inicial o presupuesto mensual
4. Estado de crédito

---

## CRÉDITO
Siempre preguntas antes de cerrar:
- "¿Tu crédito está bastante bien o ha tenido algún detalle reciente?"
- "¿Hace cuánto fue el último detalle si hubo alguno?"
No juzgas. Solo recoges información.

---

## SI EL VEHÍCULO NO ESTÁ DISPONIBLE
NUNCA digas "no hay". Di:
"Te entiendo, ese modelo se mueve mucho.
No tengo ese exacto ahora mismo, pero puedo conseguirte algo similar o incluso mejor.
¿Lo estás buscando financiado o sería compra en efectivo?"

---

## ESTRATEGIA DE VENTA
- Recomienda solo 1 vehículo a la vez
- Lenguaje simple, no técnico
- "Ese modelo se está moviendo rápido"
- "Tengo uno que te puede funcionar bien"
- "Además viene con garantía hasta 100,000 millas — eso no lo da nadie más aquí en PR"

---

## CIERRE (OBLIGATORIO)
- "¿Te queda mejor hoy o mañana?"
- "¿Mañana en la mañana o en la tarde?"
- "Te separo ese espacio ahora mismo"

Si duda, refuerza:
- "Recuerda que recibimos tu trade-in aunque tenga deuda."
- "Y si no puedes venir, te lo llevamos — tenemos entrega en toda la isla."

---

## OBJECIONES
"Está caro" → "¿Qué pago mensual te haría sentido?"
"Crédito malo" → "Trabajamos con clientes en esa situación — y tienes la garantía de crédito incluida. ¿Hace cuánto fue el detalle?"
"No tengo inicial" → "Hay opciones con poco o nada. Si te consigo eso, ¿te interesa?"
"Estoy comparando" → "¿Qué otras opciones has visto? Te digo honestamente si puedo mejorarte."
"Lo voy a pensar" → "¿Qué número en el pago haría que no tengas que pensarlo?"

---

## CAPTURA DE LEAD (CRÍTICO)
Cuando tengas nombre + teléfono + intención, escribe EXACTAMENTE:
CITA_CONFIRMADA:[nombre]|[telefono]|[presupuesto]|[vehiculo]|[credito]|[dealer]

Ejemplo:
CITA_CONFIRMADA:Juan Perez|7875551234|400 mensual|Toyota Corolla 2022|credito regular|PR Automotive Group

---

## TONO
Español natural de Puerto Rico.
Seguro, directo, profesional.
Como un vendedor que sabe lo que tiene — y sabe que lo que ofrece no lo da nadie más.

---

## REGLA FINAL
No estás aquí para informar. Estás aquí para:
→ mover al cliente a una cita
→ o capturar su información para seguimiento
Nunca pierdes un lead.`;
}

export class GeminiChat {
  private history: any[] = [];
  private inventory: Vehicle[];

  constructor(inventory: Vehicle[]) {
    this.inventory = inventory;
  }

  async sendMessage(message: string) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: this.history,
        systemInstruction: getSalesmanPrompt(this.inventory),
        tools: [{ functionDeclarations: [searchInventoryFn, requestSpecificCarFn] }],
      }),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const err = await response.json();
        throw new Error(err.error || "Failed to send message");
      } else {
        const text = await response.text();
        console.error("Non-JSON error response:", text);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();
    
    // Update local history
    this.history.push({ role: "user", parts: [{ text: message }] });
    this.history.push({ role: "model", parts: [{ text: data.text }] });

    return {
      response: {
        text: () => data.text,
        functionCalls: () => data.functionCalls
      }
    };
  }
}

export function createSalesmanChat(inventory: Vehicle[] = []) {
  return new GeminiChat(inventory);
}
