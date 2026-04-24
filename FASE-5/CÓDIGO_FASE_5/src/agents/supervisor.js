import { BaseAgent } from './base-agent.js';
import { openai } from '../integrations/openai.js';
import { supabase } from '../integrations/supabase.js';
import { getBrandGuidelines } from '../utils/brand-guidelines.js';
import config from '../config.js';
import logger from '../utils/logger.js';

export class SupervisorAgent extends BaseAgent {
  constructor() {
    super('supervisor');
  }

  async execute() {
    const { data: assets, error } = await supabase
      .from('campaign_assets')
      .select('*, campaigns!inner(*)')
      .is('supervisor_score', null)
      .limit(20);

    if (error) throw error;
    if (!assets?.length) return { reviewed: 0 };

    const guidelines = await getBrandGuidelines(process.env.CLIENT_ID);
    const { approvalThreshold } = config.agents.supervisor;

    let approved = 0;
    let rejected = 0;

    for (const asset of assets) {
      const { score, reason } = await this.reviewAsset(asset, guidelines);
      const isApproved = score >= approvalThreshold;

      const { error: upErr } = await supabase
        .from('campaign_assets')
        .update({
          supervisor_score: score,
          supervisor_reason: reason,
          approved: isApproved,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', asset.id);

      if (upErr) {
        logger.error({ asset: asset.id, err: upErr.message }, 'supervisor.update.fail');
        continue;
      }

      if (isApproved) approved++; else rejected++;
    }

    return { reviewed: assets.length, approved, rejected };
  }

  async reviewAsset(asset, guidelines) {
    const completion = await openai.chat.completions.create({
      model: config.openai.model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a brand compliance supervisor. Review ad assets against guidelines and return strict JSON: {"score":1-10,"reason":"<=200 chars"}. Score >= 7 means approved. Be strict on banned terms, claims, and tone.`,
        },
        {
          role: 'user',
          content: `Guidelines:\n${JSON.stringify(guidelines)}\n\nAsset (type=${asset.type}):\n${JSON.stringify(asset.content)}`,
        },
      ],
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    return {
      score: Math.max(1, Math.min(10, parsed.score ?? 1)),
      reason: (parsed.reason ?? '').slice(0, 200),
    };
  }
}
