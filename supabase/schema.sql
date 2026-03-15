create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 24)
);

create table if not exists public.high_scores (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 24),
  score integer not null default 0 check (score >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 24),
  email text not null,
  category text not null check (category in ('gameplay', 'controls', 'leaderboard', 'login', 'design', 'bug', 'other')),
  message text not null check (char_length(message) between 8 and 600),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_high_scores_updated_at on public.high_scores;
create trigger set_high_scores_updated_at
before update on public.high_scores
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.high_scores enable row level security;
alter table public.feedback enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "scores_read_all" on public.high_scores;
create policy "scores_read_all"
on public.high_scores
for select
to anon, authenticated
using (true);

drop policy if exists "scores_insert_own" on public.high_scores;
create policy "scores_insert_own"
on public.high_scores
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "scores_update_own" on public.high_scores;
create policy "scores_update_own"
on public.high_scores
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "feedback_insert_own" on public.feedback;
create policy "feedback_insert_own"
on public.feedback
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "feedback_select_admin" on public.feedback;
create policy "feedback_select_admin"
on public.feedback
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users admin
    where admin.user_id = auth.uid()
  )
);

drop policy if exists "admin_users_select_self" on public.admin_users;
create policy "admin_users_select_self"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());
