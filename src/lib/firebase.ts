
export async function saveLead(leadData: any) {
  // Limpiar datos para evitar errores de circularidad
  const data = JSON.parse(JSON.stringify(leadData, (_, value) => (value === undefined ? null : value)));
  
  // 1. Enviar a Google Sheets vía Proxy del servidor (App Script)
  fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(result => console.log("Guardado en Google Sheets:", result))
  .catch(e => console.error("Error al guardar en Sheets:", e));

  // 2. Guardar copia en Local Storage (Redundancia simple)
  const leads = JSON.parse(localStorage.getItem('car_leads') || '[]');
  leads.push({ ...data, createdAt: new Date().toISOString() });
  localStorage.setItem('car_leads', JSON.stringify(leads.slice(-50)));
}

export function subscribeToLeads(callback: (leads: any[]) => void) {
  // En modo simple sin base de datos real-time, leemos de LocalStorage
  const update = () => {
    const leads = JSON.parse(localStorage.getItem('car_leads') || '[]');
    callback(leads);
  };
  
  update();
  // Escuchar cambios en la misma pestaña
  window.addEventListener('storage', update);
  return () => window.removeEventListener('storage', update);
}

// Funciones vacías para no romper el resto de la app si se llaman
export async function saveChatSession(chatId: string, messages: any[]) {}
export async function loginWithGoogle() { alert("Login deshabilitado (No Firebase)"); }
export const auth = null;
export const db = null;
