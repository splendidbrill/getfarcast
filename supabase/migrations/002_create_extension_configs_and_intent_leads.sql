create extension if not exists pgcrypto;

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.extension_configs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  connected_handles jsonb not null default '{}'::jsonb,
  selectors jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  constraint extension_configs_connected_handles_is_object
    check (jsonb_typeof(connected_handles) = 'object'),
  constraint extension_configs_selectors_is_object
    check (jsonb_typeof(selectors) = 'object')
);

drop trigger if exists extension_configs_set_updated_at on public.extension_configs;
create trigger extension_configs_set_updated_at
before update on public.extension_configs
for each row
execute function public.set_updated_at_timestamp();

create table if not exists public.intent_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  playbook_id text not null,
  platform text not null
    check (platform in ('twitter_x', 'reddit', 'linkedin')),
  username_or_name text not null,
  bio_or_headline text,
  profile_url text not null,
  matched_text_preview text,
  matched_keyword text not null,
  source_url text not null,
  posted_at timestamptz,
  intent_score numeric(6,2),
  lead_fingerprint text not null,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  constraint intent_leads_raw_payload_is_object
    check (jsonb_typeof(raw_payload) = 'object')
);

create unique index if not exists intent_leads_user_fingerprint_uidx
  on public.intent_leads(user_id, lead_fingerprint);

create index if not exists intent_leads_user_playbook_created_idx
  on public.intent_leads(user_id, playbook_id, created_at desc);

create index if not exists intent_leads_platform_idx
  on public.intent_leads(platform);

create index if not exists intent_leads_posted_at_idx
  on public.intent_leads(posted_at desc);

drop trigger if exists intent_leads_set_updated_at on public.intent_leads;
create trigger intent_leads_set_updated_at
before update on public.intent_leads
for each row
execute function public.set_updated_at_timestamp();

alter table public.extension_configs enable row level security;
alter table public.intent_leads enable row level security;

drop policy if exists "extension_configs_select_own" on public.extension_configs;
create policy "extension_configs_select_own"
  on public.extension_configs
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "extension_configs_insert_own" on public.extension_configs;
create policy "extension_configs_insert_own"
  on public.extension_configs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "extension_configs_update_own" on public.extension_configs;
create policy "extension_configs_update_own"
  on public.extension_configs
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "intent_leads_select_own" on public.intent_leads;
create policy "intent_leads_select_own"
  on public.intent_leads
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "intent_leads_insert_own" on public.intent_leads;
create policy "intent_leads_insert_own"
  on public.intent_leads
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "intent_leads_update_own" on public.intent_leads;
create policy "intent_leads_update_own"
  on public.intent_leads
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);