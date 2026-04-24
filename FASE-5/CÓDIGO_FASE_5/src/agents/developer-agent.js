import { BaseAgent } from './base-agent.js';
import { openai } from '../integrations/openai.js';
import { supabase } from '../integrations/supabase.js';
import { getBrandGuidelines } from '../utils/brand-guidelines.js';
import config from '../config.js';
import logger from '../utils/logger.js';

export class DeveloperAgent extends BaseAgent {
  constructor() {
    super('developerAgent');
  }

  async execute(context = {}) {
    const campaignId = context.campaignId;
    if (!campaignId) {
      logger.info('[developerAgent] on-demand only — pass { campaignId } via /run');
      return { generated: 0 };
    }

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*, campaign_assets(*)')
      .eq('id', campaignId)
      .single();
    if (error || !campaign) throw new Error('campaign not found');

    const guidelines = await getBrandGuidelines(campaign.client_id);
    const approvedCopy = (campaign.campaign_assets || []).filter((a) => a.type === 'copy' && a.approved);
    const approvedImages = (campaign.campaign_assets || []).filter((a) => a.type === 'image' && a.approved);

    const html = await this.generateHtml({ campaign, guidelines, approvedCopy, approvedImages });
    const slug = this.slugify(`${campaign.objective}-${campaign.id.slice(0, 8)}`);

    const { data: saved, error: insErr } = await supabase
      .from('landing_pages')
      .upsert({
        client_id: campaign.client_id,
        campaign_id: campaign.id,
        slug,
        html,
      }, { onConflict: 'client_id,slug' })
      .select()
      .single();
    if (insErr) throw insErr;

    return { generated: 1, slug, id: saved.id, length: html.length };
  }

  async generateHtml({ campaign, guidelines, approvedCopy, approvedImages }) {
    const completion = await openai.chat.completions.create({
      model: config.openai.model,
      temperature: 0.4,
      max_tokens: 4096,
      messages: [
        {
          role: 'system',
          content: `You are a senior landing page developer. Output a single self-contained HTML document (no markdown, no backticks). Use Tailwind via CDN (https://cdn.tailwindcss.com). Mobile-first. Include: hero with headline + CTA, 3-feature strip, testimonial, secondary CTA, footer. No JavaScript frameworks. Keep under 300 lines.`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            brand: guidelines?.company ?? {},
            palette: guidelines?.visualIdentity?.primaryColors ?? {},
            tone: guidelines?.voice?.tone ?? 'professional',
            objective: campaign.objective,
            audience: campaign.audience,
            cta_url: campaign.landing_url,
            copy_variants: approvedCopy.map((a) => a.content),
            hero_image_url: approvedImages[0]?.asset_url ?? null,
          }, null, 2),
        },
      ],
    });

    return completion.choices[0].message.content.trim();
  }

  slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
}
