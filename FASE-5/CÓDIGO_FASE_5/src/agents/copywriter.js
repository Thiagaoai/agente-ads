import { BaseAgent } from './base-agent.js';
import { openai } from '../integrations/openai.js';
import { supabase } from '../integrations/supabase.js';
import config from '../config.js';
import logger from '../utils/logger.js';

export class CopywriterAgent extends BaseAgent {
  constructor() {
    super('copywriter');
  }

  async execute() {
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'draft')
      .is('copy_generated_at', null)
      .limit(5);

    if (error) throw error;
    if (!campaigns?.length) {
      logger.info('[copywriter] nothing to generate');
      return { generated: 0 };
    }

    let generated = 0;
    for (const campaign of campaigns) {
      const variants = await this.generateVariants(campaign);
      const rows = variants.map((v) => ({
        campaign_id: campaign.id,
        type: 'copy',
        content: v,
        supervisor_score: null,
        approved: false,
      }));

      const { error: insertErr } = await supabase.from('campaign_assets').insert(rows);
      if (insertErr) {
        logger.error({ campaign: campaign.id, err: insertErr.message }, 'copywriter.insert.fail');
        continue;
      }

      await supabase
        .from('campaigns')
        .update({ copy_generated_at: new Date().toISOString() })
        .eq('id', campaign.id);

      generated += variants.length;
    }

    return { generated, campaigns: campaigns.length };
  }

  async generateVariants(campaign) {
    const { variantsPerRun, lengthVariants, toneVariants } = config.agents.copywriter;
    const prompt = this.buildPrompt(campaign, lengthVariants, toneVariants);

    const completion = await openai.chat.completions.create({
      model: config.openai.model,
      temperature: config.openai.temperature,
      max_tokens: config.openai.maxTokens,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are a performance copywriter. Output strict JSON: {"variants":[{"headline":"","description":"","primary_text":""},...]}' },
        { role: 'user', content: prompt },
      ],
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    return (parsed.variants || []).slice(0, variantsPerRun);
  }

  buildPrompt(campaign, lengths, tones) {
    return `Generate 5 ad copy variants for platform=${campaign.platform}, objective=${campaign.objective}, audience=${campaign.audience}, landing_url=${campaign.landing_url}.
Vary length across: ${lengths.join(', ')}.
Vary tone across: ${tones.join(', ')}.
Return ONLY JSON in shape {"variants":[{"headline":"<=40 chars","description":"<=90 chars","primary_text":"<=125 chars"}]}`;
  }
}
