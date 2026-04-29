import { Vehicle } from "../types";

export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export const searchInventoryFn: FunctionDeclaration = {
  name: "search_inventory",
  description: "Busca en el inventario de PR Automotive Group. Úsalo para encontrar carros por marca, modelo, año o precio.",
  parameters: {
    type: "OBJECT",
    properties: {
      query: { type: "STRING", description: "Palabras clave de búsqueda (ej. Toyota, SUV, economico)." },
      category: { type: "STRING", description: "Categoría: Pick Up, SUV, Sedan, De Lujo, 3 Filas." },
      maxPrice: { type: "NUMBER", description: "Presupuesto máximo." },
    },
  },
};

export const registerLeadFn: FunctionDeclaration = {
  name: "register_lead",
  description: "Registra los datos de contacto del cliente para seguimiento. Úsalo cuando el cliente esté interesado en un auto.",
  parameters: {
    type: "OBJECT",
    properties: {
      name: { type: "STRING" },
      email: { type: "STRING" },
      phone: { type: "STRING" },
      interest: { type: "STRING", description: "Carro de interés o notas." },
      source: { type: "STRING", description: "Contexto del lead (chat, unit_click)." }
    },
    required: ["name", "phone"]
  }
};

export const showBookingFormFn: FunctionDeclaration = {
  name: "show_booking_form",
  description: "Muestra el formulario de cita al cliente cuando esté listo para visitar el dealer o probar un auto.",
  parameters: {
    type: "OBJECT",
    properties: {
      reason: { type: "STRING", description: "Razón de la cita (ej. Test drive, consulta)." }
    }
  }
};

export const requestCarFn: FunctionDeclaration = {
  name: "request_car",
  description: "Registra una petición de un carro específico que NO está en el inventario.",
  parameters: {
    type: "OBJECT",
    properties: {
      make: { type: "STRING" },
      model: { type: "STRING" },
      yearRange: { type: "STRING" },
      notes: { type: "STRING" }
    },
    required: ["make", "model"]
  }
};

export const scheduleAppointmentFn: FunctionDeclaration = {
  name: "schedule_appointment",
  description: "Agenda una cita directamente. Pregunta primero por fecha y hora preferida.",
  parameters: {
    type: "OBJECT",
    properties: {
      customerName: { type: "STRING" },
      date: { type: "STRING", description: "Formato: YYYY-MM-DD" },
      time: { type: "STRING", description: "Formato: HH:mm (24h)" },
      interest: { type: "STRING" }
    },
    required: ["customerName", "date", "time"]
  }
};

export class GeminiChat {
  private history: any[] = [];
  private inventory: Vehicle[] = [];

  constructor(inventory: Vehicle[] = [], initialHistory: any[] = []) {
    this.inventory = inventory;
    this.history = initialHistory;
  }

  async sendMessage(message: string) {
    if (message.trim()) {
      this.history.push({ role: "user", parts: [{ text: message }] });
    }

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message || "CONTINUE", // Send empty message as CONTINUE if multi-turn
          history: this.history.slice(0, -1),
          systemInstruction: this.getPrompt(),
          tools: [{
            functionDeclarations: [
              searchInventoryFn, 
              registerLeadFn, 
              showBookingFormFn, 
              requestCarFn, 
              scheduleAppointmentFn
            ]
          }]
        })
      });

      if (!resp.ok) throw new Error("Error en Proxy IA");

      const data = await resp.json();
      
      const botParts: any[] = [];
      if (data.text) botParts.push({ text: data.text });
      if (data.functionCalls && data.functionCalls.length > 0) {
        data.functionCalls.forEach((fc: any) => botParts.push({ functionCall: fc }));
      }
      
      if (botParts.length > 0) {
        this.history.push({ role: "model", parts: botParts });
      }

      return {
        response: {
          text: () => data.text || "",
          functionCalls: () => data.functionCalls || []
        }
      };
    } catch (error: any) {
      console.error("Gemini Proxy Error:", error);
      throw error;
    }
  }

  addFunctionResponse(name: string, response: any) {
    this.history.push({
      role: "function",
      parts: [
        {
          functionResponse: {
            name: name,
            response: response
          }
        }
      ]
    });
  }

  getHistory() {
    return this.history;
  }

  setHistory(history: any[]) {
    this.history = history;
  }

  private getPrompt() {
    const inv = this.inventory.map(v => `${v.year} ${v.make} ${v.model} - $${v.price}`).join('\n');
    return `Eres el asistente de PR Automotive Group.
Inventario: ${inv}
Tu meta: Ayudar a elegir un carro y obtener Nombre y Teléfono (usando register_lead) para que el equipo de ventas los vea en el Google Sheet.`;
  }
}

export function createSalesmanChat(inventory: Vehicle[] = [], initialHistory: any[] = []) {
  return new GeminiChat(inventory, initialHistory);
}
