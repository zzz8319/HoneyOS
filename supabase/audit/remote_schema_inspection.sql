-- ============================================================
-- HoneyOS Remote DB Schema Inspection SQL
-- READ-ONLY — no DDL/DML statements
-- Run in Supabase SQL Editor (read-only role sufficient for most;
-- some system catalog queries require postgres role)
-- ============================================================

-- ── 1. 全publicテーブル一覧 ─────────────────────────────────────────
SELECT
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ── 2. 全列（テーブル別）──────────────────────────────────────────────
SELECT
  t.table_name,
  c.column_name,
  c.ordinal_position,
  c.column_default,
  c.is_nullable,
  c.data_type,
  c.character_maximum_length,
  c.udt_name
FROM information_schema.tables t
JOIN information_schema.columns c
  ON c.table_schema = t.table_schema
  AND c.table_name = t.table_name
WHERE t.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;

-- ── 3. Primary Key 一覧 ───────────────────────────────────────────────
SELECT
  kcu.table_name,
  kcu.column_name,
  kcu.ordinal_position
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON kcu.constraint_name = tc.constraint_name
  AND kcu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'PRIMARY KEY'
ORDER BY kcu.table_name, kcu.ordinal_position;

-- ── 4. Foreign Key 一覧（削除ルール含む）────────────────────────────────
SELECT
  tc.table_name                AS fk_table,
  kcu.column_name              AS fk_column,
  ccu.table_name               AS ref_table,
  ccu.column_name              AS ref_column,
  rc.delete_rule,
  rc.update_rule,
  tc.constraint_name,
  -- confdeltype raw value: a=NO ACTION, r=RESTRICT, c=CASCADE, n=SET NULL, d=SET DEFAULT
  pgc.confdeltype
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON kcu.constraint_name = tc.constraint_name
  AND kcu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints rc
  ON rc.constraint_name = tc.constraint_name
  AND rc.constraint_schema = tc.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = rc.unique_constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN pg_constraint pgc
  ON pgc.conname = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;

-- ── 5. RLS有効状態 ────────────────────────────────────────────────────
SELECT
  relname  AS table_name,
  relrowsecurity AS rls_enabled,
  relforcerowsecurity AS rls_forced
FROM pg_class
WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND relkind = 'r'
ORDER BY relname;

-- ── 6. RLS Policy 一覧 ────────────────────────────────────────────────
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ── 7. Index 一覧 ─────────────────────────────────────────────────────
SELECT
  t.relname AS table_name,
  i.relname AS index_name,
  ix.indisunique AS is_unique,
  ix.indisprimary AS is_primary,
  array_to_string(array_agg(a.attname ORDER BY k.n), ', ') AS columns
FROM pg_class t
JOIN pg_index ix ON ix.indrelid = t.oid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
CROSS JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS k(attnum, n)
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
WHERE n.nspname = 'public'
  AND t.relkind = 'r'
GROUP BY t.relname, i.relname, ix.indisunique, ix.indisprimary
ORDER BY t.relname, i.relname;

-- ── 8. 行数 ───────────────────────────────────────────────────────────
-- Note: reltuples is an estimate; exact count requires sequential scan.
SELECT
  relname AS table_name,
  reltuples::bigint AS estimated_rows
FROM pg_class
WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND relkind = 'r'
ORDER BY relname;

-- Exact row counts (may be slow on large tables):
/*
SELECT 'profiles'             AS tbl, COUNT(*) FROM public.profiles
UNION ALL SELECT 'insp_records',       COUNT(*) FROM public.insp_records
UNION ALL SELECT 'work_records',       COUNT(*) FROM public.work_records
UNION ALL SELECT 'farms',              COUNT(*) FROM public.farms
UNION ALL SELECT 'colonies',           COUNT(*) FROM public.colonies
UNION ALL SELECT 'tasks',              COUNT(*) FROM public.tasks
UNION ALL SELECT 'push_subscriptions', COUNT(*) FROM public.push_subscriptions
UNION ALL SELECT 'notification_settings', COUNT(*) FROM public.notification_settings
UNION ALL SELECT 'benchmarks',         COUNT(*) FROM public.benchmarks
UNION ALL SELECT 'user_preferences',   COUNT(*) FROM public.user_preferences;
*/

-- ── 9. 孤立行チェック（auth.usersに対応しない所有行）────────────────────
-- profiles
SELECT 'profiles' AS tbl, COUNT(*) AS orphan_count
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id);

-- insp_records
SELECT 'insp_records' AS tbl, COUNT(*) AS orphan_count
FROM public.insp_records r
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = r.user_id);

-- work_records
SELECT 'work_records' AS tbl, COUNT(*) AS orphan_count
FROM public.work_records r
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = r.user_id);

-- ── 10. insp_records 列の存在確認（swarm_risk 等） ──────────────────────
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'insp_records'
ORDER BY ordinal_position;

-- ── 11. migration履歴（supabase_migrations schema） ──────────────────────
SELECT version, name, statements_hash, inserted_at
FROM supabase_migrations.schema_migrations
ORDER BY inserted_at;

-- ── 12. 関数・トリガー一覧 ─────────────────────────────────────────────
SELECT
  trigger_name,
  event_manipulation,
  event_object_schema,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema IN ('public', 'auth')
ORDER BY event_object_table, trigger_name;

-- ── 13. user_preferences 列の存在確認 ────────────────────────────────────
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_preferences'
ORDER BY ordinal_position;

-- ── 14. auth.users に対応するprofiles/user_preferences の欠落チェック ────
SELECT
  u.id,
  CASE WHEN p.id IS NULL THEN 'MISSING' ELSE 'OK' END AS profile_status,
  CASE WHEN up.user_id IS NULL THEN 'MISSING' ELSE 'OK' END AS user_preferences_status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_preferences up ON up.user_id = u.id
WHERE p.id IS NULL OR up.user_id IS NULL
LIMIT 50;
