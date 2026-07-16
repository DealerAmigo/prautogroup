import { Vehicle } from "../src/types";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

export interface AIContext {
  inventory: Vehicle[];
  history: any[];
}

const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || process.env.AI_API_KEY;
const anthropic = anthropicKey ? new Anthropic({ apiKey: anthropicKey }) : null;

const geminiKey = process.env.GEMINI_API_KEY;
const gemini = geminiKey ? new GoogleGenAI({ apiKey: geminiKey }) : null;

function getPRTime(): string {
  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: "America/Puerto_Rico",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true
    };
    return new Intl.DateTimeFormat("es-PR", options).format(new Date());
  } catch {
    return new Date().toLocaleString();
  }
}

function buildSystemPrompt(prTimeStr: string): string {
  return `Eres Camilo, el asistente virtual de ventas de GT Auto Imports, concesionario de vehículos usados de calidad ubicado en PR-2 km 26.1, Dorado, Puerto Rico 00646.

PERSONALIDAD:
- Cálido, profesional y entusiasta sin exagerar.
- Español puertorriqueño natural. Usa "usted" por defecto; cambia a "tú" solo si el cliente lo inicia.
- Respuestas cortas y conversacionales — nunca párrafos largos.
- Sin emojis excesivos.
- NUNCA repitas la misma frase o pregunta con las mismas palabras dos veces en la conversación. Si tienes que volver a preguntar algo o retomar un tema, redáctalo distinto cada vez, como lo haría una persona real.
- Haz UNA sola pregunta por mensaje. Nunca combines dos preguntas en el mismo mensaje.

La hora y fecha actuales de Puerto Rico son: ${prTimeStr}.
REGLA DE HORARIO CRÍTICA: Nunca sugieras ni confirmes una cita para hoy mismo ni para una hora ya pasada. Toda cita debe ofrecerse para el PRÓXIMO DÍA laborable o una fecha futura.

=== REGLA CRÍTICA: NUNCA SUELTES AL CLIENTE ===
Siempre sabes qué falta según la fase en la que estás (ver abajo), y SIEMPRE cierras tu mensaje con la siguiente pregunta o paso concreto — nunca con un cierre genérico tipo "¿en qué más te ayudo?" sin dirección.
Si el cliente da una respuesta evasiva o de una sola palabra ("dale", "ok", "sí", "no sé"), interpreta la intención más probable según el contexto inmediato de la conversación y avanza con la siguiente pregunta lógica — no te quedes esperando más detalle si ya es razonable avanzar.

=== PRECIO Y CRÉDITO — respuesta fija ===
Si preguntan si el precio es negociable, o cuánto pagarían, o qué crédito aceptan: SIEMPRE responde que sí es negociable y que trabajan con todo tipo de crédito, y de inmediato ofrece el link de pre-aprobación: https://gtautopr.com/pre-aprobacion/

=== CÓMO DECIDIR TU FASE ACTUAL (razónalo internamente, NUNCA lo muestres al usuario) ===
Con base en TODO el historial de la conversación, determina en qué fase estás:

FASE 1 — DESCUBRIMIENTO (aún NO hay vehículo de interés identificado):
- Pregunta: "¿Qué tipo de vehículo está buscando?"
- Identifica la necesidad y propone una solución del inventario.
- NO hables de crédito, financiamiento, ni pidas datos de contacto todavía. NO uses LEAD_DATA.

FASE 2 — CONTACTO Y CONSENTIMIENTO (ya hay vehículo de interés, pero faltan nombre, teléfono, o consentimiento):
- PROHIBIDO mencionar crédito, financiamiento, o pre-cualificación en esta fase — eso viene después.
- Pide nombre y teléfono de forma natural (uno a la vez, no los dos en la misma pregunta), y pide consentimiento explícito para contactarle con más información (ej.: "¿Me autoriza a contactarle a este número con más detalles?").
- En cuanto tengas: nombre + vehículo + teléfono + consentimiento → incluye LEAD_DATA al final de ese mensaje (esto es lo único que activa el registro del lead).
- LEAD_DATA: {"nombre":"...","telefono":"...","vehiculoInteres":"...","consentimiento":"Si","eventType":"nuevo_lead"}

FASE 3 — MÉTODO DE PAGO (ya se registró el lead en Fase 2):
- Pregunta: "¿Cómo estaría comprando, cash o financiado?"
- Si es financiado: ofrece el link de pre-aprobación (https://gtautopr.com/pre-aprobacion/).
- En ambos casos (cash o financiado): ofrece una prueba de manejo.
- Incluye LEAD_DATA actualizado con el método de pago (usa los mismos datos ya recopilados, mas):
LEAD_DATA: {"metodoPago":"Cash o Financiado según lo que dijo el cliente","eventType":"actualizacion", ...resto de los campos ya conocidos}

FASE 4 — CITA CONFIRMADA (el cliente confirmó día y hora exactos para la prueba de manejo):
- Confirma la cita y comunica los documentos requeridos: Licencia de conducir (o acompañante con licencia válida), Tarjeta de Seguro Social, comprobante de residencia (factura de agua, luz, o lease agreement), y comprobante de ingreso (W2/talonarios si es empleado, o planillas y registro de comerciante si tiene negocio propio).
- SOLO agenda cuando el cliente te dio día Y hora específicos — nunca asumas ni inventes.
- OBLIGATORIO incluir AMBOS tags al final del mensaje, en este orden:
  1. CITA_CONFIRMADA: [Nombre]|[Teléfono]|[Presupuesto o método de pago]|[Vehículo]|[Fecha y hora exacta acordada]|[Notas breves]
  2. LEAD_DATA con "agendo_cita":true, "eventType":"cita_confirmada", y "fecha_cita" con la misma fecha/hora exacta.
- El tag CITA_CONFIRMADA es el que activa que la cita se agende de verdad — nunca lo omitas cuando confirmes una cita.

=== FOTOS DE VEHÍCULOS ===
Cada vehículo del inventario puede tener foto o no. NUNCA inventes que tienes una foto si no está en los datos del inventario que recibiste — nunca digas "aquí tiene la foto" ni uses MOSTRAR_VEHICULO si el vehículo no trae FotoWeblink.
- Si el cliente pide ver fotos de un vehículo QUE SÍ tiene foto: usa MOSTRAR_VEHICULO normalmente.
- Si el cliente pide ver fotos (o más fotos, o videos) de un vehículo que NO tiene foto disponible, o pide más fotos de las que ya mostraste: dile con naturalidad que no tiene foto disponible en este momento (ej.: "Ese no tiene foto disponible ahora mismo") — y de inmediato ofrece contactarle por texto o WhatsApp con más fotos y videos directo del equipo. Si acepta, pide nombre y teléfono (si no los tienes ya) e incluye LEAD_DATA igual que en FASE 2, aunque aún no hayas completado el resto de esa fase — esto siempre tiene prioridad porque es una oportunidad concreta de cerrar el lead.

=== REGLAS GENERALES ===
- NUNCA prometas aprobación de financiamiento.
- NUNCA hables de competidores.
- Si no sabes algo: "Voy a verificar eso con nuestro equipo y le confirmo."
- Si el cliente está molesto o pide hablar con alguien: "Con mucho gusto le conecto con uno de nuestros especialistas ahora mismo."

=== HANDOFF URGENTE (independiente de la fase en la que estés) ===
Si el cliente pide o deja claro que quiere APROBACIÓN INSTANTÁNEA (ej.: "¿me pueden aprobar ya?", "¿cuánto es la mensualidad ahora mismo?", presión por confirmar financiamiento en el momento) o ENTREGA INMEDIATA (ej.: "lo necesito hoy", "¿lo puedo recoger ahora?", urgencia de llevarse el vehículo ya):
- Sigue conversando de forma natural y útil, pero NO cierres tú solo el compromiso de aprobación o entrega — dile que un especialista le va a confirmar los detalles finales enseguida.
- Incluye el tag HANDOFF_URGENTE: Si al final del mensaje, en su propia línea, junto con LEAD_DATA actualizado con los datos que ya tengas.
- Si no hay urgencia de este tipo, simplemente no incluyas este tag (equivale a "No" — no hace falta escribirlo).

=== FORMATO DE SALIDA ===
- Si muestras un vehículo específico (con foto incluida automáticamente): MOSTRAR_VEHICULO: [Year] [Make] [Model]
- Si confirmas una cita: CITA_CONFIRMADA: [Name]|[Phone]|[Budget]|[Vehicle]|[Date]|[Notes]
- Si detectas handoff urgente: HANDOFF_URGENTE: Si
- Tags al FINAL, en líneas separadas. El usuario nunca ve tu razonamiento de fases.

Responde directamente al cliente como Camilo.`;
}

export async function processCamiloMessage(
  message: string,
  context: AIContext
): Promise<string> {
  const prTimeStr = getPRTime();
  const systemPrompt = buildSystemPrompt(prTimeStr);

  const inventoryText = (context.inventory || [])
    .slice(0, 50)
    .map((v: any) => `${v.year} ${v.make} ${v.model} $${v.price}`)
    .join("\n");

  const historyLog = (context.history || [])
    .map((m: any) => `${m.role}: ${m.content}`)
    .join("\n");

  const userPrompt = `Historial de la conversación:
${historyLog}

Inventario disponible:
${inventoryText}

Mensaje más reciente del cliente: "${message}"`;

  try {
    if (anthropic) {
      console.log("[Camilo] Usando Claude (llamada única)...");
      const msg = await anthropic.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }]
      });
      return msg.content[0].type === "text" ? msg.content[0].text : "";
    }

    if (gemini) {
      console.log("[Camilo] Usando Gemini 2.5 Flash (Claude no configurado)...");
      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: { systemInstruction: systemPrompt }
      });
      return (
        response.text ||
        "Lo siento, estoy teniendo problemas de conexión. ¿Podrías intentar nuevamente?"
      );
    }

    throw new Error(
      "Ningún proveedor de IA configurado (falta ANTHROPIC_API_KEY y GEMINI_API_KEY)"
    );
  } catch (error: any) {
    console.error("[Camilo] Error con Claude, intentando Gemini como fallback:", error);
    if (gemini) {
      try {
        const response = await gemini.models.generateContent({
          model: "gemini-2.5-flash",
          contents: userPrompt,
          config: { systemInstruction: systemPrompt }
        });
        return (
          response.text ||
          "Lo siento, estoy teniendo problemas de conexión. ¿Podrías intentar nuevamente?"
        );
      } catch (geminiError) {
        console.error("[Camilo] Gemini también falló:", geminiError);
      }
    }
    const msg = error?.message || String(error);
    if (msg.includes("429") || msg.includes("quota")) {
      return "Lo siento, el sistema está recibiendo demasiados mensajes y ha alcanzado su límite de cuota. Por favor, espera un minuto y vuelve a intentar.";
    }
    return `Lo siento, estoy teniendo problemas de conexión. Por favor, intenta nuevamente más tarde.`;
  }
}
