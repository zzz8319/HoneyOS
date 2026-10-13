-- Account deletion cascade migration
--
-- Ensures ON DELETE CASCADE FK constraints exist on all user-owned tables so
-- that deleting a row from auth.users automatically removes all owned rows.
--
-- user_preferences already has ON DELETE CASCADE (see 20261004_user_preferences.sql).
-- profiles has ON DELETE CASCADE via profiles_id_fkey (confirmed in remote DB).
-- This migration covers the remaining tables referenced in supabase_client.js.
--
-- Each DO $$ block is idempotent:
--   1. Drops any existing FK on table.user_id → auth.users that is NOT CASCADE
--      (confdeltype <> 'c').  Detected by confdeltype, not by constraint name.
--   2. Adds a CASCADE FK only if no CASCADE FK already exists (confdeltype = 'c').
--
-- Note: Supabase CLI wraps each migration in a transaction automatically.

-- farms
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    JOIN pg_class ft ON ft.oid = c.confrelid
    JOIN pg_namespace fn ON fn.oid = ft.relnamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public' AND t.relname = 'farms'
      AND fn.nspname = 'auth' AND ft.relname = 'users'
      AND a.attname = 'user_id'
      AND c.confdeltype <> 'c'
  LOOP
    EXECUTE format('ALTER TABLE public.farms DROP CONSTRAINT %I', r.conname);
  END LOOP;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    JOIN pg_class ft ON ft.oid = c.confrelid
    JOIN pg_namespace fn ON fn.oid = ft.relnamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public' AND t.relname = 'farms'
      AND fn.nspname = 'auth' AND ft.relname = 'users'
      AND a.attname = 'user_id'
      AND c.confdeltype = 'c'
  ) THEN
    ALTER TABLE public.farms
      ADD CONSTRAINT farms_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- colonies
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    JOIN pg_class ft ON ft.oid = c.confrelid
    JOIN pg_namespace fn ON fn.oid = ft.relnamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public' AND t.relname = 'colonies'
      AND fn.nspname = 'auth' AND ft.relname = 'users'
      AND a.attname = 'user_id'
      AND c.confdeltype <> 'c'
  LOOP
    EXECUTE format('ALTER TABLE public.colonies DROP CONSTRAINT %I', r.conname);
  END LOOP;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    JOIN pg_class ft ON ft.oid = c.confrelid
    JOIN pg_namespace fn ON fn.oid = ft.relnamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public' AND t.relname = 'colonies'
      AND fn.nspname = 'auth' AND ft.relname = 'users'
      AND a.attname = 'user_id'
      AND c.confdeltype = 'c'
  ) THEN
    ALTER TABLE public.colonies
      ADD CONSTRAINT colonies_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- insp_records
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    JOIN pg_class ft ON ft.oid = c.confrelid
    JOIN pg_namespace fn ON fn.oid = ft.relnamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public' AND t.relname = 'insp_records'
      AND fn.nspname = 'auth' AND ft.relname = 'users'
      AND a.attname = 'user_id'
      AND c.confdeltype <> 'c'
  LOOP
    EXECUTE format('ALTER TABLE public.insp_records DROP CONSTRAINT %I', r.conname);
  END LOOP;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    JOIN pg_class ft ON ft.oid = c.confrelid
    JOIN pg_namespace fn ON fn.oid = ft.relnamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public' AND t.relname = 'insp_records'
      AND fn.nspname = 'auth' AND ft.relname = 'users'
      AND a.attname = 'user_id'
      AND c.confdeltype = 'c'
  ) THEN
    ALTER TABLE public.insp_records
      ADD CONSTRAINT insp_records_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- work_records
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    JOIN pg_class ft ON ft.oid = c.confrelid
    JOIN pg_namespace fn ON fn.oid = ft.relnamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public' AND t.relname = 'work_records'
      AND fn.nspname = 'auth' AND ft.relname = 'users'
      AND a.attname = 'user_id'
      AND c.confdeltype <> 'c'
  LOOP
    EXECUTE format('ALTER TABLE public.work_records DROP CONSTRAINT %I', r.conname);
  END LOOP;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    JOIN pg_class ft ON ft.oid = c.confrelid
    JOIN pg_namespace fn ON fn.oid = ft.relnamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public' AND t.relname = 'work_records'
      AND fn.nspname = 'auth' AND ft.relname = 'users'
      AND a.attname = 'user_id'
      AND c.confdeltype = 'c'
  ) THEN
    ALTER TABLE public.work_records
      ADD CONSTRAINT work_records_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- tasks
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    JOIN pg_class ft ON ft.oid = c.confrelid
    JOIN pg_namespace fn ON fn.oid = ft.relnamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public' AND t.relname = 'tasks'
      AND fn.nspname = 'auth' AND ft.relname = 'users'
      AND a.attname = 'user_id'
      AND c.confdeltype <> 'c'
  LOOP
    EXECUTE format('ALTER TABLE public.tasks DROP CONSTRAINT %I', r.conname);
  END LOOP;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    JOIN pg_class ft ON ft.oid = c.confrelid
    JOIN pg_namespace fn ON fn.oid = ft.relnamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public' AND t.relname = 'tasks'
      AND fn.nspname = 'auth' AND ft.relname = 'users'
      AND a.attname = 'user_id'
      AND c.confdeltype = 'c'
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT tasks_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- push_subscriptions
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    JOIN pg_class ft ON ft.oid = c.confrelid
    JOIN pg_namespace fn ON fn.oid = ft.relnamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public' AND t.relname = 'push_subscriptions'
      AND fn.nspname = 'auth' AND ft.relname = 'users'
      AND a.attname = 'user_id'
      AND c.confdeltype <> 'c'
  LOOP
    EXECUTE format('ALTER TABLE public.push_subscriptions DROP CONSTRAINT %I', r.conname);
  END LOOP;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    JOIN pg_class ft ON ft.oid = c.confrelid
    JOIN pg_namespace fn ON fn.oid = ft.relnamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public' AND t.relname = 'push_subscriptions'
      AND fn.nspname = 'auth' AND ft.relname = 'users'
      AND a.attname = 'user_id'
      AND c.confdeltype = 'c'
  ) THEN
    ALTER TABLE public.push_subscriptions
      ADD CONSTRAINT push_subscriptions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- notification_settings
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    JOIN pg_class ft ON ft.oid = c.confrelid
    JOIN pg_namespace fn ON fn.oid = ft.relnamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public' AND t.relname = 'notification_settings'
      AND fn.nspname = 'auth' AND ft.relname = 'users'
      AND a.attname = 'user_id'
      AND c.confdeltype <> 'c'
  LOOP
    EXECUTE format('ALTER TABLE public.notification_settings DROP CONSTRAINT %I', r.conname);
  END LOOP;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    JOIN pg_class ft ON ft.oid = c.confrelid
    JOIN pg_namespace fn ON fn.oid = ft.relnamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public' AND t.relname = 'notification_settings'
      AND fn.nspname = 'auth' AND ft.relname = 'users'
      AND a.attname = 'user_id'
      AND c.confdeltype = 'c'
  ) THEN
    ALTER TABLE public.notification_settings
      ADD CONSTRAINT notification_settings_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- benchmarks
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    JOIN pg_class ft ON ft.oid = c.confrelid
    JOIN pg_namespace fn ON fn.oid = ft.relnamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public' AND t.relname = 'benchmarks'
      AND fn.nspname = 'auth' AND ft.relname = 'users'
      AND a.attname = 'user_id'
      AND c.confdeltype <> 'c'
  LOOP
    EXECUTE format('ALTER TABLE public.benchmarks DROP CONSTRAINT %I', r.conname);
  END LOOP;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    JOIN pg_class ft ON ft.oid = c.confrelid
    JOIN pg_namespace fn ON fn.oid = ft.relnamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public' AND t.relname = 'benchmarks'
      AND fn.nspname = 'auth' AND ft.relname = 'users'
      AND a.attname = 'user_id'
      AND c.confdeltype = 'c'
  ) THEN
    ALTER TABLE public.benchmarks
      ADD CONSTRAINT benchmarks_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;
