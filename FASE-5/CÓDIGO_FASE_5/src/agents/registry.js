import { CopywriterAgent } from './copywriter.js';
import { SupervisorAgent } from './supervisor.js';
import { MetaAdsAgent } from './meta-ads-agent.js';
import { ImageCreatorAgent } from './image-creator.js';
import { GoogleAdsAgent } from './google-ads-agent.js';
import { AnalyticsAgent } from './analytics-agent.js';
import { StrategistAgent } from './strategist.js';
import { VideoCreatorAgent } from './video-creator.js';
import { SeoAgent } from './seo-agent.js';
import { DeveloperAgent } from './developer-agent.js';
import { CmoAgent } from './cmo-agent.js';

export async function registerAgents() {
  const cmo = new CmoAgent();
  const agents = {
    cmo,
    strategist: new StrategistAgent(),
    copywriter: new CopywriterAgent(),
    imageCreator: new ImageCreatorAgent(),
    videoCreator: new VideoCreatorAgent(),
    googleAdsAgent: new GoogleAdsAgent(),
    metaAdsAgent: new MetaAdsAgent(),
    seoAgent: new SeoAgent(),
    analyticsAgent: new AnalyticsAgent(),
    supervisor: new SupervisorAgent(),
    developerAgent: new DeveloperAgent(),
  };
  cmo.setRegistry(agents);
  return agents;
}
