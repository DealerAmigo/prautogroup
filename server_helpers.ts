import { google } from "googleapis";
export function parseAppointmentDateTime(dateStr: string, timeStr: string): { startISO: string; endISO: string } {
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

export async function createServerSideCalendarEvent(lead: any, calendarId?: string) {
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
  let clientEmail = process.env.GOOGLE_CLIENT_EMAIL || "dealeramigobot@dealeramigo.iam.gserviceaccount.com";
  let privateKey = rawPrivateKey || "";

  if (!privateKey) {
    console.warn("Skipping Server-Side Calendar creation: GOOGLE_PRIVATE_KEY is not defined in Secrets.");
    return;
  }

  // Handle case where GOOGLE_PRIVATE_KEY contains a full Service Account JSON string
  if (privateKey.trim().startsWith("{")) {
    try {
      const parsedJson = JSON.parse(privateKey);
      if (parsedJson.private_key) {
        privateKey = parsedJson.private_key;
      }
      if (parsedJson.client_email) {
        clientEmail = parsedJson.client_email;
      }
    } catch (jsonErr) {
      console.warn("[Server] Could not parse GOOGLE_PRIVATE_KEY as JSON, using raw string");
    }
  }

  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: formattedPrivateKey,
      scopes: ["https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/calendar"]
    });

    const calendar = google.calendar({ version: "v3", auth });
    const appointmentDate = lead.fecha_cita || lead.appointmentDate || lead.date || "";
    const { startISO, endISO } = parseAppointmentDateTime(appointmentDate, appointmentDate);

    const descriptionParts = [
      `Cliente: ${lead.nombre || lead.name || 'Cliente'}`,
      lead.telefono || lead.phone ? `Teléfono: ${lead.telefono || lead.phone}` : '',
      lead.email ? `Email: ${lead.email}` : '',
      `Interesado en: ${lead.vehiculoInteres || lead.vehicleInterest || lead.vehiculo_interes || 'Prueba de manejo'}`,
      `Creado por Asistente de Ventas Camilo (Backend GT Auto Imports)`
    ].filter(Boolean);

    const event = {
      summary: `Cita GT Auto Imports: ${lead.nombre || lead.name || 'Cliente'} - ${lead.vehiculoInteres || lead.vehicleInterest || lead.vehiculo_interes || 'Consulta'}`,
      description: descriptionParts.join('\n'),
      location: 'PR-2 km 26.1, Dorado, Puerto Rico 00646',
      start: {
        dateTime: startISO,
        timeZone: 'America/Puerto_Rico',
      },
      end: {
        dateTime: endISO,
        timeZone: 'America/Puerto_Rico',
      }
    };

    // Shared calendar ID that is granted write permissions to the dealeramigobot service account
    const defaultSharedCalId = "1884c8cd6a523a871eb205236425adc8df7a024735916cd1aa5331857befd505@group.calendar.google.com";
    const targetCalendarId = calendarId || process.env.GOOGLE_CALENDAR_ID || defaultSharedCalId;

    try {
      const res = await calendar.events.insert({
        calendarId: targetCalendarId,
        requestBody: event,
      });
      console.log(`[Server] Calendar event created successfully on calendar ${targetCalendarId}:`, res.data.htmlLink);
      return res.data;
    } catch (primaryErr: any) {
      console.warn(`[Server] Primary calendar insert failed on ${targetCalendarId} (${primaryErr.message}). Trying fallback shared calendar ID...`);
      if (targetCalendarId !== defaultSharedCalId) {
        const resFallback = await calendar.events.insert({
          calendarId: defaultSharedCalId,
          requestBody: event,
        });
        console.log(`[Server] Calendar event created successfully on fallback calendar ${defaultSharedCalId}:`, resFallback.data.htmlLink);
        return resFallback.data;
      } else {
        throw primaryErr;
      }
    }
  } catch (error) {
    console.error("[Server] Error creating calendar event:", error);
  }
}
