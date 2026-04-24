-- Phase 2 · SDR pipeline

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  source text,
  apollo_id text,
  email text,
  first_name text,
  last_name text,
  title text,
  company text,
  domain text,
  phone text,
  linkedin_url text,
  score int default 0,
  enriched_at timestamptz,
  contacted_at timestamptz,
  status text default 'new' check (status in ('new', 'enriched', 'contacted', 'replied', 'booked', 'disqualified')),
  metadata jsonb,
  created_at timestamptz default now()
);

create unique index if not exists idx_leads_apollo_unique on leads(client_id, apollo_id) where apollo_id is not null;
create index if not exists idx_leads_status on leads(client_id, status);
create index if not exists idx_leads_score on leads(client_id, score desc);

create table if not exists lead_signals (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  signal_type text,
  signal_value text,
  captured_at timestamptz default now()
);
