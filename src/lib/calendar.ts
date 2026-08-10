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

  const monthsEs: Record<string, number> = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
  };

  const combined = `${dateStr || ''} ${timeStr || ''}`.toLowerCase();

  // Extract YYYY-MM-DD or YYYY/MM/DD
  const dateMatch = combined.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (dateMatch) {
    year = parseInt(dateMatch[1], 10);
    month = parseInt(dateMatch[2], 10) - 1;
    day = parseInt(dateMatch[3], 10);
  } else {
    const altMatch = combined.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (altMatch) {
      day = parseInt(altMatch[1], 10);
      month = parseInt(altMatch[2], 10) - 1;
      year = parseInt(altMatch[3], 10);
    } else {
      // Check for Spanish month names e.g. "5 de agosto" or "agosto 5"
      for (const [mName, mIdx] of Object.entries(monthsEs)) {
        if (combined.includes(mName)) {
          month = mIdx;
          const dayMatch = combined.match(new RegExp(`(\\d{1,2})\\s*(?:de)?\\s*${mName}`)) || combined.match(new RegExp(`${mName}\\s*(?:de)?\\s*(\\d{1,2})`));
          if (dayMatch) {
            day = parseInt(dayMatch[1], 10);
          }
          const yearMatch = combined.match(/20\d{2}/);
          if (yearMatch) {
            year = parseInt(yearMatch[0], 10);
          } else {
            const now = new Date();
            if (month < now.getMonth() || (month === now.getMonth() && day < now.getDate())) {
              year = now.getFullYear() + 1;
            }
          }
          break;
        }
      }
    }
  }

  // Parse hours & minutes from timeStr or dateStr
  let hours = 10;
  let minutes = 0;
  const combinedTime = `${dateStr} ${timeStr}`.toLowerCase();

  const isPM = /pm|tarde|noche/i.test(combinedTime);
  const isAM = /am|mañana|madrugada/i.test(combinedTime);

  const timeMatch = combinedTime.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10);
    minutes = parseInt(timeMatch[2], 10);
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    if (!isPM && !isAM && hours >= 1 && hours <= 7) hours += 12; // Default 1..7 to PM for dealer hours
  } else {
    const hourOnlyMatch = combinedTime.match(/(\d{1,2})\s*(am|pm|tarde|mañana)/i);
    if (hourOnlyMatch) {
      hours = parseInt(hourOnlyMatch[1], 10);
      const indicator = hourOnlyMatch[2].toLowerCase();
      if ((indicator === 'pm' || indicator === 'tarde') && hours < 12) hours += 12;
      if ((indicator === 'am' || indicator === 'mañana') && hours === 12) hours = 0;
    } else {
      const simpleHourMatch = combinedTime.match(/(?:a las|las)\s*(\d{1,2})/i) || combinedTime.match(/\b(\d{1,2})\b/);
      if (simpleHourMatch) {
        hours = parseInt(simpleHourMatch[1], 10);
        if (hours >= 1 && hours <= 7) hours += 12; // Default 1..7 to PM
      }
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

  // Target shared dealer calendar strictly
  const sharedCalendarId = '1884c8cd6a523a871eb205236425adc8df7a024735916cd1aa5331857befd505@group.calendar.google.com';
  const targetCalendarId = details.calendarId || process.env.GOOGLE_CALENDAR_ID || sharedCalendarId;

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const errMsg = error.error?.message || response.statusText;
    console.error(`Calendar API call to ${targetCalendarId} failed (${response.status}):`, errMsg);
    throw new Error(`Calendar API error on ${targetCalendarId}: ${errMsg}`);
  }

  console.log(`Calendar event created successfully on calendar ${targetCalendarId}.`);
  return response.json();
}
