-- Phase 5 · Webhook event log from Meta + Google Ads

create table if not exists webhook_events (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('meta', 'google')),
  event_type text,
  payload jsonb,
  received_at timestamptz default now(),
  processed boolean default false
);

create index if not exists idx_webhook_events_source_time on webhook_events(source, received_at desc);
create index if not exists idx_webhook_events_unprocessed on webhook_events(processed) where processed = false;
