import { Vehicle } from "../src/types";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI, Type } from "@google/genai";

export interface AIContext {
  inventory: Vehicle[];
  history: any[];
}

export interface AIResult {
  intent: string;
  message?: string;
  // extracted structured data
  leadId?: string;
  name?: string;
  phone?: string;
  email?: string;
  vehicleInterest?: string;
  creditTier?: "A" | "B" | "C" | "D" | "No credit";
  scoreInformado?: string;
  tienePronto?: boolean;
  cantidadPronto?: string;
  tieneTradeIn?: boolean;
  tradeAno?: string;
  tradeMarca?: string;
  tradeModelo?: string;
  estadoTrade?: string;
  agendoCita?: boolean;
  fechaCita?: string;
  wantsAppointment?: boolean;
  wantsFinancingInfo?: boolean;
  metodoPago?: "Financiamiento" | "Cash" | "No especificado";
  confidence?: number;
}

// Initialize Gemini (guaranteed to be available via process.env.GEMINI_API_KEY in the workspace)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Optional Anthropic client
const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.AI_API_KEY;
const anthropic = anthropicKey ? new Anthropic({ apiKey: anthropicKey }) : null;

/**
 * AI LAYER 1 (PURE INTERPRETER)
 * NO BUSINESS LOGIC HERE
 */
export async function processAI(
  message: string,
  context: AIContext
): Promise<AIResult> {
  try {
    const inventoryText = context.inventory
      ?.slice(0, 20)
      .map(v => `${v.year} ${v.make} ${v.model} ${v.price}`)
      .join("\n");

    const prompt = `You are an AI intent extractor for a car dealership chatbot.
Your ONLY job is to understand what the user wants and extract structured data from the entire conversation history.
DO NOT:
- give sales strategy
- schedule appointments
- decide CRM actions
- write emails
- simulate dealership flow

Return ONLY valid JSON.
User message:
${message}

Inventory (context):
${inventoryText}

Conversation history:
${JSON.stringify(context.history?.slice(-8) || [])}

Return format:
{
  "intent": "string",
  "name": "string | null",
  "phone": "string | null",
  "email": "string | null",
  "vehicleInterest": "string | null",
  "creditTier": "A | B | C | D | No credit | null",
  "scoreInformado": "string | null (Si el usuario no sabe o no dice, pon 'No sabe')",
  "tienePronto": boolean | null,
  "cantidadPronto": "string | null",
  "tieneTradeIn": boolean | null,
  "tradeAno": "string | null",
  "tradeMarca": "string | null",
  "tradeModelo": "string | null",
  "estadoTrade": "string | null",
  "agendoCita": boolean | null,
  "fechaCita": "string | null",
  "wantsAppointment": boolean,
  "wantsFinancingInfo": boolean,
  "metodoPago": "Financiamiento | Cash | No especificado",
  "confidence": number (0-1)
}`;

    // If Anthropic key is available, we can use Claude
    if (anthropic) {
      try {
        console.log("[AI Engine] Using Anthropic Claude for intent extraction...");
        const msg = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1024,
          temperature: 0.2,
          system: "You are a precise data extractor. Always return only JSON.",
          messages: [
            { role: "user", content: prompt }
          ]
        });

        const responseContent = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
        let parsed: AIResult;
        try {
            const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? jsonMatch[0] : responseContent;
            parsed = JSON.parse(jsonString);
            return parsed;
        } catch (parseError) {
          console.error("AI parse error from Claude:", parseError);
        }
      } catch (claudeError) {
        console.error("Claude processing error, falling back to Gemini:", claudeError);
      }
    }

    // Otherwise, or as fallback, use Gemini 3.5 Flash
    console.log("[AI Engine] Using Gemini 3.5 Flash for intent extraction...");
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a precise data extractor. Always return only JSON matching the requested schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: { type: Type.STRING },
            name: { type: Type.STRING, nullable: true },
            phone: { type: Type.STRING, nullable: true },
            email: { type: Type.STRING, nullable: true },
            vehicleInterest: { type: Type.STRING, nullable: true },
            creditTier: { type: Type.STRING, nullable: true },
            scoreInformado: { type: Type.STRING, nullable: true },
            tienePronto: { type: Type.BOOLEAN, nullable: true },
            cantidadPronto: { type: Type.STRING, nullable: true },
            tieneTradeIn: { type: Type.BOOLEAN, nullable: true },
            tradeAno: { type: Type.STRING, nullable: true },
            tradeMarca: { type: Type.STRING, nullable: true },
            tradeModelo: { type: Type.STRING, nullable: true },
            estadoTrade: { type: Type.STRING, nullable: true },
            agendoCita: { type: Type.BOOLEAN, nullable: true },
            fechaCita: { type: Type.STRING, nullable: true },
            wantsAppointment: { type: Type.BOOLEAN, nullable: true },
            wantsFinancingInfo: { type: Type.BOOLEAN, nullable: true },
            metodoPago: { type: Type.STRING, nullable: true },
            confidence: { type: Type.NUMBER }
          }
        }
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text) as AIResult;
  } catch (error) {
    console.error("AI processing error:", error);
    return {
      intent: "error",
      confidence: 0
    };
  }
}

/**
 * AI LAYER 3 (RESPONSE GENERATOR)
 * ONLY generates text based on instructions from CRM
 */
export async function generateResponse(
  message: string,
  crmDecision: any,
  context: AIContext
): Promise<string> {
  try {
    const inventoryText = context.inventory
      ?.slice(0, 50)
      .map(v => `${v.year} ${v.make} ${v.model} $${v.price}`)
      .join("\n");

    let historyLog = "";
    if (context.history && context.history.length > 0) {
      historyLog = context.history.map(m => `${m.role}: ${m.content}`).join("\n");
    }

    let prTimeStr = "";
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'America/Puerto_Rico',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      };
      prTimeStr = new Intl.DateTimeFormat('es-PR', options).format(new Date());
    } catch (e) {
      prTimeStr = new Date().toLocaleString();
    }

    const prompt = `You are Camilo, an expert virtual assistant for GT Auto Imports in Dorado, Puerto Rico.
You MUST speak in professional but friendly Spanish.
Do NOT use markdown bolding too often. Keep your answers concise and highly persuasive.

La hora y fecha actuales de Puerto Rico son: ${prTimeStr}.
REGLA DE HORARIO CRÍTICA: Nunca sugieras o confirmes una cita para hoy mismo o para una hora en el pasado. Si vas a sugerir una cita, ofrécela para el PRÓXIMO DÍA laborable (mañana o los próximos días).
REGLA DE VENTAS CRÍTICA: Tu objetivo principal como vendedor experto es SIEMPRE invitar de forma persuasiva y entusiasta al cliente al dealer. Ofrécele mencionar ofertas especiales, bonos, o facilidades para motivarlo a venir a verlo en persona, probarlo y enamorarse del vehículo para llevárselo a su casa.

Here is the conversation history:
${historyLog}

Here is the current inventory:
${inventoryText}

Here are the instructions from the Dealership CRM Engine about how you MUST reply to the user's latest message:
${JSON.stringify(crmDecision, null, 2)}

User's latest message: "${message}"

If the CRM instructed you to show a vehicle, you MUST include this exact string at the end of your message:
MOSTRAR_VEHICULO: [Year] [Make] [Model]

If the CRM instructed you to confirm an appointment, include:
CITA_CONFIRMADA: [Name]|[Phone]|[Budget]|[Vehicle]|[Date]|[Notes]

If the CRM instructed you to save lead data, include:
LEAD_DATA: {"nombre": "...", "telefono": "...", "email": "..."}

Respond directly to the user as Camilo.`;

    // If Anthropic key is available, we can use Claude
    if (anthropic) {
      try {
        console.log("[AI Engine] Using Anthropic Claude for generating response...");
        const msg = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1024,
          temperature: 0.7,
          system: "You are Camilo, a car sales assistant.",
          messages: [
            { role: "user", content: prompt }
          ]
        });
        return msg.content[0].type === 'text' ? msg.content[0].text : '';
      } catch (claudeError) {
        console.error("Claude response generation error, falling back to Gemini:", claudeError);
      }
    }

    // Otherwise, or as fallback, use Gemini 3.5 Flash
    console.log("[AI Engine] Using Gemini 3.5 Flash for generating response...");
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Camilo, an expert virtual assistant for GT Auto Imports. Always respond in friendly, professional Spanish.",
        temperature: 0.7
      }
    });

    return response.text || "Lo siento, estoy teniendo problemas de conexión. ¿Podrías intentar nuevamente?";
  } catch (error: any) {
    console.error("AI response generation error:", error);
    const msg = error.message || String(error);
    if (msg.includes("429") || msg.includes("quota")) {
      return "Lo siento, el sistema está recibiendo demasiados mensajes y ha alcanzado su límite de cuota gratuita con el proveedor de Inteligencia Artificial. Por favor, espera un minuto y vuelve a intentar.";
    }
    return "Lo siento, estoy teniendo problemas de conexión. Por favor, intenta nuevamente más tarde.";
  }
}
