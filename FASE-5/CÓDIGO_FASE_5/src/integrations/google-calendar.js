import axios from 'axios';
import logger from '../utils/logger.js';

const CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

let cachedToken = null;
let cachedExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < cachedExpiry) return cachedToken;
  const { data } = await axios.post('https://oauth2.googleapis.com/token', {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });
  cachedToken = data.access_token;
  cachedExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

export async function createEvent({ summary, description, startsAt, endsAt, attendees = [] }) {
  try {
    const token = await getAccessToken();
    const { data } = await axios.post(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?conferenceDataVersion=1`,
      {
        summary,
        description,
        start: { dateTime: startsAt, timeZone: 'America/Sao_Paulo' },
        end: { dateTime: endsAt, timeZone: 'America/Sao_Paulo' },
        attendees,
        conferenceData: { createRequest: { requestId: `req-${Date.now()}`, conferenceSolutionKey: { type: 'hangoutsMeet' } } },
        reminders: { useDefault: false, overrides: [{ method: 'email', minutes: 60 }, { method: 'popup', minutes: 10 }] },
      },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    return {
      id: data.id,
      meetLink: data.hangoutLink || data.conferenceData?.entryPoints?.[0]?.uri,
      htmlLink: data.htmlLink,
    };
  } catch (err) {
    logger.error({ err: err.response?.data || err.message }, 'gcal.create.fail');
    throw err;
  }
}

export async function cancelEvent(eventId) {
  try {
    const token = await getAccessToken();
    await axios.delete(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events/${eventId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { ok: true };
  } catch (err) {
    logger.error({ eventId, err: err.message }, 'gcal.cancel.fail');
    throw err;
  }
}
