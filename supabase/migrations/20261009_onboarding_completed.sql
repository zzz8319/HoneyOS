-- Migration: Add onboarding_completed to user_preferences
--
-- Pre-migration state:
--   user_preferences has: theme, language, default_inspection_mode
--   No onboarding_completed column
--
-- Post-migration state:
--   user_preferences has: onboarding_completed boolean NOT NULL DEFAULT false
--   Existing users (already using the app) are backfilled to true
--   New users default to false → will see Onboarding on first login
--
-- Safe to run multiple times (idempotent via IF NOT EXISTS / DO $$)
-- Does NOT modify existing theme/language/default_inspection_mode values
-- Does NOT weaken RLS

-- Step 1: Add column as nullable first (so existing rows don't fail)
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean;

-- Step 2: Backfill existing rows to true (they already completed onboarding)
UPDATE user_preferences
SET onboarding_completed = true
WHERE onboarding_completed IS NULL;

-- Step 3: Create user_preferences rows for existing auth users who have none
-- (uses a safe INSERT ... ON CONFLICT DO NOTHING to avoid overwriting existing data)
INSERT INTO user_preferences (user_id, onboarding_completed)
SELECT id, true
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Step 4: Set NOT NULL constraint now that all rows have a value
ALTER TABLE user_preferences
  ALTER COLUMN onboarding_completed SET NOT NULL,
  ALTER COLUMN onboarding_completed SET DEFAULT false;

-- Optional: add completion timestamp
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

-- Update backfilled rows to have a reasonable timestamp
UPDATE user_preferences
SET onboarding_completed_at = now()
WHERE onboarding_completed = true
  AND onboarding_completed_at IS NULL;
