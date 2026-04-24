import { BaseAgent } from './base-agent.js';
import { videos } from '../integrations/runway.js';
import { uploadFromUrl } from '../integrations/cloudinary.js';
import { supabase } from '../integrations/supabase.js';
import config from '../config.js';
import logger from '../utils/logger.js';

const POLL_INTERVAL_MS = 10000;
const MAX_POLL_ATTEMPTS = 30;

export class VideoCreatorAgent extends BaseAgent {
  constructor() {
    super('videoCreator');
  }

  async execute() {
    const { data: candidates, error } = await supabase
      .from('campaigns')
      .select('id, client_id, platform, objective, audience, campaign_assets(id, type, approved, asset_url)')
      .eq('platform', 'meta_ads')
      .in('status', ['draft', 'copy_pending', 'review_pending', 'approved'])
      .limit(3);

    if (error) throw error;

    const queue = (candidates || []).filter((c) => {
      const hasApprovedImage = (c.campaign_assets || []).some((a) => a.type === 'image' && a.approved);
      const hasVideo = (c.campaign_assets || []).some((a) => a.type === 'video');
      return hasApprovedImage && !hasVideo;
    });

    if (!queue.length) {
      logger.info('[videoCreator] nothing to animate');
      return { generated: 0 };
    }

    const { durationSeconds, fps } = config.agents.videoCreator;
    let generated = 0;

    for (const campaign of queue) {
      const seedImage = (campaign.campaign_assets || []).find((a) => a.type === 'image' && a.approved);
      if (!seedImage?.asset_url) continue;

      try {
        const task = await videos.generate({
          promptImage: seedImage.asset_url,
          promptText: `Subtle camera motion, cinematic ad style, ${campaign.objective}`,
          duration: Math.min(durationSeconds, 10),
          fps,
        });

        const videoUrl = await this.pollUntilReady(task.taskId);
        if (!videoUrl) {
          logger.warn({ campaign: campaign.id, taskId: task.taskId }, 'videoCreator.timeout');
          continue;
        }

        const uploaded = await uploadFromUrl(videoUrl, {
          folder: `marketing-squad/${campaign.client_id}/video`,
          tags: [campaign.client_id, 'runway', 'gen3'],
        }).catch(() => ({ url: videoUrl, publicId: null }));

        await supabase.from('campaign_assets').insert({
          campaign_id: campaign.id,
          type: 'video',
          asset_url: uploaded.url,
          cloudinary_public_id: uploaded.publicId,
          content: { seed_image: seedImage.asset_url, duration: durationSeconds, fps },
          supervisor_score: null,
          approved: false,
        });

        generated++;
      } catch (err) {
        logger.error({ campaign: campaign.id, err: err.message }, 'videoCreator.fail');
      }
    }

    return { generated };
  }

  async pollUntilReady(taskId) {
    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      const status = await videos.getStatus(taskId);
      if (status.status === 'SUCCEEDED' || status.videoUrl) return status.videoUrl;
      if (status.status === 'FAILED' || status.error) {
        logger.error({ taskId, err: status.error }, 'runway.task.failed');
        return null;
      }
    }
    return null;
  }
}
