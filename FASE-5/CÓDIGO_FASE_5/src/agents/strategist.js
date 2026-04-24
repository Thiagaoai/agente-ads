import { BaseAgent } from './base-agent.js';
import { openai } from '../integrations/openai.js';
import { supabase } from '../integrations/supabase.js';
import { getBrandGuidelines } from '../utils/brand-guidelines.js';
import { notifyOperator } from '../telegram/bot.js';
import config from '../config.js';
import logger from '../utils/logger.js';

export class StrategistAgent extends BaseAgent {
  constructor() {
    super('strategist');
  }

  async execute() {
    const clientId = process.env.CLIENT_ID ?? 'unset';
    const context = await this.gatherContext(clientId);
    const plan = await this.generatePlan(clientId, context);

    if (!plan?.campaigns?.length) {
      logger.info('[strategist] model returned no campaigns');
      return { drafted: 0 };
    }

    const rows = plan.campaigns.map((c) => ({
      client_id: clientId,
      platform: c.platform,
      objective: c.objective,
      audience: c.audience,
      landing_url: c.landing_url || context.defaultLandingUrl,
      daily_budget_cents: Math.max(500, Math.round((c.daily_budget_usd ?? 50) * 100)),
      keywords: c.keywords || [],
      status: 'draft',
      created_by: 'strategist',
    }));

    const { data, error } = await supabase.from('campaigns').insert(rows).select('id, platform');
    if (error) throw error;

    const summary = `🧠 *Strategist · plano do dia (${clientId})*\n${plan.rationale ?? ''}\n\n${data.map((r) => `  • \`${r.id.slice(0, 8)}\` · ${r.platform}`).join('\n')}`;
    await notifyOperator(summary, { parse_mode: 'Markdown' });

    return { drafted: data.length, rationale: plan.rationale };
  }

  async gatherContext(clientId) {
    const [{ data: recentMetrics }, { data: recentLeads }] = await Promise.all([
      supabase
        .from('metrics')
        .select('date, platform:campaigns!inner(platform), impressions, clicks, conversions, cost_cents')
        .order('date', { ascending: false })
        .limit(30),
      supabase
        .from('leads')
        .select('id, source, score, created_at')
        .order('created_at', { ascending: false })
        .limit(20)
        .then((r) => (r.error?.code === '42P01' ? { data: [] } : r)),
    ]);

    const guidelines = await getBrandGuidelines(clientId);

    return {
      recentMetrics: recentMetrics || [],
      leadsCount: (recentLeads || []).length,
      leadsSources: [...new Set((recentLeads || []).map((l) => l.source))],
      defaultLandingUrl: process.env.CLIENT_DOMAIN ? `https://${process.env.CLIENT_DOMAIN}` : null,
      guidelines,
    };
  }

  async generatePlan(clientId, context) {
    const completion = await openai.chat.completions.create({
      model: config.openai.model,
      temperature: 0.6,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a senior paid-media strategist. Plan the day's ad campaigns based on recent performance and brand context. Output strict JSON: {"rationale":"1-2 sentence narrative","campaigns":[{"platform":"google_ads"|"meta_ads","objective":"CONVERSIONS"|"REACH"|"TRAFFIC","audience":"<description>","landing_url":"<url or null>","daily_budget_usd":<int>,"keywords":["<str>"]}]}. Output 1-3 campaigns max. Keep budgets conservative (30-150 USD/day per campaign) unless recent data strongly supports more.`,
        },
        {
          role: 'user',
          content: `Client: ${clientId}\nBrand: ${JSON.stringify(context.guidelines?.company ?? {})}\nRecent metrics sample: ${JSON.stringify(context.recentMetrics.slice(0, 10))}\nRecent leads: ${context.leadsCount} from ${context.leadsSources.join(', ') || 'none'}\nDefault landing: ${context.defaultLandingUrl ?? 'none'}\n\nDraft the day's plan.`,
        },
      ],
    });

    return JSON.parse(completion.choices[0].message.content);
  }
}
