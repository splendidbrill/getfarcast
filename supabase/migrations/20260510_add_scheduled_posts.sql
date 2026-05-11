create table if not exists public.scheduled_posts (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    platform text not null check (platform in ('twitter', 'linkedin')),
    content text not null,
    scheduled_for timestamp with time zone not null,
    postiz_post_id text,
    status text not null default 'scheduled' check (status in ('scheduled', 'published', 'failed', 'mock')),
    playbook_id text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_scheduled_posts_user_id on public.scheduled_posts(user_id);
create index if not exists idx_scheduled_posts_scheduled_for on public.scheduled_posts(scheduled_for);

alter table public.scheduled_posts enable row level security;

create policy "Users can manage their own scheduled posts"
on public.scheduled_posts for all
using ( auth.uid() = user_id )
with check ( auth.uid() = user_id );
