import { CopywriterAgent } from './copywriter.js';
import { SupervisorAgent } from './supervisor.js';
import { MetaAdsAgent } from './meta-ads-agent.js';
import {
  StrategistAgent,
  ImageCreatorAgent,
  VideoCreatorAgent,
  GoogleAdsAgent,
  SeoAgent,
  AnalyticsAgent,
  DeveloperAgent,
  CmoAgent,
} from './stubs.js';

export async function registerAgents() {
  return {
    cmo: new CmoAgent(),
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
}
