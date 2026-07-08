import { getAccessToken } from './googleAuth';

export interface AppointmentDetails {
  customerName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  interest: string;
  phone?: string;
  email?: string;
}

export async function createCalendarEvent(details: AppointmentDetails, providedToken?: string) {
  // Use provided token or fetch from googleAuth cache
  const token = providedToken || await getAccessToken();
  
  if (!token) {
    console.warn("Calendar sync skipped: No access token available.");
    return { skipped: true, message: "Sync skipped (Auth required)" };
  }

  // Build ISO start time
  // e.g. 2026-06-28T14:30:00
  const startDateTime = `${details.date}T${details.time}:00`;
  
  // Default to 1 hour appointment
  const [hours, minutes] = details.time.split(':').map(Number);
  const endHour = hours + 1;
  const endDateTime = `${details.date}T${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

  const descriptionParts = [
    `Cliente: ${details.customerName}`,
    details.phone ? `Teléfono: ${details.phone}` : '',
    details.email ? `Email: ${details.email}` : '',
    `Interesado en: ${details.interest}`,
    `Creado por Asistente de Ventas Camilo (GT Auto Imports)`
  ].filter(Boolean);

  const event = {
    summary: `Cita GT Auto Imports: ${details.customerName} - ${details.interest}`,
    description: descriptionParts.join('\n'),
    location: 'PR-2 km 26.1, Dorado, Puerto Rico 00646',
    start: {
      dateTime: startDateTime,
      timeZone: 'America/Puerto_Rico',
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'America/Puerto_Rico',
    },
    reminders: {
      useDefault: true
    }
  };

  // We write to the user's 'primary' calendar by default
  const calendarId = 'primary';
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Calendar API error: ${error.error?.message || response.statusText}`);
  }

  console.log("Calendar event created successfully on primary calendar.");
  return response.json();
}
