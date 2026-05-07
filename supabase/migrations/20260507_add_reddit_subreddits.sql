create table if not exists public.user_subreddits (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    playbook_id text not null,
    subreddits text[] not null default '{}',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, playbook_id)
);

create index if not exists idx_user_subreddits_user_playbook on public.user_subreddits(user_id, playbook_id);

alter table public.user_subreddits enable row level security;

create policy "Users can manage their own subreddits"
on public.user_subreddits for all
using ( auth.uid() = user_id )
with check ( auth.uid() = user_id );

-- Shared cache table — public Reddit data, no per-user sensitivity
create table if not exists public.subreddit_cache (
    subreddit text primary key,
    rules text not null default '',
    top_posts jsonb not null default '[]',
    fetched_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.subreddit_cache enable row level security;

create policy "Authenticated users can read subreddit cache"
on public.subreddit_cache for select
using ( auth.role() = 'authenticated' );

create policy "Authenticated users can write subreddit cache"
on public.subreddit_cache for insert
with check ( auth.role() = 'authenticated' );

create policy "Authenticated users can update subreddit cache"
on public.subreddit_cache for update
using ( auth.role() = 'authenticated' );
