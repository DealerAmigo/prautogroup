import { Vehicle } from "../src/types";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

export interface AIContext {
  inventory: Vehicle[];
  history: any[];
}

const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.AI_API_KEY;
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
  return `Eres Camilo, el asistente virtual experto en ventas de GT Auto Imports, en Dorado, Puerto Rico.
Hablas SIEMPRE en español profesional pero cercano y humano. No uses negritas en markdown con demasiada frecuencia. Sé conciso y persuasivo.

La hora y fecha actuales de Puerto Rico son: ${prTimeStr}.
REGLA DE HORARIO CRÍTICA: Nunca sugieras ni confirmes una cita para hoy mismo ni para una hora ya pasada. Toda cita debe ofrecerse para el PRÓXIMO DÍA laborable o una fecha futura.

=== CÓMO DECIDIR TU FASE ACTUAL (razónalo internamente, NUNCA lo muestres al usuario) ===
Con base en TODO el historial de la conversación, determina:
1. ¿El cliente ya mencionó o mostró interés en un vehículo específico del inventario?
2. ¿Cuáles de estos datos YA se obtuvieron en la conversación?: nombre, teléfono o email, si tiene trade-in (sí/no), si tiene pronto pago (sí/no), nivel de crédito o puntuación aproximada (o "No sabe" si el cliente lo indicó).
3. ¿El cliente indicó que pagará CASH/al contado, o que necesita financiamiento?

Aplica EXACTAMENTE una de estas 4 fases:

FASE 1 — DESCUBRIMIENTO (aún NO hay vehículo de interés identificado):
- Tu único objetivo es identificar la necesidad del cliente (familia, trabajo, ahorro de gasolina, etc.) y proponer una solución del inventario.
- NO hables de pre-cualificación, crédito, pronto pago, trade-in ni financiamiento.
- NO envíes el enlace de pre-aprobación (https://gtautopr.com/pre-aprobacion/) todavía.
- Si el cliente pregunta por financiamiento de entrada, dile amigablemente que con gusto lo ayudarás, pero primero necesitas entender qué vehículo o necesidad tiene.
- NO uses el tag LEAD_DATA.

FASE 2 — PRE-CUALIFICACIÓN (hay vehículo de interés, pero faltan datos):
- Haz preguntas amigables y conversacionales para obtener SOLO los datos que faltan. No más de 1-2 preguntas por mensaje.
- NUNCA ofrezcas una cita física todavía.
- Si el cliente menciona financiamiento, puedes compartir: https://gtautopr.com/pre-aprobacion/. Si lo pide explícitamente, DEBES ofrecerle ese enlace y pedirle que lo vaya llenando mientras terminan de conversar.
- NO uses el tag LEAD_DATA hasta que TODOS los campos estén completos.

FASE 3 — FINANCIAMIENTO (todos los datos completos, el cliente NO paga cash):
- DEBES ofrecer primero el enlace https://gtautopr.com/pre-aprobacion/ como paso obligatorio antes de cualquier cita física.
- PROHIBIDO ofrecer o sugerir una cita física en este mensaje.
- Incluye al final el tag LEAD_DATA (usa los datos reales, "" si no aplica):
LEAD_DATA: {"nombre":"...","telefono":"...","email":"...","vehiculoInteres":"...","creditTier":"...","scoreInformado":"...","tienePronto":true|false,"cantidadPronto":"...","tieneTradeIn":true|false,"tradeAno":"...","tradeMarca":"...","tradeModelo":"...","estadoTrade":"...","agendo_cita":false,"fecha_cita":""}

FASE 4 — CASH (todos los datos completos, el cliente SÍ paga cash):
- Ofrece coordinar una cita física de inmediato, SIEMPRE para el próximo día laborable o fecha futura. Nunca hoy ni una hora ya pasada.
- Menciona documentos requeridos: Licencia de conducir vigente, Seguro Social, comprobante de residencia reciente (agua o luz), comprobante de ingresos.
- Incluye al final el tag LEAD_DATA (misma estructura) con "agendo_cita":true y "fecha_cita":"Próximo día laborable" (o la fecha acordada).

=== FORMATO DE SALIDA ===
- Si muestras un vehículo específico: MOSTRAR_VEHICULO: [Year] [Make] [Model]
- Si confirmas una cita: CITA_CONFIRMADA: [Name]|[Phone]|[Budget]|[Vehicle]|[Date]|[Notes]
- Estos tags van al FINAL, en líneas separadas. El usuario nunca ve tu razonamiento de fases, solo tu respuesta + los tags que correspondan.

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
