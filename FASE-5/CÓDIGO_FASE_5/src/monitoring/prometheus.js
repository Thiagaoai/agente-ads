import { supabase } from '../integrations/supabase.js';

let counters = {
  agent_runs_total: new Map(),
  agent_failures_total: new Map(),
  webhooks_received_total: new Map(),
  campaigns_launched_total: new Map(),
};

export function incCounter(name, labels = {}) {
  const bucket = counters[name];
  if (!bucket) return;
  const key = JSON.stringify(labels);
  bucket.set(key, (bucket.get(key) || 0) + 1);
}

function formatLine(name, value, labels = {}) {
  const labelStr = Object.entries(labels).map(([k, v]) => `${k}="${String(v).replace(/"/g, '\\"')}"`).join(',');
  return `${name}${labelStr ? `{${labelStr}}` : ''} ${value}`;
}

export async function renderMetrics(agents) {
  const lines = [];

  lines.push('# HELP marketing_squad_agents Registered agents');
  lines.push('# TYPE marketing_squad_agents gauge');
  lines.push(`marketing_squad_agents ${Object.keys(agents || {}).length}`);

  lines.push('# HELP marketing_squad_agent_status 1 if idle, 0 if running/error');
  lines.push('# TYPE marketing_squad_agent_status gauge');
  for (const [name, agent] of Object.entries(agents || {})) {
    lines.push(formatLine('marketing_squad_agent_status', agent.status === 'idle' ? 1 : 0, { agent: name }));
  }

  for (const [metricName, bucket] of Object.entries(counters)) {
    lines.push(`# HELP marketing_squad_${metricName}`);
    lines.push(`# TYPE marketing_squad_${metricName} counter`);
    for (const [key, value] of bucket.entries()) {
      const labels = JSON.parse(key);
      lines.push(formatLine(`marketing_squad_${metricName}`, value, labels));
    }
  }

  try {
    const { count: activeCampaigns } = await supabase
      .from('campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');
    const { count: pendingReview } = await supabase
      .from('campaign_assets')
      .select('id', { count: 'exact', head: true })
      .is('supervisor_score', null);
    lines.push('# TYPE marketing_squad_active_campaigns gauge');
    lines.push(`marketing_squad_active_campaigns ${activeCampaigns ?? 0}`);
    lines.push('# TYPE marketing_squad_assets_pending_review gauge');
    lines.push(`marketing_squad_assets_pending_review ${pendingReview ?? 0}`);
  } catch {
    // skip db metrics if supabase unreachable
  }

  return lines.join('\n') + '\n';
}
