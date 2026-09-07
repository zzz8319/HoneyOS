-- HoneyOS Database Schema
-- Run this in Supabase SQL Editor
-- Last updated: 2026-09-08

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

create policy "users see own profile"   on public.profiles for select using (auth.uid() = id);
create policy "users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);

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

-- =====================
-- farms: 養蜂場管理
-- =====================
create table if not exists public.farms (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  latitude    numeric,
  longitude   numeric,
  sort_order  integer not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now()
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

-- Add columns (run if upgrading existing DB)
alter table public.farms add column if not exists latitude    numeric;
alter table public.farms add column if not exists longitude   numeric;
alter table public.farms add column if not exists archived_at timestamptz;

-- =====================
-- colonies: 蜂群管理
-- =====================
create table if not exists public.colonies (
  id          text not null,
  user_id     uuid references auth.users(id) on delete cascade not null,
  farm_id     bigint references public.farms(id) on delete set null,
  name        text not null default '',
  colony_type text,
  sort_order  integer not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  primary key (id, user_id)
);

alter table public.colonies enable row level security;

drop policy if exists "users see own colonies" on public.colonies;
drop policy if exists "users insert own colonies" on public.colonies;
drop policy if exists "users update own colonies" on public.colonies;
drop policy if exists "users delete own colonies" on public.colonies;

create policy "users see own colonies"    on public.colonies for select using (auth.uid() = user_id);
create policy "users insert own colonies"  on public.colonies for insert with check (auth.uid() = user_id);
create policy "users update own colonies"  on public.colonies for update using (auth.uid() = user_id);
create policy "users delete own colonies"  on public.colonies for delete using (auth.uid() = user_id);

-- Add columns (run if upgrading existing DB)
alter table public.colonies add column if not exists farm_id     bigint references public.farms(id) on delete set null;
alter table public.colonies add column if not exists colony_type text;
alter table public.colonies add column if not exists archived_at timestamptz;

-- =====================
-- insp_records: 内検記録
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
  structure     jsonb not null default '{}',
  queen_present boolean,
  queen_status  text,
  bees_total    integer,
  frame_memo    text not null default '',
  ai_memo       text not null default '',
  created_at    timestamptz not null default now()
);

alter table public.insp_records enable row level security;

drop policy if exists "users see own insp_records" on public.insp_records;
drop policy if exists "users insert own insp_records" on public.insp_records;
drop policy if exists "users update own insp_records" on public.insp_records;
drop policy if exists "users delete own insp_records" on public.insp_records;

create policy "users see own insp_records"
  on public.insp_records for select using (auth.uid() = user_id);
create policy "users insert own insp_records"
  on public.insp_records for insert with check (auth.uid() = user_id);
create policy "users update own insp_records"
  on public.insp_records for update using (auth.uid() = user_id);
create policy "users delete own insp_records"
  on public.insp_records for delete using (auth.uid() = user_id);

-- Add columns (run if upgrading existing DB)
alter table public.insp_records add column if not exists count_mode    text not null default 'frame';
alter table public.insp_records add column if not exists frame_details jsonb not null default '{}';
alter table public.insp_records add column if not exists space_count   integer;
alter table public.insp_records add column if not exists space_levels  jsonb not null default '{}';
alter table public.insp_records add column if not exists structure     jsonb not null default '{}';
alter table public.insp_records add column if not exists queen_present boolean;
alter table public.insp_records add column if not exists queen_status  text;
alter table public.insp_records add column if not exists bees_total    integer;

-- =====================
-- work_records: 作業記録
-- =====================
create table if not exists public.work_records (
  id                  bigint generated always as identity primary key,
  user_id             uuid references auth.users(id) on delete cascade not null,
  type                text not null,
  colony              text not null default '',
  colony_ids          text[] not null default '{}',
  date                text not null,
  time                text not null,
  memo                text not null default '',
  yield_kg            decimal,
  harvest_method      text,
  feed_type           text,
  feed_amount         text,
  medication_name     text,
  next_treatment_date text,
  swarm_type          text,
  photo_urls          jsonb not null default '[]',
  created_at          timestamptz not null default now()
);

alter table public.work_records enable row level security;

drop policy if exists "users see own work_records" on public.work_records;
drop policy if exists "users insert own work_records" on public.work_records;
drop policy if exists "users update own work_records" on public.work_records;
drop policy if exists "users delete own work_records" on public.work_records;

create policy "users see own work_records"
  on public.work_records for select using (auth.uid() = user_id);
create policy "users insert own work_records"
  on public.work_records for insert with check (auth.uid() = user_id);
create policy "users update own work_records"
  on public.work_records for update using (auth.uid() = user_id);
create policy "users delete own work_records"
  on public.work_records for delete using (auth.uid() = user_id);

-- Add columns (run if upgrading existing DB)
alter table public.work_records add column if not exists yield_kg            decimal;
alter table public.work_records add column if not exists colony_ids          text[] not null default '{}';
alter table public.work_records add column if not exists harvest_method      text;
alter table public.work_records add column if not exists feed_type           text;
alter table public.work_records add column if not exists feed_amount         text;
alter table public.work_records add column if not exists medication_name     text;
alter table public.work_records add column if not exists next_treatment_date text;
alter table public.work_records add column if not exists swarm_type          text;
alter table public.work_records add column if not exists photo_urls          jsonb not null default '[]';

-- Backfill colony_ids from colony (既存データの移行)
update public.work_records
set colony_ids = array[colony]
where colony != '' and colony_ids = '{}';

-- =====================
-- tasks: タスク（新規）
-- =====================
create table if not exists public.tasks (
  id               bigint generated always as identity primary key,
  user_id          uuid references auth.users(id) on delete cascade not null,
  title            text not null,
  due_date         text,
  priority         text not null default 'medium',
  colony_ids       text[] not null default '{}',
  farm_id          bigint references public.farms(id) on delete set null,
  memo             text not null default '',
  is_completed     boolean not null default false,
  completed_at     timestamptz,
  reminder_enabled boolean not null default false,
  recurrence_rule  jsonb,
  created_at       timestamptz not null default now()
);

alter table public.tasks enable row level security;

drop policy if exists "users see own tasks" on public.tasks;
drop policy if exists "users insert own tasks" on public.tasks;
drop policy if exists "users update own tasks" on public.tasks;
drop policy if exists "users delete own tasks" on public.tasks;

create policy "users see own tasks"    on public.tasks for select using (auth.uid() = user_id);
create policy "users insert own tasks"  on public.tasks for insert with check (auth.uid() = user_id);
create policy "users update own tasks"  on public.tasks for update using (auth.uid() = user_id);
create policy "users delete own tasks"  on public.tasks for delete using (auth.uid() = user_id);

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
create policy "users manage own push subs"
  on public.push_subscriptions for all using (auth.uid() = user_id);

-- =====================
-- benchmarks: 匿名統計
-- =====================
create table if not exists public.benchmarks (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  avg_health   numeric,
  colony_count integer,
  updated_at   timestamptz not null default now()
);

alter table public.benchmarks enable row level security;

drop policy if exists "users manage own benchmark" on public.benchmarks;
create policy "users manage own benchmark"
  on public.benchmarks for all using (auth.uid() = user_id);

drop policy if exists "all users read benchmarks" on public.benchmarks;
create policy "all users read benchmarks"
  on public.benchmarks for select using (true);
