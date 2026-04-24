import { BaseAgent } from './base-agent.js';
import { campaigns as metaCampaigns } from '../integrations/meta-ads.js';
import { supabase } from '../integrations/supabase.js';
import config from '../config.js';
import logger from '../utils/logger.js';

export class MetaAdsAgent extends BaseAgent {
  constructor() {
    super('metaAdsAgent');
  }

  async execute() {
    const { data: ready, error } = await supabase
      .from('campaigns')
      .select('*, campaign_assets!inner(*)')
      .eq('platform', 'meta_ads')
      .eq('status', 'approved')
      .is('meta_campaign_id', null);

    if (error) throw error;
    if (!ready?.length) return { launched: 0 };

    let launched = 0;
    for (const campaign of ready) {
      const approvedAssets = (campaign.campaign_assets || []).filter((a) => a.approved);
      if (!approvedAssets.length) {
        logger.info({ campaign: campaign.id }, 'meta.skip.no_approved_assets');
        continue;
      }

      try {
        const created = await metaCampaigns.create({
          name: `${process.env.CLIENT_ID ?? 'client'}-${campaign.id.slice(0, 8)}`,
          objective: campaign.objective || 'CONVERSIONS',
          daily_budget_cents: campaign.daily_budget_cents ?? config.agents.metaAdsAgent.dailyBudgetCents,
        });

        await supabase
          .from('campaigns')
          .update({
            meta_campaign_id: created.id,
            status: 'launched_paused',
            launched_at: new Date().toISOString(),
          })
          .eq('id', campaign.id);

        launched++;
      } catch (err) {
        logger.error({ campaign: campaign.id, err: err.message }, 'meta.launch.fail');
      }
    }

    return { launched, considered: ready.length };
  }
}
