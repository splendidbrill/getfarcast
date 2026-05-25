-- ============================================================
-- Hermes V2: Daily Content Engine
-- ============================================================

-- trend_intel: Serper-fetched industry news used as anchor fallback
create table if not exists public.trend_intel (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  playbook_id text,
  headline text not null,
  snippet text,
  source_url text,
  fetched_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_trend_intel_user_playbook on public.trend_intel(user_id, playbook_id);
create index if not exists idx_trend_intel_fetched_at on public.trend_intel(fetched_at);

alter table public.trend_intel enable row level security;
create policy "Users can read their own trend intel"
  on public.trend_intel for select using (auth.uid() = user_id);

-- anchor_history: rotation tracking — prevents repeating same anchor within 7 days
create table if not exists public.anchor_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  playbook_id text not null,
  anchor_text text not null,
  anchor_type text not null check (anchor_type in ('competitor_weakness', 'industry_trend')),
  source_ref text,
  weakness_fingerprint text not null,
  used_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_anchor_history_user_playbook on public.anchor_history(user_id, playbook_id);
create index if not exists idx_anchor_history_used_at on public.anchor_history(used_at);
create index if not exists idx_anchor_history_fingerprint on public.anchor_history(weakness_fingerprint);

alter table public.anchor_history enable row level security;
create policy "Users can read their own anchor history"
  on public.anchor_history for select using (auth.uid() = user_id);

-- daily_queue: Hermes V2 output — populated by cron at 05:00 UTC
create table if not exists public.daily_queue (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  playbook_id text not null,
  platform text not null check (platform in ('linkedin', 'x', 'reddit')),
  draft_text text not null,
  rationale_tag text,
  voice_fit_score float,
  scheduled_time timestamp with time zone,
  status text not null default 'pending_approval'
    check (status in ('pending_approval', 'approved', 'published', 'skipped')),
  x_slot text check (x_slot in ('am_hook', 'noon_update', 'pm_reply_bait')),
  linkedin_directive text check (
    linkedin_directive in ('framework_teardown', 'vulnerable_retrospective', 'contrarian_operator')
  ),
  anchor_history_id uuid references public.anchor_history(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_daily_queue_user_id on public.daily_queue(user_id);
create index if not exists idx_daily_queue_status on public.daily_queue(status);
create index if not exists idx_daily_queue_scheduled_time on public.daily_queue(scheduled_time);
create index if not exists idx_daily_queue_platform on public.daily_queue(platform);
create index if not exists idx_daily_queue_created_at on public.daily_queue(created_at);

alter table public.daily_queue enable row level security;
create policy "Users can manage their own daily queue"
  on public.daily_queue for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
