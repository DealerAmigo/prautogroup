import { Vehicle } from "../types";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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
    ? inventory.map(v => `- ${v.year} ${v.make} ${v.model} | Precio: $${v.price.toLocaleString()} | Millaje: ${v.mileage} | ${v.specialOffer || ''} | Foto: ${v.image}`).join('\n')
    : "Inventario no disponible.";

  return `Eres DealerAmigo, el asistente virtual de PR Automotive Group en Puerto Rico.
**PRESENTACIÓN OBLIGATORIA**: Siempre, en tu primer mensaje o cuando sea apropiado, identifícate como el "Asistente Virtual" de PR Automotive Group.

---

## REGLAS DE ORO (CRÍTICO)
- **SÉ BREVE Y CONCISO**: No escribas más de 2 párrafos cortos (máximo 3 líneas cada uno).
- **ESPERA REACCIÓN**: Haz una pregunta a la vez y espera a que el usuario responda. No satures de información.
- **AUTÉNTICO**: Mantén tu personalidad pero sé directo. No pierdas tiempo en explicaciones largas.

---

## TU ESTILO
- Sé amable pero ve al grano.
- Si el cliente te cuenta algo personal, responde brevemente y retoma el negocio con una pregunta corta.
- Dialecto de Puerto Rico natural.

---

## MANEJO DE FOTOS
- Si el cliente pregunta por un auto o muestra interés, DEBES mostrar la foto de inmediato: ![Foto](URL_DE_LA_FOTO)
- No prometas enviarlas "luego" si ya tienes el URL en el inventario.

---

## CAPTURA DE DATA
- Pide nombre y teléfono para enviar detalles VIP o agendar: "¿Me podrías compartir tu nombre y teléfono para enviarte los detalles completos de este auto por WhatsApp?"
- **CONFIRMACIÓN**: Una vez recibas los datos, confirma: "Perfecto [Nombre], ya guardé tu información para que un experto te contacte."

---

## QUIÉNES SOMOS
Dealer en Marginal Los Ángeles, Carolina (frente al SJU).
Diferenciadores: Garantía 100k millas, tanque lleno, entrega en toda la isla.

---

## INVENTARIO DISPONIBLE
${inventarioTexto}

REGLA: Si le interesa una unidad, enfócate en esa. No lo abrumes con otras a menos que lo pida.

---

## REGLAS TÉCNICAS
- Añade: "sujeto a aprobación de crédito" al hablar de ofertas o pagos.
- NO inventes ofertas.
- Siempre intenta cerrar la cita: "¿Te queda mejor hoy o mañana?"

CONFIRMADO:[nombre]|[telefono]|[presupuesto]|[vehiculo]|[credito]|[dealer]`;
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
    if (message && message.trim()) {
      this.history.push({ role: "user", parts: [{ text: message }] });
    }

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
        functionCalls: () => response.functionCalls || null
      }
    };
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

