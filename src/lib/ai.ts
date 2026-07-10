import { Vehicle } from "../types";

export class DealerChat {
  public history: any[] = [];
  private inventory: Vehicle[] = [];

  constructor(inventory: Vehicle[] = [], initialHistory: any[] = []) {
    this.inventory = inventory;
    this.history = initialHistory;
  }

  async sendMessage(message: string) {
    try {
      // Enviamos el mensaje al proxy local que luego va al Apps Script (Claude)
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
      
      // Actualizar historial local para la UI
      if (message) {
        this.history.push({ role: "user", parts: [{ text: message }] });
      }
      this.history.push({ role: "model", parts: [{ text: responseText }] });

      return {
        response: {
          text: () => responseText,
          functionCalls: () => [] 
        }
      };
    } catch (error) {
      console.error("Chat Proxy Error:", error);
      throw error;
    }
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
