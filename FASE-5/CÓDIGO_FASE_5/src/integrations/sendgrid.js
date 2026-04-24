import axios from 'axios';
import logger from '../utils/logger.js';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
const FROM_NAME = process.env.SENDGRID_FROM_NAME;

const api = axios.create({
  baseURL: 'https://api.sendgrid.com/v3',
  timeout: 10000,
  headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
});

export async function sendEmail({ to, subject, html, text, customArgs = {} }) {
  try {
    const { data } = await api.post('/mail/send', {
      personalizations: [{ to: [{ email: to }], custom_args: customArgs }],
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject,
      content: [
        text ? { type: 'text/plain', value: text } : null,
        html ? { type: 'text/html', value: html } : null,
      ].filter(Boolean),
      tracking_settings: { click_tracking: { enable: true }, open_tracking: { enable: true } },
    });
    return data;
  } catch (err) {
    logger.error({ err: err.response?.data || err.message }, 'sendgrid.send.fail');
    throw err;
  }
}
