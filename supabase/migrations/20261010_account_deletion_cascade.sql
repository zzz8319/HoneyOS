-- Account deletion cascade migration
--
-- Adds ON DELETE CASCADE FK constraints for all user-owned tables so that
-- deleting a row from auth.users automatically removes all owned rows.
--
-- user_preferences already has ON DELETE CASCADE (see 20261004_user_preferences.sql).
-- This migration covers the remaining tables that appear in supabase_client.js.
--
-- Note: Supabase CLI wraps each migration in a transaction automatically, so no
-- explicit BEGIN/COMMIT is needed here.
--
-- Tables confirmed via migration files:
--   user_preferences  → CASCADE already present (20261004_user_preferences.sql)
--
-- Tables referenced in supabase_client.js but WITHOUT a migration file in this repo
-- (remote DB verification required before applying):
--   farms, colonies, insp_records, work_records, tasks,
--   push_subscriptions, notification_settings, benchmarks
--
-- The DO $$ blocks below are idempotent (skip if constraint already exists).

-- farms
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'farms_user_id_fkey'
  ) THEN
    ALTER TABLE public.farms
      ADD CONSTRAINT farms_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- colonies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'colonies_user_id_fkey'
  ) THEN
    ALTER TABLE public.colonies
      ADD CONSTRAINT colonies_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- insp_records
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'insp_records_user_id_fkey'
  ) THEN
    ALTER TABLE public.insp_records
      ADD CONSTRAINT insp_records_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- work_records
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'work_records_user_id_fkey'
  ) THEN
    ALTER TABLE public.work_records
      ADD CONSTRAINT work_records_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- tasks
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_user_id_fkey'
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT tasks_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- push_subscriptions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'push_subscriptions_user_id_fkey'
  ) THEN
    ALTER TABLE public.push_subscriptions
      ADD CONSTRAINT push_subscriptions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- notification_settings
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notification_settings_user_id_fkey'
  ) THEN
    ALTER TABLE public.notification_settings
      ADD CONSTRAINT notification_settings_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- benchmarks
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'benchmarks_user_id_fkey'
  ) THEN
    ALTER TABLE public.benchmarks
      ADD CONSTRAINT benchmarks_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;
