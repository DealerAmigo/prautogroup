import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Vehicle } from "../types";

// The platform injects GEMINI_API_KEY into the environment. 
// Following gemini-api skill: Always call from frontend using @google/genai.
const geminiKey = process.env.GEMINI_API_KEY;

if (!geminiKey) {
  console.warn("GEMINI_API_KEY is not defined in the environment. AI features may not work.");
}

const ai = new GoogleGenAI({ apiKey: geminiKey || "" });

export const searchInventoryFn = {
  name: "search_inventory",
  parameters: {
    type: Type.OBJECT,
    description: "Search or browse the PR Automotive Group inventory. Use this to find ANY vehicle by make, model, year, category, or price. Can be used for specific searches or broad browsing.",
    properties: {
      query: {
        type: Type.STRING,
        description: "Search keywords (e.g., 'Toyota', 'SUV', 'luxury', 'economico', '3 filas'). Leave empty to browse all.",
      },
      category: {
        type: Type.STRING,
        description: "Filter by category. Allowed values: 'Pick Up', 'SUV', 'Sedan', 'Economico', 'De Lujo', '3 Filas', 'Mini-Van'.",
      },
      maxPrice: {
        type: Type.NUMBER,
        description: "Maximum budget.",
      },
    },
  },
};

export const requestSpecificCarFn = {
  name: "request_car",
  parameters: {
    type: Type.OBJECT,
    description: "When a customer wants a specific car that is not in stock, use this to log their request.",
    properties: {
      make: { type: Type.STRING },
      model: { type: Type.STRING },
      yearRange: { type: Type.STRING },
      notes: { type: Type.STRING, description: "Any specific preferences like color or mileage." },
    },
    required: ["make", "model"],
  },
};

export const showBookingFormFn = {
  name: "show_booking_form",
  parameters: {
    type: Type.OBJECT,
    description: "Display a booking form to the customer when they are ready to schedule an appointment or visit the dealer.",
    properties: {
      reason: { type: Type.STRING, description: "Why the form is being shown (e.g. 'Test drive', 'Consultation')." }
    }
  }
};

export const scheduleAppointmentFn = {
  name: "schedule_appointment",
  parameters: {
    type: Type.OBJECT,
    description: "Schedule an appointment in the Google Calendar. Ask for preferred date and time first.",
    properties: {
      customerName: { type: Type.STRING },
      date: { type: Type.STRING, description: "Format: YYYY-MM-DD" },
      time: { type: Type.STRING, description: "Format: HH:mm (24h)" },
      interest: { type: Type.STRING, description: "Vehicle or service they are interested in." }
    },
    required: ["customerName", "date", "time"]
  }
};

export const registerLeadFn = {
  name: "register_lead",
  parameters: {
    type: Type.OBJECT,
    description: "Capture customer contact information to send a detailed proposal or photos via WhatsApp. Call this when the user shows interest or asks for photos/details and after you have asked for their name, phone, and email.",
    properties: {
      name: { type: Type.STRING, description: "Customer's full name" },
      email: { type: Type.STRING, description: "Customer's email address" },
      phone: { type: Type.STRING, description: "Customer's phone number" },
      vehicleInterest: { type: Type.STRING, description: "The vehicle they are interested in" },
      notes: { type: Type.STRING, description: "Additional notes about the customer's preferences, budget, or trade-in." },
      source: { type: Type.STRING, description: "The context where the lead was captured. e.g. 'chat', 'image_click', 'proposal_request'." }
    },
    required: ["name", "email", "phone"]
  }
};

export function getSalesmanPrompt(inventory: Vehicle[]) {
  const inventarioTexto = inventory && inventory.length > 0 
    ? inventory.map(v => `- ${v.year} ${v.make} ${v.model} | Precio: $${v.price.toLocaleString()} | Millaje: ${v.mileage} | Clase: ${v.category} | [Ver fotos](${v.image})`).join('\n')
    : "Inventario no disponible.";

  return `Eres DealerAmigo, el asesor de ventas experto de PR Automotive Group en Carolina, Puerto Rico.

Tu misión es transformar a cada visitante en un cliente satisfecho, destacando que somos el ÚNICO dealer con Garantía de 100,000 millas en usados.

---

## REGLAS DE NEGOCIO (¡ÚSALAS PARA CERRAR!)
- **GARANTÍA**: 100,000 millas en unidades usadas (Diferenciador #1).
- **CRÉDITO**: Aceptamos trade-in con o sin deuda. Ayudamos a clientes con crédito afectado o excelente.
- **ENTREGA**: Entregamos en toda la isla con tanque lleno.
- **UBICACIÓN**: Marginal Los Ángeles, Carolina (frente al aeropuerto SJU).

---

## TU ESTILO (BORICUA EXPERTO)
- **BREVEDAD**: Máximo 2 o 3 líneas por mensaje. No aburras al cliente.
- **CONTROL**: Si el cliente pregunta por algo genérico, ofrece 2 opciones del inventario de inmediato.
- **FOTOS**: Siempre que menciones un auto, incluye el link así: [Ver fotos y detalles]({url}).
- **CIERRE**: Después de dar información, pregunta: "¿Te gustaría pasar a verlo hoy o prefieres mañana temprano?" o "¿Buscas pago mensual o financiamiento?"

---

## CALIFICACIÓN RÁPIDA (LEAD)
Si el cliente parece interesado, necesitas capturar sus datos para "separar la unidad" o "enviarle la pre-aprobación":
1. Nombre
2. Teléfono
3. ¿Cómo está el crédito? (Bien, regular o algún detalle)
4. ¿Entrega inicial disponible?

---

## INVENTARIO DISPONIBLE
${inventarioTexto}

---

## COMUNICACIÓN TÉCNICA
Cuando tengas Nombre y Teléfono, DEBES generar la confirmación al final de tu mensaje usando este formato EXACTO:
CITA_CONFIRMADA:[nombre]|[telefono]|[presupuesto]|[vehiculo]|[credito]|PR Automotive Group`;
}

export class GeminiChat {
  private history: any[] = [];
  private inventory: Vehicle[];

  constructor(inventory: Vehicle[], initialHistory: any[] = []) {
    this.inventory = inventory;
    this.history = initialHistory;
  }

  public getHistory() {
    return this.history;
  }

  public setHistory(history: any[]) {
    this.history = history;
  }

  async sendMessage(message: string) {
    if (!geminiKey) {
      throw new Error("No se ha configurado la llave de API de Gemini. Por favor verifica la configuración en AI Studio.");
    }

    if (message && message.trim()) {
      this.history.push({ role: "user", parts: [{ text: message }] });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: this.history,
        config: {
          systemInstruction: getSalesmanPrompt(this.inventory),
          tools: [{
            functionDeclarations: [
              searchInventoryFn,
              requestSpecificCarFn,
              showBookingFormFn,
              scheduleAppointmentFn,
              registerLeadFn
            ]
          }]
        }
      });

      const botParts = response.candidates?.[0]?.content?.parts || [];
      this.history.push({ role: "model", parts: botParts });

      return {
        response: {
          text: () => response.text || "",
          functionCalls: () => response.functionCalls || []
        }
      };
    } catch (error: any) {
      console.error("Gemini AI API Error:", error);
      throw error;
    }
  }

  public addFunctionResponse(name: string, content: any) {
    this.history.push({
      role: "user",
      parts: [{
        functionResponse: {
          name,
          response: { content }
        }
      }]
    });
  }
}

export function createSalesmanChat(inventory: Vehicle[] = [], initialHistory: any[] = []) {
  return new GeminiChat(inventory, initialHistory);
}

