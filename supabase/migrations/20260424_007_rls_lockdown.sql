-- Phase 5 · Security hardening
-- Enable RLS on all public tables. Service role bypasses RLS (agents keep working).
-- Anon/public role gets zero access — no frontend/public consumer for now.
-- When a frontend is added later, create specific SELECT/INSERT policies per table.

alter table campaigns enable row level security;
alter table campaign_assets enable row level security;
alter table brand_guidelines enable row level security;
alter table metrics enable row level security;
alter table agent_runs enable row level security;
alter table seo_rankings enable row level security;
alter table seo_competitors enable row level security;
alter table landing_pages enable row level security;
alter table webhook_events enable row level security;
alter table leads enable row level security;
alter table lead_signals enable row level security;
alter table email_sequences enable row level security;
alter table email_enrollments enable row level security;
alter table email_events enable row level security;
alter table meetings enable row level security;

-- Harden touch_updated_at function (immutable search_path)
create or replace function touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
