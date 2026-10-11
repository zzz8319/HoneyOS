-- user_preferences table
-- =============================================================================
-- Migration: 20261004_user_preferences.sql
--
-- 冪等性設計:
--   - CREATE TABLE IF NOT EXISTS
--   - CREATE OR REPLACE FUNCTION
--   - Trigger: DO $$ IF NOT EXISTS pg_trigger $$ ブロック
--   - RLS: ALTER TABLE ENABLE ROW LEVEL SECURITY (冪等)
--   - Policy: DO $$ DROP POLICY IF EXISTS + CREATE POLICY $$ パターン
--     (CREATE POLICY IF NOT EXISTS は PostgreSQL 15/16 では非対応のため使用しない)
--
-- user_preferences に DELETE ポリシーを設けない理由:
--   アカウント削除は auth.users を CASCADE DELETE で行うため、
--   user_preferences 行はアプリ層からの DELETE を必要とせず
--   CASCADE で自動削除される。誤削除を防ぐため DELETE ポリシーは意図的に省略する。
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id     uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme       text        NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language    text        NOT NULL DEFAULT 'ja'     CHECK (language IN ('ja', 'en')),
  default_inspection_mode text NOT NULL DEFAULT 'frame' CHECK (default_inspection_mode IN ('frame', 'ratio')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Only create trigger if not already exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_user_preferences_updated_at'
  ) THEN
    CREATE TRIGGER set_user_preferences_updated_at
      BEFORE UPDATE ON public.user_preferences
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;

-- RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: DROP IF EXISTS → CREATE パターンで冪等かつ定義変更にも対応
-- (CREATE POLICY IF NOT EXISTS は PostgreSQL 17+ 構文のため PG 15/16 では使用不可)
DO $$
BEGIN
  DROP POLICY IF EXISTS "user_preferences_select_own" ON public.user_preferences;
  DROP POLICY IF EXISTS "user_preferences_insert_own" ON public.user_preferences;
  DROP POLICY IF EXISTS "user_preferences_update_own" ON public.user_preferences;
END $$;

CREATE POLICY "user_preferences_select_own"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_preferences_insert_own"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_preferences_update_own"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
