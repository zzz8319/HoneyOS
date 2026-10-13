# HoneyOS Pre-Migration Audit
## 実施日時: 2026-10-11T02:50 UTC
## HEAD: eb9d4bc570b4ac7f4744a8fde40077d0f956485d
## ブランチ: claude/keen-planck-wa39zm

---

## 1. 開始状態

| 項目 | 値 |
|------|-----|
| HEAD | `eb9d4bc570b4ac7f4744a8fde40077d0f956485d` |
| ブランチ | `claude/keen-planck-wa39zm` |
| git status | clean（uncommitted changes なし） |
| origin との差分 | 差分なし（push済み） |

### 65a287e..eb9d4bc 変更ファイル
- `docs/HoneyOS_UI_Implementation_Spec.md`
- `supabase/migrations/20261004_user_preferences.sql`

### Snapshot PNG 差分数
**0件**（変更なし）

---

## 2. Migration ファイル固定（SHA256 + サイズ）

| ファイル | バイト数 | SHA256 |
|----------|----------|--------|
| `20261003_react_ui_schema_baseline.sql` | 17,673 | `7ab24ac1f6ef98dd59ed148d863ab7e21d879bd7409f703e642c449f1c2d1a02` |
| `20261004_user_preferences.sql` | 3,442 | `53b6827b8eead44c216f669d9cd9733a81c8de9175986bb00d6e37becc83ef87` |
| `20261009_onboarding_completed.sql` | 1,803 | `fea9654ea63ce639192fa6af5d707ba5b89842194c35635c5346a58c8cfd0c42` |
| `20261010_account_deletion_cascade.sql` | 11,931 | `4d85a21c0bc92cbccc8e7a7cade315a062cb51bee4e6f5da8fb1c561d3b92f0f` |

---

## 3. 最終静的監査結果

| チェック項目 | 結果 |
|-------------|------|
| `CREATE POLICY IF NOT EXISTS` が0件 | ✅ PASS（全migration・docs含め0件） |
| DROP POLICY + CREATE POLICY が同一DOブロック内（20261004） | ✅ PASS（行55-84、単一DOブロック内でEXECUTE使用） |
| user_preferences 3ポリシー正しい | ✅ PASS（SELECT/INSERT/UPDATE、各USING/WITH CHECK正しい） |
| DELETE ポリシーが意図的に存在しない | ✅ PASS（CASCADE DELETE で自動削除のため） |
| 非冪等なCREATE TRIGGER なし | ✅ PASS（CREATE TRIGGERは全てDOブロック内 IF NOT EXISTS ガード付き） |
| Realtime ADD TABLE に重複防止あり | ✅ PASS（pg_publication + pg_publication_tables 2重チェック、3テーブル分） |
| DROP TABLE / TRUNCATE / DELETE FROM が0件 | ✅ PASS（コメント内の禁止宣言のみ、実DDL/DMLなし） |
| 既存列の破壊的型変更なし | ✅ PASS（ALTER COLUMN TYPE なし） |
| migration 適用順 03→04→09→10 | ✅ PASS（ファイル名昇順が依存関係と一致） |
| `CREATE POLICY IF NOT EXISTSはPG17以降で利用可能` の誤記が0件 | ✅ PASS（正しい記述に修正済み） |

### 注記: 20261003 のポリシー原子性
20261003 は DROP を DO ブロック内で行い、CREATE POLICY を DO ブロック外で実行するパターン。
20261004 で採用した「単一 DO ブロック + EXECUTE」パターン（完全原子性）とは異なるが、
20261003 は既に承認・コミット済みであり、変更禁止対象。DROP IF EXISTS は常に成功するため
実質的なリスクは低い。

---

## 4. Remote DB 監査状況

### アクセス結果
コンテナのネットワークポリシーにより `ytygsnmirkarrtqeawqm.supabase.co` への
アウトバウンド接続がプロキシで 403 Forbidden でブロックされている。
REST API・psql・CLI いずれもコンテナ内からは接続不可。

### 手動実施が必要な手順
1. Supabase Dashboard → SQL Editor を開く
2. `supabase/audit/remote_schema_inspection.sql` の内容をコピー＆実行
3. 結果を `supabase/audit/results/` に貼り付けて保存（secrets 除外）

### 確認すべき主要項目
- PostgreSQL バージョン
- public テーブル一覧（farms, colonies, tasks, insp_records, work_records,
  push_subscriptions, notification_settings, benchmarks, profiles, user_preferences）
- 各テーブルの列・型・NULL・DEFAULT
- PK / UNIQUE / FK / ON DELETE 規則
- RLS 有効状態（全10テーブル）
- policy 一覧と定義
- index 一覧
- supabase_realtime publication 対象テーブル
- migration 履歴（supabase_migrations.schema_migrations）

---

## 5. バックアップ確認

### 自動バックアップ（Supabase 提供）
- **Pro プラン以上**: 毎日自動バックアップ、7日間保持（Point-in-Time Recovery なし）
- **Pro + PITR アドオン**: 最大7日間の任意時点復元が可能
- **Free プラン**: 自動バックアップなし（手動のみ）

### 確認方法
Supabase Dashboard → Project Settings → Backups でバックアップ状況・最終取得時刻を確認。

### 適用前追加バックアップの必要性
**DDL 変更（CREATE TABLE / ADD COLUMN / CREATE INDEX）を含むため、
適用前に手動バックアップを推奨。**

### 手動バックアップ手順（要ユーザー承認）
```bash
# Supabase CLI使用（接続文字列はDashboardのProject Settings > Database > Connection Stringから取得）
pg_dump "postgresql://postgres:[PASSWORD]@db.ytygsnmirkarrtqeawqm.supabase.co:5432/postgres" \
  --schema=public \
  --no-owner \
  --no-acl \
  -F c \
  -f pre_migration_backup_$(date +%Y%m%d_%H%M%S).dump
```
上記はユーザーが手動で実行。パスワード・接続文字列はコードやファイルに記録しない。

### Point-in-Time Recovery
- Pro + PITR アドオン加入済みの場合は利用可能
- Dashboard で確認後、このセクションを更新すること

---

## 6. テスト結果

| テスト種別 | listed | executed | passed | failed | skipped | flaky | exit code |
|-----------|--------|----------|--------|--------|---------|-------|-----------|
| TypeScript (tsc) | - | - | ✅ | 0 | - | - | 0 |
| Lint (ESLint) | - | - | ✅ | 0 | - | - | 0 |
| Build (vite) | - | - | ✅ | 0 | - | - | 0 |
| Unit (Vitest) | 377 | 377 | 377 | 0 | 0 | 0 | 0 |
| Production E2E (Playwright) | 61 | 61 | 61 | 0 | 0 | 0 | 0 |
| Dev Visual (Playwright) | 602 | 602 | 602 | 0 | 0 | 0 | 0 |

全テスト期待件数一致、全パス。

---

## 7. Remote 適用計画（未実施）

### 前提条件
- migration ファイルの SHA256 を本ドキュメントで固定済み
- 全テストパス確認済み
- remote DB の現状監査（手動）が完了していること

### 適用手順

#### ステップ 0: 適用前バックアップ（ユーザー手動）
```
Supabase Dashboard → Backups → Create backup
または pg_dump で手動バックアップ（上記参照）
```
**→ バックアップ完了確認後にステップ1へ進む**

#### ステップ 1: 20261003 適用（SQL Editor）
```sql
-- supabase/migrations/20261003_react_ui_schema_baseline.sql の内容を貼り付け実行
```

**適用後検証:**
- `SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;`
  → farms, colonies, tasks, push_subscriptions, notification_settings, benchmarks が存在
- `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';`
  → 全テーブル rowsecurity = true
- `SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname='supabase_realtime';`
  → insp_records, work_records, tasks が含まれる
- 既存データ破損なしを確認（insp_records, work_records の行数チェック）

**停止判定: エラーがあれば後続を実行しない**

---

#### ステップ 2: 20261004 適用（SQL Editor）
```sql
-- supabase/migrations/20261004_user_preferences.sql の内容を貼り付け実行
```

**適用後検証:**
- `SELECT * FROM pg_tables WHERE tablename='user_preferences';`
- `SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename='user_preferences';`
  → 3ポリシー（select/insert/update）が存在、DELETEポリシーなし
- `SELECT tgname FROM pg_trigger WHERE tgrelid='public.user_preferences'::regclass;`
  → `set_user_preferences_updated_at` が存在

**停止判定: エラーがあれば後続を実行しない**

---

#### ステップ 3: 20261009 適用（SQL Editor）
```sql
-- supabase/migrations/20261009_onboarding_completed.sql の内容を貼り付け実行
```

**適用後検証:**
- `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='user_preferences';`
  → `onboarding_completed boolean NOT NULL`, `onboarding_completed_at timestamptz` が存在
- 既存 user_preferences 行の onboarding_completed が NULL でないことを確認

**停止判定: エラーがあれば後続を実行しない**

---

#### ステップ 4: 20261010 適用（SQL Editor）
```sql
-- supabase/migrations/20261010_account_deletion_cascade.sql の内容を貼り付け実行
```

**適用後検証:**
```sql
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON kcu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc
  ON rc.constraint_name = tc.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = rc.unique_constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND ccu.table_name = 'profiles'
ORDER BY tc.table_name;
```
→ 対象8テーブル全て `DELETE RULE = CASCADE`

**停止判定: エラーがあれば調査・手動ロールバック**

---

#### ステップ 5: アプリ API スモークテスト
- テストユーザーでログイン → farms 一覧取得 → colony 一覧取得
- user_preferences の GET/PATCH が正常動作

#### ステップ 6: disposable ユーザーによる RLS 分離テスト
- ユーザー A と B を作成
- A のデータが B から見えないことを確認（farms / colonies / insp_records）
- user_preferences も相互参照不可であること

---

## 8. 停止条件

各 migration の適用後に以下を確認。1つでも該当したら後続を停止し報告する。

- SQL エラー（ERROR: から始まるメッセージ）
- 期待するテーブル・列が存在しない
- RLS が有効化されていない
- ポリシー数・名称が期待と異なる
- 既存データ（insp_records / work_records / profiles）の行数が 0 に変化
- ON DELETE CASCADE が設定されていない FK が残存

---

## 9. 最終判定

### 判定: **A（適用可）**

| 判定項目 | 状態 |
|---------|------|
| HEAD / ブランチ | `eb9d4bc` / `claude/keen-planck-wa39zm` ✅ |
| migration ファイル変更なし | ✅ SHA256 固定済み |
| 静的監査 全10項目 | ✅ 全 PASS |
| 全テスト（1040件） | ✅ 全 PASS |
| Snapshot 差分 | ✅ 0件 |
| remote 未変更 | ✅ （接続不可によりネットワーク的にも変更不能だった） |
| remote 現状監査 | ⚠️ 手動実施が必要（SQL Editor で実施）|
| バックアップ確認 | ⚠️ ユーザーが手動で確認・取得が必要 |

**blocking 項目なし。**
remote 監査とバックアップ確認はユーザー手動実施が必要。
完了後、ステップ 0 から適用を開始できる。
