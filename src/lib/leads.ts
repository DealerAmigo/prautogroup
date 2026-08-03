
import { getAccessToken } from './googleAuth';
import { appendLeadToSheet } from './googleSheets';
import { sendNewLeadNotification, sendCustomerConfirmation } from './gmail';
import { createCalendarEvent } from './calendar';

export async function saveLead(leadData: any) {
  // Derive a consistent lead ID using provided id, phone number, or session ID
  const rawPhone = leadData.telefono || leadData.phone || '';
  const cleanPhone = String(rawPhone).replace(/\D/g, '');
  const sessionId = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('chat-session-id') : null;
  const leadId = (cleanPhone.length >= 7 ? `lead_${cleanPhone}` : null) || leadData.id || sessionId || 'session_default';

  const cleanData = {
    ...leadData,
    id: leadId,
    timestamp: leadData.timestamp || Date.now(),
    dateStr: new Date().toLocaleString('es-PR', { timeZone: 'America/Puerto_Rico' }),
  };
  
  const data = JSON.parse(JSON.stringify(cleanData));
  
  console.log("Tracked lead:", data.type);

  // 1. Guardar en Sheets vía proxy local (fallback siempre encendido)
  try {
    fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).catch(() => {});
  } catch (e) {}

  // 2. Guardar copia local para persistencia en el navegador
  try {
    const leads = JSON.parse(localStorage.getItem('car_leads') || '[]');
    leads.unshift({ ...data, createdAt: new Date().toISOString() });
    localStorage.setItem('car_leads', JSON.stringify(leads.slice(0, 100)));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {}

  // 3. Integración directa con Google Workspace si hay sesión de Google activa
  try {
    const token = await getAccessToken();
    if (token) {
      console.log("[Workspace Integration] Active Google token found. Performing direct sync...");
      
      // A. Guardar fila en Google Sheets directamente
      await appendLeadToSheet(data, token).catch(e => console.error("Error appending directly to Sheet:", e));
      
      // B. Si es una cita, crear evento en Google Calendar y notificar al cliente por Gmail
      const isAppointment =
        data.agendo_cita === true ||
        !!data.fecha_cita ||
        data.eventType === 'cita_confirmada' ||
        ['appointment', 'ai_appointment_confirmation', 'appointment_booking_form'].includes(data.type);

      if (isAppointment) {
        // Formatear notas para el calendario
        const interestStr = data.vehicleInterest || data.vehiculo_interes || data.vehiculoInteres || data.vehicle || data.notes || data.notas || 'Consulta General';
        
        // Obtener fecha y hora de la cita
        let appointmentDate = data.appointmentDate || data.fecha_cita || data.date || '';
        let datePart = appointmentDate;
        let timePart = data.time || '';

        if (appointmentDate && (appointmentDate.includes(' ') || appointmentDate.includes('T'))) {
          const parts = appointmentDate.replace('T', ' ').split(' ');
          datePart = parts[0];
          if (!timePart && parts[1]) {
            timePart = parts.slice(1).join(' ');
          }
        }

        // Crear evento en Google Calendar
//        await createCalendarEvent({
//          customerName: data.name || data.nombre || 'Cliente GT Auto Imports',
//          date: datePart,
//          time: timePart,
//          interest: interestStr,
//          phone: data.phone || data.telefono,
//          email: data.email
//        }, token).catch(e => console.error("Error creating Google Calendar event:", e));

        // Enviar correo de confirmación al cliente si tiene email
        if (data.email) {
          await sendCustomerConfirmation(data, token).catch(e => console.error("Error sending confirmation email to customer:", e));
        }
      }

      // C. Enviar notificación al dueño del dealer (willquisnos@gmail.com) por Gmail
      await sendNewLeadNotification(data, 'willquisnos@gmail.com', token).catch(e => console.error("Error notifying owner via Gmail:", e));
    }
  } catch (error) {
    console.error("Workspace integration error:", error);
  }
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

import { googleSignIn, logout as googleLogout, auth as firebaseAuth } from './googleAuth';
import { onAuthStateChanged as firebaseOnAuthStateChanged } from 'firebase/auth';

export async function loginWithGoogle(): Promise<any> {
  const result = await googleSignIn();
  if (result) {
    const adminUser = {
      email: result.user.email,
      name: result.user.displayName || 'Asesor GT Auto Imports'
    };
    sessionStorage.setItem('admin_user', JSON.stringify(adminUser));
    window.dispatchEvent(new Event('admin_login'));
    return adminUser;
  }
  return null;
}

export const auth = {
  get currentUser() {
    const cached = sessionStorage.getItem('admin_user');
    if (cached) return JSON.parse(cached);
    return null;
  }
};

export function onAuthStateChanged(_auth: any, callback: (user: any) => void) {
  return firebaseOnAuthStateChanged(firebaseAuth, (user) => {
    if (user) {
      const adminUser = {
        email: user.email,
        name: user.displayName || 'Asesor GT Auto Imports'
      };
      sessionStorage.setItem('admin_user', JSON.stringify(adminUser));
      callback(adminUser);
    } else {
      sessionStorage.removeItem('admin_user');
      callback(null);
    }
  });
}

export async function logoutWithGoogle() {
  await googleLogout();
  sessionStorage.removeItem('admin_user');
  window.dispatchEvent(new Event('admin_login'));
}

export async function saveChatSession(chatId: string, _messages: any[]) {
  console.log("Chat session tracked:", chatId);
}
