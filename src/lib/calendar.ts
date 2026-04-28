
declare const google: any;

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';
const CALENDAR_ID = '084b5445c71150aa903a30ea9cd63bef0f400fee3dc6483b725a35a74b0ba277@group.calendar.google.com';

let accessToken: string | null = null;
let tokenExpiration: number = 0;

export const getAccessToken = (): Promise<string | null> => {
  return new Promise((resolve) => {
    if (accessToken && Date.now() < tokenExpiration) {
      return resolve(accessToken);
    }

    if (!CLIENT_ID || typeof google === 'undefined') {
      console.warn('Google Calendar OAuth not initialized or CLIENT_ID missing.');
      return resolve(null);
    }

    try {
      // We only ask for token if absolutely necessary, but here we'll just return null
      // to avoid annoying the user with popups they didn't expect.
      // If we really wanted to, we could show a "Sync to Calendar" button instead.
      resolve(null);
    } catch (error) {
      console.error('Error checking for token:', error);
      resolve(null);
    }
  });
};

export interface AppointmentDetails {
  customerName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  interest: string;
}

export async function createCalendarEvent(details: AppointmentDetails) {
  const token = await getAccessToken();
  
  if (!token) {
    console.warn("Calendar sync skipped: No access token.");
    return { skipped: true, message: "Sync skipped (Auth required)" };
  }
  const startDateTime = `${details.date}T${details.time}:00`;
  // Default to 1 hour appointment
  const endHour = parseInt(details.time.split(':')[0]) + 1;
  const endMinute = details.time.split(':')[1];
  const endDateTime = `${details.date}T${String(endHour).padStart(2, '0')}:${endMinute}:00`;

  const event = {
    summary: `Cita: ${details.customerName} - ${details.interest}`,
    description: `Interesado en: ${details.interest}\nCliente: ${details.customerName}`,
    start: {
      dateTime: startDateTime,
      timeZone: 'America/Puerto_Rico',
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'America/Puerto_Rico',
    },
  };

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Calendar API error: ${error.error?.message || response.statusText}`);
  }

  return response.json();
}
