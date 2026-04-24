import crypto from 'node:crypto';
import { supabase } from '../integrations/supabase.js';
import { notifyOperator } from '../telegram/bot.js';
import logger from '../utils/logger.js';

const META_VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN;
const META_APP_SECRET = process.env.META_APP_SECRET;
const GOOGLE_WEBHOOK_SECRET = process.env.GOOGLE_WEBHOOK_SECRET;

function verifyMetaSignature(rawBody, signatureHeader) {
  if (!META_APP_SECRET || !signatureHeader) return false;
  const [algo, sig] = signatureHeader.split('=');
  if (algo !== 'sha256') return false;
  const expected = crypto.createHmac('sha256', META_APP_SECRET).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

export function routeWebhook(req, res, rawBody) {
  if (req.url.startsWith('/webhooks/meta')) return handleMeta(req, res, rawBody);
  if (req.url.startsWith('/webhooks/google')) return handleGoogle(req, res, rawBody);
  res.writeHead(404); res.end();
}

async function handleMeta(req, res, rawBody) {
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost');
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      return res.end(challenge);
    }
    res.writeHead(403); return res.end();
  }

  if (!verifyMetaSignature(rawBody, req.headers['x-hub-signature-256'])) {
    logger.warn('[webhook.meta] invalid signature');
    res.writeHead(401); return res.end();
  }

  try {
    const payload = JSON.parse(rawBody);
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === 'ads_insights' || change.field === 'ads_review') {
          await supabase.from('webhook_events').insert({
            source: 'meta',
            event_type: change.field,
            payload: change.value,
          });
          if (change.value?.review_feedback) {
            await notifyOperator(`⚠️ Meta ads review: ${JSON.stringify(change.value.review_feedback).slice(0, 500)}`);
          }
        }
      }
    }
    res.writeHead(200); res.end();
  } catch (err) {
    logger.error({ err: err.message }, 'webhook.meta.fail');
    res.writeHead(500); res.end();
  }
}

async function handleGoogle(req, res, rawBody) {
  const tokenHeader = req.headers['x-google-webhook-token'];
  if (!GOOGLE_WEBHOOK_SECRET || tokenHeader !== GOOGLE_WEBHOOK_SECRET) {
    logger.warn('[webhook.google] invalid token');
    res.writeHead(401); return res.end();
  }

  try {
    const payload = JSON.parse(rawBody);
    await supabase.from('webhook_events').insert({
      source: 'google',
      event_type: payload.event_type || 'unknown',
      payload,
    });
    if (payload.event_type === 'policy_violation' || payload.severity === 'HIGH') {
      await notifyOperator(`🚨 Google Ads alerta: ${JSON.stringify(payload).slice(0, 500)}`);
    }
    res.writeHead(200); res.end();
  } catch (err) {
    logger.error({ err: err.message }, 'webhook.google.fail');
    res.writeHead(500); res.end();
  }
}
