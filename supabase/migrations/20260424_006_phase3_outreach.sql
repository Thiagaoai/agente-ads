-- Phase 3 · Outbound email sequences + meetings

create table if not exists email_sequences (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  name text not null,
  steps jsonb not null,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists email_enrollments (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid references email_sequences(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  current_step int default 0,
  next_send_at timestamptz,
  last_sent_at timestamptz,
  status text default 'active' check (status in ('active', 'paused', 'replied', 'bounced', 'completed')),
  created_at timestamptz default now(),
  unique (sequence_id, lead_id)
);

create table if not exists email_events (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid references email_enrollments(id) on delete cascade,
  event_type text check (event_type in ('sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed')),
  step int,
  metadata jsonb,
  occurred_at timestamptz default now()
);

create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  lead_id uuid references leads(id) on delete set null,
  google_event_id text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  attendee_email text,
  attendee_name text,
  meet_link text,
  status text default 'scheduled' check (status in ('scheduled', 'confirmed', 'cancelled', 'no_show', 'completed')),
  created_at timestamptz default now()
);

create index if not exists idx_enrollments_next_send on email_enrollments(next_send_at) where status = 'active';
create index if not exists idx_meetings_upcoming on meetings(client_id, starts_at) where status in ('scheduled', 'confirmed');
