import TelegramBot from 'node-telegram-bot-api';
import { supabase } from '../integrations/supabase.js';
import config from '../config.js';
import logger from '../utils/logger.js';

let botInstance = null;

export async function startTelegramBot(agents) {
  if (!config.telegram.botToken) {
    logger.warn('[telegram] TELEGRAM_BOT_TOKEN missing — bot disabled');
    return null;
  }

  const bot = new TelegramBot(config.telegram.botToken, { polling: true });
  botInstance = bot;
  const operatorId = String(config.telegram.operatorId);

  const guard = (msg) => {
    if (String(msg.from.id) !== operatorId) {
      bot.sendMessage(msg.chat.id, '⛔ Não autorizado');
      return false;
    }
    return true;
  };

  bot.onText(/^\/start/, (msg) => {
    if (!guard(msg)) return;
    bot.sendMessage(msg.chat.id,
      `🤖 *Agente-Ads* · Meta + Google (${process.env.CLIENT_ID ?? 'unset'})\n\nComandos:\n/status — estado dos 11 agentes\n/campaigns — campanhas ativas\n/campaign <id> — detalhes\n/approve <id> — libera assets aprovados\n/pause <id> — pausa campanha\n/budget <id> <valor> — ajusta orçamento\n/run <agent> — roda agente on-demand`,
      { parse_mode: 'Markdown' });
  });

  bot.onText(/^\/status/, async (msg) => {
    if (!guard(msg)) return;
    const lines = Object.entries(agents).map(([name, a]) => {
      const icon = a.status === 'idle' ? '✅' : a.status === 'running' ? '⏳' : '❌';
      const last = a.lastRun ? ` · last: ${a.lastRun.slice(11, 19)}Z` : '';
      return `${icon} ${name}${last}`;
    });
    bot.sendMessage(msg.chat.id, `*Agentes*\n\`\`\`\n${lines.join('\n')}\n\`\`\``, { parse_mode: 'Markdown' });
  });

  bot.onText(/^\/campaigns/, async (msg) => {
    if (!guard(msg)) return;
    const { data, error } = await supabase
      .from('campaigns')
      .select('id, platform, status, daily_budget_cents, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) return bot.sendMessage(msg.chat.id, `❌ ${error.message}`);
    if (!data?.length) return bot.sendMessage(msg.chat.id, 'Nenhuma campanha.');
    const lines = data.map((c) =>
      `\`${c.id.slice(0, 8)}\` · ${c.platform} · ${c.status} · $${((c.daily_budget_cents ?? 0) / 100).toFixed(0)}/d`
    );
    bot.sendMessage(msg.chat.id, lines.join('\n'), { parse_mode: 'Markdown' });
  });

  bot.onText(/^\/campaign (.+)/, async (msg, match) => {
    if (!guard(msg)) return;
    const id = match[1].trim();
    const { data, error } = await supabase
      .from('campaigns')
      .select('*, campaign_assets(id, type, approved, supervisor_score)')
      .or(`id.eq.${id},id.like.${id}%`)
      .maybeSingle();
    if (error || !data) return bot.sendMessage(msg.chat.id, '❌ Não encontrada');
    const assets = data.campaign_assets || [];
    const approved = assets.filter((a) => a.approved).length;
    bot.sendMessage(msg.chat.id,
      `*${data.id.slice(0, 8)}* · ${data.platform}\nStatus: ${data.status}\nBudget: $${(data.daily_budget_cents / 100).toFixed(0)}/d\nAssets: ${approved}/${assets.length} aprovados\nLP: ${data.landing_url ?? '—'}`,
      { parse_mode: 'Markdown' });
  });

  bot.onText(/^\/approve (.+)/, async (msg, match) => {
    if (!guard(msg)) return;
    const id = match[1].trim();
    const { data, error } = await supabase
      .from('campaigns')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .or(`id.eq.${id},id.like.${id}%`)
      .select()
      .single();
    if (error) return bot.sendMessage(msg.chat.id, `❌ ${error.message}`);
    bot.sendMessage(msg.chat.id, `✅ Campanha ${data.id.slice(0, 8)} aprovada — próxima execução do agente vai subir nos ads.`);
  });

  bot.onText(/^\/pause (.+)/, async (msg, match) => {
    if (!guard(msg)) return;
    const id = match[1].trim();
    const { error } = await supabase
      .from('campaigns')
      .update({ status: 'paused' })
      .or(`id.eq.${id},id.like.${id}%`);
    if (error) return bot.sendMessage(msg.chat.id, `❌ ${error.message}`);
    bot.sendMessage(msg.chat.id, `⏸️ Campanha ${id} pausada`);
  });

  bot.onText(/^\/budget (\S+) (\d+)/, async (msg, match) => {
    if (!guard(msg)) return;
    const [, id, amount] = match;
    const { error } = await supabase
      .from('campaigns')
      .update({ daily_budget_cents: Number(amount) * 100 })
      .or(`id.eq.${id},id.like.${id}%`);
    if (error) return bot.sendMessage(msg.chat.id, `❌ ${error.message}`);
    bot.sendMessage(msg.chat.id, `💰 Budget ajustado para $${amount}/d`);
  });

  bot.onText(/^\/run (\w+)/, async (msg, match) => {
    if (!guard(msg)) return;
    const name = match[1].trim();
    const agent = agents[name];
    if (!agent) return bot.sendMessage(msg.chat.id, `❌ Agente "${name}" não existe`);
    bot.sendMessage(msg.chat.id, `⏳ Rodando ${name}...`);
    try {
      const result = await agent.run();
      bot.sendMessage(msg.chat.id, `✅ ${name}:\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``, { parse_mode: 'Markdown' });
    } catch (err) {
      bot.sendMessage(msg.chat.id, `❌ ${name} falhou: ${err.message}`);
    }
  });

  bot.on('polling_error', (err) => {
    logger.error({ err: err.message }, 'telegram.polling.error');
  });

  logger.info('[telegram] bot up · polling started');
  return bot;
}

export function notifyOperator(text, opts = {}) {
  if (!botInstance || !config.telegram.operatorId) return;
  return botInstance.sendMessage(config.telegram.operatorId, text, opts);
}
