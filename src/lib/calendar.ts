import { getAccessToken } from './googleAuth';

export interface AppointmentDetails {
  customerName: string;
  date: string; // YYYY-MM-DD or full date/time string
  time: string; // HH:mm or 10:00 AM/PM
  interest: string;
  phone?: string;
  email?: string;
  calendarId?: string;
}

function parseAppointmentDateTime(dateStr: string, timeStr: string): { startISO: string; endISO: string } {
  let year = new Date().getFullYear();
  let month = new Date().getMonth();
  let day = new Date().getDate() + 1; // Default tomorrow

  // Extract YYYY-MM-DD or YYYY/MM/DD
  const dateMatch = (dateStr || '').match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (dateMatch) {
    year = parseInt(dateMatch[1], 10);
    month = parseInt(dateMatch[2], 10) - 1;
    day = parseInt(dateMatch[3], 10);
  } else {
    const altMatch = (dateStr || '').match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (altMatch) {
      day = parseInt(altMatch[1], 10);
      month = parseInt(altMatch[2], 10) - 1;
      year = parseInt(altMatch[3], 10);
    }
  }

  // Parse hours & minutes from timeStr or dateStr
  let hours = 10;
  let minutes = 0;
  const combinedTime = `${dateStr} ${timeStr}`;

  const isPM = /pm/i.test(combinedTime);
  const isAM = /am/i.test(combinedTime);

  const timeMatch = combinedTime.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10);
    minutes = parseInt(timeMatch[2], 10);
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
  } else {
    const hourOnlyMatch = combinedTime.match(/(\d{1,2})\s*(am|pm)/i);
    if (hourOnlyMatch) {
      hours = parseInt(hourOnlyMatch[1], 10);
      if (hourOnlyMatch[2].toLowerCase() === 'pm' && hours < 12) hours += 12;
      if (hourOnlyMatch[2].toLowerCase() === 'am' && hours === 12) hours = 0;
    }
  }

  if (isNaN(hours) || hours < 0 || hours > 23) hours = 10;
  if (isNaN(minutes) || minutes < 0 || minutes > 59) minutes = 0;

  const startDate = new Date(year, month, day, hours, minutes, 0);
  const endDate = new Date(year, month, day, hours + 1, minutes, 0);

  const pad = (n: number) => String(n).padStart(2, '0');
  const formatISO = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

  return {
    startISO: formatISO(startDate),
    endISO: formatISO(endDate),
  };
}

export async function createCalendarEvent(details: AppointmentDetails, providedToken?: string) {
  // Use provided token or fetch from googleAuth cache
  const token = providedToken || await getAccessToken();
  
  if (!token) {
    console.warn("Calendar sync skipped: No access token available.");
    return { skipped: true, message: "Sync skipped (Auth required)" };
  }

  const { startISO, endISO } = parseAppointmentDateTime(details.date, details.time);

  const descriptionParts = [
    `Cliente: ${details.customerName}`,
    details.phone ? `Teléfono: ${details.phone}` : '',
    details.email ? `Email: ${details.email}` : '',
    `Interesado en: ${details.interest || 'Prueba de manejo'}`,
    `Creado por Asistente de Ventas Camilo (GT Auto Imports)`
  ].filter(Boolean);

  const event = {
    summary: `Cita GT Auto Imports: ${details.customerName} - ${details.interest || 'Consulta Auto'}`,
    description: descriptionParts.join('\n'),
    location: 'PR-2 km 26.1, Dorado, Puerto Rico 00646',
    start: {
      dateTime: startISO,
      timeZone: 'America/Puerto_Rico',
    },
    end: {
      dateTime: endISO,
      timeZone: 'America/Puerto_Rico',
    },
    reminders: {
      useDefault: true
    }
  };

  // Target shared dealer calendar or environment variable, or fallback
  const sharedCalendarId = '1884c8cd6a523a871eb205236425adc8df7a024735916cd1aa5331857befd505@group.calendar.google.com';
  const targetCalendarId = details.calendarId || process.env.GOOGLE_CALENDAR_ID || sharedCalendarId;

  let response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok && targetCalendarId !== 'primary') {
    console.warn(`Calendar API call to ${targetCalendarId} failed (${response.status}), falling back to primary calendar...`);
    response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Calendar API error: ${error.error?.message || response.statusText}`);
  }

  console.log(`Calendar event created successfully on calendar ${targetCalendarId}.`);
  return response.json();
}
