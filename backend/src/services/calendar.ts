import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CalendarEventParams {
  patientFirstName: string;
  patientLastName: string;
  patientEmail: string;
  doctorName: string;
  specialty: string;
  date: string;       // YYYY-MM-DD
  time: string;       // "9:00 AM"
  reason: string;
}

function parseDateTime(date: string, time: string): { start: string; end: string } {
  // Parse "9:00 AM" style time
  const [timePart, meridiem] = time.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  const startDT = new Date(`${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
  const endDT = new Date(startDT.getTime() + 60 * 60 * 1000); // 1 hour appointment

  return {
    start: startDT.toISOString(),
    end: endDT.toISOString(),
  };
}

function getAuthClient() {
  // Option A: Service Account JSON file
  const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH ||
    path.resolve(__dirname, '..', '..', '..', 'google-service-account.json');

  // Option B: Env-var encoded credentials
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    return new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
  }

  // Try file-based
  try {
    return new google.auth.GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
  } catch {
    return null;
  }
}

export async function createCalendarEvent(params: CalendarEventParams): Promise<string | null> {
  const auth = getAuthClient();

  if (!auth) {
    console.log('📅 Google Calendar not configured — skipping calendar event');
    console.log('   To enable: set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_PATH in .env');
    return null;
  }

  try {
    const calendar = google.calendar({ version: 'v3', auth });
    const { start, end } = parseDateTime(params.date, params.time);

    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    const event = await calendar.events.insert({
      calendarId,
      sendUpdates: 'all', // sends invite to patient
      requestBody: {
        summary: `Appointment: ${params.patientFirstName} ${params.patientLastName} — ${params.specialty}`,
        description: [
          `Patient: ${params.patientFirstName} ${params.patientLastName}`,
          `Provider: ${params.doctorName}`,
          `Specialty: ${params.specialty}`,
          `Reason: ${params.reason}`,
          ``,
          `Booked via Kyron Medical AI Assistant`,
        ].join('\n'),
        location: '2847 Madison Avenue, Suite 700, New York, NY 10028',
        start: { dateTime: start, timeZone: 'America/New_York' },
        end: { dateTime: end, timeZone: 'America/New_York' },
        attendees: [
          { email: params.patientEmail, displayName: `${params.patientFirstName} ${params.patientLastName}` },
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 60 },       // 1 hour before
          ],
        },
        colorId: '7', // Peacock blue — fits Kyron Medical branding
      },
    });

    const eventLink = event.data.htmlLink || '';
    console.log('📅 Google Calendar event created:', eventLink);
    return eventLink;
  } catch (err) {
    console.error('📅 Calendar event creation failed:', err);
    return null;
  }
}
