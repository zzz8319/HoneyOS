-- HoneyOS Database Schema
-- Run this in Supabase SQL Editor

-- =====================
-- insp_records: 内検履歴
-- =====================
create table if not exists public.insp_records (
  id            bigint generated always as identity primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  colony        text not null,
  date          text not null,
  time          text not null,
  weather       text not null default '晴れ',
  frames        integer[] not null default '{}',
  count_mode    text not null default 'frame',
  frame_details jsonb not null default '{}',
  space_count   integer,
  space_levels  jsonb not null default '{}',
  queen_present boolean,
  bees_total    integer,
  frame_memo    text not null default '',
  ai_memo       text not null default '',
  created_at    timestamptz not null default now()
);

alter table public.insp_records enable row level security;

drop policy if exists "users see own insp_records" on public.insp_records;
drop policy if exists "users insert own insp_records" on public.insp_records;
drop policy if exists "users delete own insp_records" on public.insp_records;

create policy "users see own insp_records"
  on public.insp_records for select
  using (auth.uid() = user_id);

create policy "users insert own insp_records"
  on public.insp_records for insert
  with check (auth.uid() = user_id);

create policy "users delete own insp_records"
  on public.insp_records for delete
  using (auth.uid() = user_id);

-- Add columns (run if upgrading existing DB)
alter table public.insp_records add column if not exists count_mode text not null default 'frame';
alter table public.insp_records add column if not exists frame_details jsonb not null default '{}';
alter table public.insp_records add column if not exists space_count integer;
alter table public.insp_records add column if not exists space_levels jsonb not null default '{}';
alter table public.insp_records add column if not exists queen_present boolean;
alter table public.insp_records add column if not exists bees_total integer;

-- =====================
-- work_records: 作業履歴
-- =====================
create table if not exists public.work_records (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  type       text not null,
  colony     text not null,
  date       text not null,
  time       text not null,
  memo       text not null default '',
  yield_kg   decimal,
  created_at timestamptz not null default now()
);

alter table public.work_records enable row level security;

drop policy if exists "users see own work_records" on public.work_records;
drop policy if exists "users insert own work_records" on public.work_records;
drop policy if exists "users delete own work_records" on public.work_records;

create policy "users see own work_records"
  on public.work_records for select
  using (auth.uid() = user_id);

create policy "users insert own work_records"
  on public.work_records for insert
  with check (auth.uid() = user_id);

create policy "users delete own work_records"
  on public.work_records for delete
  using (auth.uid() = user_id);

-- Add yield_kg column (run if upgrading existing DB)
alter table public.work_records add column if not exists yield_kg decimal;

-- =====================
-- profiles: ユーザープロファイル
-- =====================
create table if not exists public.profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  name       text not null default '',
  farm_name  text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "users see own profile" on public.profiles;
drop policy if exists "users insert own profile" on public.profiles;
drop policy if exists "users update own profile" on public.profiles;

create policy "users see own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- =====================
-- colonies: 蜂群管理
-- =====================
create table if not exists public.colonies (
  id         text not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (id, user_id)
);

alter table public.colonies enable row level security;

drop policy if exists "users see own colonies" on public.colonies;
drop policy if exists "users insert own colonies" on public.colonies;
drop policy if exists "users update own colonies" on public.colonies;
drop policy if exists "users delete own colonies" on public.colonies;

create policy "users see own colonies"   on public.colonies for select using (auth.uid() = user_id);
create policy "users insert own colonies" on public.colonies for insert with check (auth.uid() = user_id);
create policy "users update own colonies" on public.colonies for update using (auth.uid() = user_id);
create policy "users delete own colonies" on public.colonies for delete using (auth.uid() = user_id);

-- =====================
-- farms: 養蜂場管理
-- =====================
create table if not exists public.farms (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.farms enable row level security;

drop policy if exists "users see own farms" on public.farms;
drop policy if exists "users insert own farms" on public.farms;
drop policy if exists "users update own farms" on public.farms;
drop policy if exists "users delete own farms" on public.farms;

create policy "users see own farms"    on public.farms for select using (auth.uid() = user_id);
create policy "users insert own farms"  on public.farms for insert with check (auth.uid() = user_id);
create policy "users update own farms"  on public.farms for update using (auth.uid() = user_id);
create policy "users delete own farms"  on public.farms for delete using (auth.uid() = user_id);

-- =====================
-- push_subscriptions: プッシュ通知購読
-- =====================
create table if not exists public.push_subscriptions (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  endpoint   text not null,
  p256dh     text not null,
  auth_key   text not null,
  created_at timestamptz not null default now(),
  unique(user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "users manage own push subs" on public.push_subscriptions;
create policy "users manage own push subs" on public.push_subscriptions for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, farm_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'farm_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
