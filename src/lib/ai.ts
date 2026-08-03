import { Vehicle } from "../types";

// Limpia todos los tags conocidos antes de guardar en el historial -- Claude
// NUNCA debe ver su propio LEAD_DATA/CITA_CONFIRMADA/HANDOFF_URGENTE/NUDGES
// crudo como si fuera parte de la conversación real. Esto es justo lo que
// estaba envenenando el contexto en conversaciones largas.
function stripTagsForHistory(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/CITA_CONFIRMADA:[\s\S]*?(?=\n[A-Z_]+:|$)/g, "")
    .replace(/HANDOFF_URGENTE:[\s\S]*?(?=\n[A-Z_]+:|$)/g, "")
    .replace(/NUDGES:[\s\S]*?(?=\n[A-Z_]+:|$)/g, "")
    .replace(/MOSTRAR_VEHICULO:[\s\S]*?(?=\n[A-Z_]+:|$)/g, "")
    .replace(/LEAD_DATA:[\s\S]*?(?=\n[A-Z_]+:|$)/g, "")
    .replace(/CITA_CONFIRMADA:.*$/gm, "")
    .replace(/HANDOFF_URGENTE:.*$/gm, "")
    .replace(/NUDGES:.*$/gm, "")
    .replace(/MOSTRAR_VEHICULO:.*$/gm, "")
    .replace(/LEAD_DATA:\s*\{.*?\}/gs, "")
    .replace(/LEAD_DATA:.*$/gm, "")
    .trim();
}

export class DealerChat {
  public history: any[] = [];
  private inventory: Vehicle[] = [];

  constructor(inventory: Vehicle[] = [], initialHistory: any[] = []) {
    this.inventory = inventory;
    this.history = initialHistory;
  }

  async sendMessage(message: string) {
    let attempts = 0;
    const maxAttempts = 3;
    let lastError: any = null;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const response = await fetch("/api/chat", {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: message || "CONTINUE",
            inventory: this.inventory,
            history: this.history.map(m => {
              const role = m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user';
              let content = "";
              if (m.parts && Array.isArray(m.parts)) {
                content = m.parts.map((p: any) => p ? (p.text || "") : "").join(' ');
              } else if (m.content) {
                content = m.content;
              } else if (typeof m === 'string') {
                content = m;
              }
              return { role, content };
            })
          })
        });

        if (!response.ok) {
          let errMsg = `Error en el servidor de chat: ${response.status}`;
          try {
            const errData = await response.json();
            if (errData && errData.error) {
              errMsg = `${errData.error}`;
            }
          } catch (_) {}
          throw new Error(errMsg);
        }

        const data = await response.json();
        const responseText = data.text || "";
        
        if (message) {
          this.history.push({ role: "user", parts: [{ text: message }] });
        }
        this.history.push({ role: "model", parts: [{ text: stripTagsForHistory(responseText) }] });

        return {
          response: {
            text: () => responseText,
            functionCalls: () => [] 
          }
        };
      } catch (error: any) {
        lastError = error;
        console.warn(`[Chat Proxy] Intento ${attempts}/${maxAttempts} falló:`, error.message || error);
        if (attempts < maxAttempts) {
          await new Promise(res => setTimeout(res, 1000));
        }
      }
    }

    console.error("Chat Proxy Error tras varios intentos:", lastError);
    throw lastError;
  }

  addFunctionResponse(name: string, result: any) {
    this.history.push({
      role: "function",
      name: name,
      parts: [{ text: typeof result === 'string' ? result : JSON.stringify(result) }]
    });
  }

  getHistory() {
    return this.history;
  }

  setHistory(history: any[]) {
    this.history = history;
  }

  setInventory(inventory: Vehicle[]) {
    this.inventory = inventory;
  }
}

export function createSalesmanChat(inventory: Vehicle[] = [], initialHistory: any[] = []) {
  return new DealerChat(inventory, initialHistory);
}
