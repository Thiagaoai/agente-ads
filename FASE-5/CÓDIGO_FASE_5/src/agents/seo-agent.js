import { BaseAgent } from './base-agent.js';
import { keywords as semrush } from '../integrations/semrush.js';
import { supabase } from '../integrations/supabase.js';
import config from '../config.js';
import logger from '../utils/logger.js';

export class SeoAgent extends BaseAgent {
  constructor() {
    super('seoAgent');
  }

  async execute() {
    const clientId = process.env.CLIENT_ID ?? 'unset';
    const domain = process.env.CLIENT_DOMAIN;
    if (!domain) {
      logger.warn('[seoAgent] CLIENT_DOMAIN not set — skipping');
      return { tracked: 0, reason: 'no_domain' };
    }

    const kwList = await this.resolveKeywordList(clientId);
    const limited = kwList.slice(0, config.agents.seoAgent.trackingLimit);

    let trackedRankings = 0;
    for (const kw of limited) {
      try {
        const rank = await semrush.getRankData(domain, kw);
        if (!rank) continue;
        await supabase.from('seo_rankings').insert({
          client_id: clientId,
          domain,
          keyword: kw,
          rank: rank.rank,
          search_volume: rank.searchVolume,
          keyword_difficulty: rank.keywordDifficulty,
          traffic_value: rank.trafficValue,
        });
        trackedRankings++;
      } catch (err) {
        logger.error({ kw, err: err.message }, 'seo.rank.fail');
      }
    }

    let trackedCompetitors = 0;
    try {
      const competitors = await semrush.getCompetitors(domain);
      for (const c of competitors.slice(0, 10)) {
        await supabase.from('seo_competitors').insert({
          client_id: clientId,
          domain,
          competitor_domain: c.competitorDomain,
          similarity_rank: c.similarityRank,
        });
        trackedCompetitors++;
      }
    } catch (err) {
      logger.error({ err: err.message }, 'seo.competitors.fail');
    }

    return { tracked: trackedRankings, competitors: trackedCompetitors };
  }

  async resolveKeywordList(clientId) {
    const { data } = await supabase
      .from('campaigns')
      .select('keywords')
      .eq('client_id', clientId)
      .not('keywords', 'is', null);

    const union = new Set();
    for (const row of data || []) {
      for (const k of row.keywords || []) union.add(k);
    }
    return [...union];
  }
}
