-- Phase 5 · SEO tracking tables

create table if not exists seo_rankings (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  domain text not null,
  keyword text not null,
  rank int,
  search_volume int,
  keyword_difficulty numeric(5, 2),
  traffic_value int,
  checked_at timestamptz default now()
);

create index if not exists idx_seo_client_keyword on seo_rankings(client_id, keyword, checked_at desc);

create table if not exists seo_competitors (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  domain text not null,
  competitor_domain text not null,
  similarity_rank int,
  checked_at timestamptz default now()
);

create index if not exists idx_seo_competitors_client on seo_competitors(client_id, checked_at desc);
