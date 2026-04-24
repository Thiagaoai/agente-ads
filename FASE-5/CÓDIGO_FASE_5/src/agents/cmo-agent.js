import { BaseAgent } from './base-agent.js';
import { supabase } from '../integrations/supabase.js';
import { notifyOperator } from '../telegram/bot.js';
import logger from '../utils/logger.js';

export class CmoAgent extends BaseAgent {
  constructor() {
    super('cmo');
    this.registry = null;
  }

  setRegistry(agents) {
    this.registry = agents;
  }

  async execute() {
    if (!this.registry) {
      logger.warn('[cmo] registry not set — skipping orchestration');
      return { orchestrated: 0 };
    }

    const actions = [];

    const needsImages = await this.countStage('copy_approved_no_image');
    const needsReview = await this.countStage('assets_pending_review');
    const needsLaunch = await this.countStage('approved_not_launched');

    if (needsImages > 0 && this.registry.imageCreator) {
      actions.push({ agent: 'imageCreator', reason: `${needsImages} campaign(s) with approved copy and no image` });
      await this.registry.imageCreator.run();
    }

    if (needsReview > 0 && this.registry.supervisor) {
      actions.push({ agent: 'supervisor', reason: `${needsReview} asset(s) awaiting review` });
      await this.registry.supervisor.run();
    }

    if (needsLaunch > 0) {
      const { data } = await supabase
        .from('campaigns')
        .select('platform')
        .eq('status', 'approved');
      const platforms = new Set((data || []).map((r) => r.platform));
      if (platforms.has('meta_ads') && this.registry.metaAdsAgent) {
        actions.push({ agent: 'metaAdsAgent', reason: 'launching approved meta campaigns' });
        await this.registry.metaAdsAgent.run();
      }
      if (platforms.has('google_ads') && this.registry.googleAdsAgent) {
        actions.push({ agent: 'googleAdsAgent', reason: 'launching approved google campaigns' });
        await this.registry.googleAdsAgent.run();
      }
    }

    if (actions.length) {
      const summary = `🎯 *CMO orchestrator*\n${actions.map((a) => `  • ${a.agent} — ${a.reason}`).join('\n')}`;
      await notifyOperator(summary, { parse_mode: 'Markdown' });
    }

    return { orchestrated: actions.length, actions };
  }

  async countStage(stage) {
    if (stage === 'copy_approved_no_image') {
      const { count } = await supabase
        .from('campaigns')
        .select('id, campaign_assets!inner(type, approved)', { count: 'exact', head: true })
        .eq('campaign_assets.type', 'copy')
        .eq('campaign_assets.approved', true)
        .in('status', ['draft', 'copy_pending']);
      return count ?? 0;
    }
    if (stage === 'assets_pending_review') {
      const { count } = await supabase
        .from('campaign_assets')
        .select('id', { count: 'exact', head: true })
        .is('supervisor_score', null);
      return count ?? 0;
    }
    if (stage === 'approved_not_launched') {
      const { count } = await supabase
        .from('campaigns')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved');
      return count ?? 0;
    }
    return 0;
  }
}
