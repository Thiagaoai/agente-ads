-- Phase 5 · Marketing Squad schema
-- Applies to agente-ads-roberts and any per-client project.

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  platform text not null check (platform in ('google_ads', 'meta_ads')),
  objective text,
  audience text,
  landing_url text,
  daily_budget_cents int,
  keywords text[],
  status text not null default 'draft'
    check (status in ('draft', 'copy_pending', 'review_pending', 'approved', 'launched_paused', 'active', 'paused', 'ended')),
  copy_generated_at timestamptz,
  approved_at timestamptz,
  launched_at timestamptz,
  google_campaign_id text,
  meta_campaign_id text,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_campaigns_client on campaigns(client_id);
create index if not exists idx_campaigns_status on campaigns(status);
create index if not exists idx_campaigns_platform on campaigns(platform);

create table if not exists campaign_assets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  type text not null check (type in ('copy', 'image', 'video')),
  content jsonb,
  asset_url text,
  cloudinary_public_id text,
  supervisor_score int,
  supervisor_reason text,
  approved boolean default false,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_assets_campaign on campaign_assets(campaign_id);
create index if not exists idx_assets_approved on campaign_assets(approved);

create table if not exists brand_guidelines (
  client_id text primary key,
  client_name text,
  guidelines jsonb not null,
  updated_at timestamptz default now()
);

create table if not exists metrics (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  date date not null,
  impressions int default 0,
  clicks int default 0,
  conversions int default 0,
  cost_cents int default 0,
  ctr numeric(5, 4),
  cpa_cents int,
  roas numeric(6, 2),
  captured_at timestamptz default now(),
  unique (campaign_id, date)
);

create index if not exists idx_metrics_campaign_date on metrics(campaign_id, date desc);

create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  started_at timestamptz default now(),
  finished_at timestamptz,
  status text check (status in ('running', 'ok', 'fail')),
  result jsonb,
  error text
);

create index if not exists idx_agent_runs_name_time on agent_runs(agent_name, started_at desc);

create or replace function touch_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists campaigns_updated_at on campaigns;
create trigger campaigns_updated_at
  before update on campaigns
  for each row execute function touch_updated_at();
