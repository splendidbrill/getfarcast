create table if not exists public.user_usage (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    month_year text not null, -- e.g. '2026-04'
    playbooks int default 0,
    content_generations int default 0,
    replies int default 0,
    dms int default 0,
    leads int default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, month_year)
);

create index if not exists idx_user_usage_user_month on public.user_usage(user_id, month_year);

-- Enable Row Level Security (RLS) to prevent unauthorized tampering via client keys
alter table public.user_usage enable row level security;

-- Allow users to read their own usage (in case you want to show it in the UI later)
create policy "Users can view their own usage"
on public.user_usage for select
using ( auth.uid() = user_id );
