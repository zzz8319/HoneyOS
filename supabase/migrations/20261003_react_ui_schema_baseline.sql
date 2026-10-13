-- =============================================================================
-- Migration: 20261003_react_ui_schema_baseline.sql
-- React版HoneyOS ベースラインスキーマ
--
-- 目的:
--   remote DBにはprofiles / insp_records / work_records の3テーブルのみが存在する。
--   React版HoneyOSが必要とするすべてのテーブルと列を、既存データを保持したまま追加する。
--
-- 設計原則:
--   - CREATE TABLE IF NOT EXISTS  — テーブルが存在しても安全に再実行可能
--   - ADD COLUMN IF NOT EXISTS    — 列が存在しても安全に再実行可能
--   - DROP TABLE / TRUNCATE / DELETE の使用禁止
--   - 既存CASCADE FKは変更しない
--   - 既存データを削除しない
--   - ID列・既存列の型変更禁止
--   - 完全に冪等（何度実行しても安全）
--
-- 適用順:
--   1. 本ファイル (20261003) ← 最初に適用
--   2. 20261004_user_preferences.sql
--   3. 20261009_onboarding_completed.sql
--   4. 20261010_account_deletion_cascade.sql
--
-- remote適用はまだ行わないこと。適用前に必ずバックアップを取ること。
-- =============================================================================

-- ── 既存テーブルへの不足列追加 ──────────────────────────────────────────────

-- profiles: 既存データ保全。列は全て揃っているが念のため確認。
-- remote確認済み: id, name, farm_name, created_at — 追加列なし。
-- RLS / policy は後述の共通パターンで再確認。

-- insp_records: remoteに不足する列を追加
-- remote確認済み: id, user_id, colony, date, time, weather, frames,
--   frame_memo, ai_memo, created_at, space_levels, queen_present, bees_total
-- 以下は supabase_client.js が実際に読み書きする列のうちremote未確認分

ALTER TABLE public.insp_records
  ADD COLUMN IF NOT EXISTS count_mode    text        NOT NULL DEFAULT 'frame',
  ADD COLUMN IF NOT EXISTS frame_details jsonb       NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS space_count   integer,
  ADD COLUMN IF NOT EXISTS structure     jsonb       NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS queen_status  text;

-- swarm_risk: supabase_client.js は boolean で読み書きする（swarmRisk: r.swarm_risk || false）
-- swarm_risk_score (integer) は supabase_schema.sql のみに存在し、コードでは使用されない。
-- 両者は別物であり、相互変換しない。swarm_risk のみ追加する。
ALTER TABLE public.insp_records
  ADD COLUMN IF NOT EXISTS swarm_risk boolean NOT NULL DEFAULT false;

-- work_records: remoteに不足する列を追加
-- remote確認済み: id, user_id, type, colony, date, time, memo, created_at
ALTER TABLE public.work_records
  ADD COLUMN IF NOT EXISTS colony_ids          text[]      NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS yield_kg            decimal,
  ADD COLUMN IF NOT EXISTS harvest_method      text,
  ADD COLUMN IF NOT EXISTS feed_type           text,
  ADD COLUMN IF NOT EXISTS feed_amount         text,
  ADD COLUMN IF NOT EXISTS medication_name     text,
  ADD COLUMN IF NOT EXISTS next_treatment_date text,
  ADD COLUMN IF NOT EXISTS swarm_type          text;

-- photo_urls: supabase_client.js は jsonb として書き込み（photo_urls: record.photoUrls || []）
-- TypeScript側の型は string[] だが、DB上は jsonb（JSON配列）。
-- supabase_schema.sql でも jsonb NOT NULL DEFAULT '[]' と定義されているため jsonb を使用。
ALTER TABLE public.work_records
  ADD COLUMN IF NOT EXISTS photo_urls jsonb NOT NULL DEFAULT '[]';

-- work_records.colony_ids の既存データ補完
-- colony列が空でない既存行に対してcolony_idsを補完（破壊なし）
UPDATE public.work_records
SET colony_ids = ARRAY[colony]
WHERE colony != '' AND colony_ids = '{}';

-- ── 新規テーブル作成 ─────────────────────────────────────────────────────────

-- ── farms ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.farms (
  id          bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  latitude    numeric,
  longitude   numeric,
  sort_order  integer     NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

-- farms policies (DROP IF EXISTS + CREATE で冪等)
DO $$
BEGIN
  DROP POLICY IF EXISTS "users see own farms"    ON public.farms;
  DROP POLICY IF EXISTS "users insert own farms"  ON public.farms;
  DROP POLICY IF EXISTS "users update own farms"  ON public.farms;
  DROP POLICY IF EXISTS "users delete own farms"  ON public.farms;
END $$;

CREATE POLICY "users see own farms"
  ON public.farms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users insert own farms"
  ON public.farms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own farms"
  ON public.farms FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own farms"
  ON public.farms FOR DELETE USING (auth.uid() = user_id);

-- farms index
CREATE INDEX IF NOT EXISTS farms_user_id_idx ON public.farms (user_id);

-- ── colonies ───────────────────────────────────────────────────────────────
-- PK は (id, user_id) の複合主キー（supabase_client.js で onConflict: 'id,user_id'）
CREATE TABLE IF NOT EXISTS public.colonies (
  id          text        NOT NULL,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_id     bigint      REFERENCES public.farms(id) ON DELETE SET NULL,
  name        text        NOT NULL DEFAULT '',
  colony_type text,
  sort_order  integer     NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, user_id)
);

ALTER TABLE public.colonies ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "users see own colonies"    ON public.colonies;
  DROP POLICY IF EXISTS "users insert own colonies"  ON public.colonies;
  DROP POLICY IF EXISTS "users update own colonies"  ON public.colonies;
  DROP POLICY IF EXISTS "users delete own colonies"  ON public.colonies;
END $$;

CREATE POLICY "users see own colonies"
  ON public.colonies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users insert own colonies"
  ON public.colonies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own colonies"
  ON public.colonies FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own colonies"
  ON public.colonies FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS colonies_user_id_idx  ON public.colonies (user_id);
CREATE INDEX IF NOT EXISTS colonies_farm_id_idx  ON public.colonies (farm_id);

-- ── tasks ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id               bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            text        NOT NULL,
  due_date         text,
  priority         text        NOT NULL DEFAULT 'medium',
  colony_ids       text[]      NOT NULL DEFAULT '{}',
  farm_id          bigint      REFERENCES public.farms(id) ON DELETE SET NULL,
  memo             text        NOT NULL DEFAULT '',
  is_completed     boolean     NOT NULL DEFAULT false,
  completed_at     timestamptz,
  reminder_enabled boolean     NOT NULL DEFAULT false,
  recurrence_rule  jsonb,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "users see own tasks"    ON public.tasks;
  DROP POLICY IF EXISTS "users insert own tasks"  ON public.tasks;
  DROP POLICY IF EXISTS "users update own tasks"  ON public.tasks;
  DROP POLICY IF EXISTS "users delete own tasks"  ON public.tasks;
END $$;

CREATE POLICY "users see own tasks"
  ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users insert own tasks"
  ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own tasks"
  ON public.tasks FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS tasks_user_id_idx   ON public.tasks (user_id);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx  ON public.tasks (due_date);

-- ── push_subscriptions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint   text        NOT NULL,
  p256dh     text        NOT NULL,
  auth_key   text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "users manage own push subs" ON public.push_subscriptions;
END $$;

-- push_subscriptionsはSELECT/INSERT/UPDATE/DELETE全てowner-only
CREATE POLICY "users manage own push subs"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON public.push_subscriptions (user_id);

-- ── notification_settings ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_settings (
  user_id       uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  inspection    boolean     NOT NULL DEFAULT true,
  ai_complete   boolean     NOT NULL DEFAULT true,
  sensor_alert  boolean     NOT NULL DEFAULT true,
  system_notice boolean     NOT NULL DEFAULT true,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "users manage own notification_settings" ON public.notification_settings;
END $$;

CREATE POLICY "users manage own notification_settings"
  ON public.notification_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── benchmarks ─────────────────────────────────────────────────────────────
-- セキュリティ設計: own-only に限定。
-- 個別ユーザーのavg_health/colony_countは他ユーザーに公開しない。
-- 匿名化集計が必要になった場合は別途集計RPCまたはVIEWで対応する。
CREATE TABLE IF NOT EXISTS public.benchmarks (
  user_id      uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  avg_health   numeric,
  colony_count integer,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.benchmarks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "users manage own benchmark"  ON public.benchmarks;
  DROP POLICY IF EXISTS "all users read benchmarks"   ON public.benchmarks;
END $$;

-- own-only: 自分のbenchmarkのみ読み書き可
CREATE POLICY "users manage own benchmark"
  ON public.benchmarks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── profiles RLS 再確認 ────────────────────────────────────────────────────
-- remote確認済み: RLS有効、CASCADE FK確認済み。
-- policy名が異なる可能性があるため冪等パターンで再適用。
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "users see own profile"    ON public.profiles;
  DROP POLICY IF EXISTS "users insert own profile"  ON public.profiles;
  DROP POLICY IF EXISTS "users update own profile"  ON public.profiles;
END $$;

CREATE POLICY "users see own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── insp_records RLS 再確認 ────────────────────────────────────────────────
ALTER TABLE public.insp_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "users see own insp_records"    ON public.insp_records;
  DROP POLICY IF EXISTS "users insert own insp_records"  ON public.insp_records;
  DROP POLICY IF EXISTS "users update own insp_records"  ON public.insp_records;
  DROP POLICY IF EXISTS "users delete own insp_records"  ON public.insp_records;
END $$;

CREATE POLICY "users see own insp_records"
  ON public.insp_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users insert own insp_records"
  ON public.insp_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own insp_records"
  ON public.insp_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own insp_records"
  ON public.insp_records FOR DELETE USING (auth.uid() = user_id);

-- insp_records index（なければ追加）
CREATE INDEX IF NOT EXISTS insp_records_user_id_idx   ON public.insp_records (user_id);
CREATE INDEX IF NOT EXISTS insp_records_created_at_idx ON public.insp_records (created_at DESC);

-- ── work_records RLS 再確認 ────────────────────────────────────────────────
ALTER TABLE public.work_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "users see own work_records"    ON public.work_records;
  DROP POLICY IF EXISTS "users insert own work_records"  ON public.work_records;
  DROP POLICY IF EXISTS "users update own work_records"  ON public.work_records;
  DROP POLICY IF EXISTS "users delete own work_records"  ON public.work_records;
END $$;

CREATE POLICY "users see own work_records"
  ON public.work_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users insert own work_records"
  ON public.work_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own work_records"
  ON public.work_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own work_records"
  ON public.work_records FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS work_records_user_id_idx    ON public.work_records (user_id);
CREATE INDEX IF NOT EXISTS work_records_created_at_idx ON public.work_records (created_at DESC);

-- ── Realtime Publication ──────────────────────────────────────────────────
-- subscribeRealtime() は insp_records / work_records / tasks の3テーブルを監視する。
-- Supabase はデフォルトで supabase_realtime publication に全テーブルを含めるが、
-- 明示的に追加されていない場合のためDO$$でガードして追加する。
-- 既存のpublicationに含まれている場合はALTER PUBLICATIONがエラーになるため
-- pg_publicationテーブルで存在確認してからのみ追加する。
DO $$
BEGIN
  -- supabase_realtime publicationが存在する場合のみ操作
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- テーブルがpublicationに含まれていない場合のみ追加
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'insp_records'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.insp_records;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'work_records'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.work_records;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'tasks'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
    END IF;
  END IF;
END $$;
