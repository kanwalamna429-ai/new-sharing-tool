-- ============================================================
-- PostFlow — Initial Schema
-- Safe to re-run: uses IF NOT EXISTS / DROP IF EXISTS.
-- ============================================================

-- ----------------------------------------------------------------
-- campaign_urls
-- ----------------------------------------------------------------
create table if not exists public.campaign_urls (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  campaign_id   uuid,
  title         text not null,
  original_url  text not null,
  short_url     text,
  slug          text unique,
  clicks        integer not null default 0,
  tags          text[] not null default '{}',
  is_active     boolean not null default true,
  deleted_at    timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.campaign_urls enable row level security;

drop policy if exists "Users manage own urls" on public.campaign_urls;
create policy "Users manage own urls"
  on public.campaign_urls
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------
-- campaigns
-- ----------------------------------------------------------------
create table if not exists public.campaigns (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  description     text,
  status          text not null default 'draft',
  platforms       text[] not null default '{}',
  url_ids         text[] not null default '{}',
  frequency       text,
  start_date      date,
  end_date        date,
  timezone        text not null default 'UTC',
  url_count       integer not null default 0,
  scheduled_posts integer not null default 0,
  published_posts integer not null default 0,
  failed_posts    integer not null default 0,
  success_rate    numeric not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.campaigns enable row level security;

drop policy if exists "Users manage own campaigns" on public.campaigns;
create policy "Users manage own campaigns"
  on public.campaigns
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------
-- platform_connections
-- ----------------------------------------------------------------
create table if not exists public.platform_connections (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  platform              text not null,
  account_name          text not null default '',
  account_handle        text not null,
  instance_url          text,
  status                text not null default 'connected',
  connected_at          timestamptz not null default now(),
  posts_published       integer not null default 0,
  credentials_encrypted text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (user_id, platform, account_handle)
);

alter table public.platform_connections enable row level security;

drop policy if exists "Users manage own connections" on public.platform_connections;
create policy "Users manage own connections"
  on public.platform_connections
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------
-- system_logs
-- ----------------------------------------------------------------
create table if not exists public.system_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  level       text not null default 'info',
  campaign    text not null default '',
  platform    text not null default '',
  message     text not null,
  post_id     text,
  created_at  timestamptz not null default now()
);

alter table public.system_logs enable row level security;

drop policy if exists "Users view own logs" on public.system_logs;
create policy "Users view own logs"
  on public.system_logs
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
