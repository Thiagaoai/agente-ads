import { BaseAgent } from './base-agent.js';
import { people } from '../integrations/apollo.js';
import { supabase } from '../integrations/supabase.js';
import logger from '../utils/logger.js';

export class SdrAgent extends BaseAgent {
  constructor() {
    super('sdrAgent');
  }

  async execute(context = {}) {
    const clientId = process.env.CLIENT_ID ?? 'unset';
    const icp = context.icp || await this.loadIcp(clientId);

    if (!icp) {
      logger.info('[sdr] no ICP configured for client');
      return { added: 0, reason: 'no_icp' };
    }

    const found = await people.search({
      titles: icp.titles || [],
      locations: icp.locations || [],
      industries: icp.industries || [],
      perPage: icp.perPage ?? 50,
    });

    let added = 0;
    for (const p of found) {
      const score = this.scoreLead(p, icp);
      const { error } = await supabase.from('leads').upsert({
        client_id: clientId,
        source: 'apollo',
        apollo_id: p.id,
        email: p.email || null,
        first_name: p.first_name,
        last_name: p.last_name,
        title: p.title,
        company: p.organization?.name,
        domain: p.organization?.primary_domain || p.organization?.website_url,
        linkedin_url: p.linkedin_url,
        score,
        status: 'enriched',
        enriched_at: new Date().toISOString(),
        metadata: p,
      }, { onConflict: 'client_id,apollo_id' });

      if (error) {
        logger.error({ apollo: p.id, err: error.message }, 'sdr.upsert.fail');
        continue;
      }
      added++;
    }

    return { added, considered: found.length };
  }

  scoreLead(person, icp) {
    let score = 50;
    const title = (person.title || '').toLowerCase();
    if (icp.seniority_priority) {
      for (const [level, bump] of Object.entries(icp.seniority_priority)) {
        if (title.includes(level.toLowerCase())) score += bump;
      }
    }
    if (person.email) score += 10;
    if (person.linkedin_url) score += 5;
    const size = person.organization?.estimated_num_employees;
    if (size && icp.companySizeRange) {
      const [min, max] = icp.companySizeRange;
      if (size >= min && size <= max) score += 15;
    }
    return Math.min(100, Math.max(0, score));
  }

  async loadIcp(clientId) {
    const { data } = await supabase
      .from('brand_guidelines')
      .select('guidelines')
      .eq('client_id', clientId)
      .maybeSingle();
    return data?.guidelines?.icp ?? null;
  }
}
