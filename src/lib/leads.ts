
export async function saveLead(leadData: any) {
  // Limpiar datos para evitar errores de circularidad y asegurar tipos
  const cleanData = {
    ...leadData,
    timestamp: leadData.timestamp || Date.now(),
    dateStr: new Date().toLocaleString('es-PR', { timeZone: 'America/Puerto_Rico' }),
    id: Math.random().toString(36).substring(2, 9)
  };
  
  const data = JSON.parse(JSON.stringify(cleanData));
  
  console.log("Tracked lead:", data.type);

  // Guardar en Sheets vía proxy local si está configurado
  try {
    fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).catch(() => {});
  } catch (e) {}

  // Guardar copia local para persistencia en el navegador
  try {
    const leads = JSON.parse(localStorage.getItem('car_leads') || '[]');
    leads.unshift({ ...data, createdAt: new Date().toISOString() });
    localStorage.setItem('car_leads', JSON.stringify(leads.slice(0, 100)));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {}
}

export function subscribeToLeads(callback: (leads: any[]) => void) {
  const update = () => {
    try {
      const leads = JSON.parse(localStorage.getItem('car_leads') || '[]');
      callback(leads);
    } catch (e) {
      callback([]);
    }
  };
  
  update();
  window.addEventListener('storage', update);
  return () => window.removeEventListener('storage', update);
}

// Simplemente usamos el email del dueño para acceso total
const ADMIN_USER = {
  email: 'willquisnos@gmail.com',
  name: 'Will PR Automotive'
};

export async function loginWithGoogle(): Promise<any> {
  sessionStorage.setItem('admin_user', JSON.stringify(ADMIN_USER));
  window.dispatchEvent(new Event('admin_login'));
  return ADMIN_USER;
}

export const auth = {
  get currentUser() {
    return ADMIN_USER; // Acceso directo para el dueño en su entorno
  }
};

export function onAuthStateChanged(_auth: any, callback: (user: any) => void) {
  // Siempre logueado como admin en este entorno no-seguro/demo
  callback(ADMIN_USER);
  return () => {};
}

export async function saveChatSession(chatId: string, _messages: any[]) {
  console.log("Chat session tracked:", chatId);
}
