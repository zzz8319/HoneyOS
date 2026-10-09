# HoneyOS React UI 実装仕様書

## デザイントークン（tokens.css）

| トークン | 値 | 用途 |
|---------|-----|------|
| `--color-bg` | `#F8F7F4` | アプリ背景 |
| `--color-surface` | `#FFFFFF` | カード・シート |
| `--color-border` | `#E3E5E8` | 境界線 |
| `--color-text` | `#17212B` | 本文テキスト |
| `--color-text-secondary` | `#66707A` | 補助テキスト |
| `--color-primary` | `#E39A16` | アンバー（ブランドカラー） |
| `--color-primary-soft` | `#FFF3D8` | プライマリの薄い背景 |
| `--color-ok` | `#16A34A` | 良好・成功 |
| `--color-ok-soft` | `#DCFCE7` | 良好の薄い背景 |
| `--color-warn` | `#D97706` | 注意 |
| `--color-warn-soft` | `#FEF3C7` | 注意の薄い背景 |
| `--color-danger` | `#DC2626` | 危険・エラー |
| `--color-danger-soft` | `#FEE2E2` | 危険の薄い背景 |
| `--space-1..5` | `4/8/12/16/24px` | スペーシング |
| `--radius-md` | `12px` | 中サイズの角丸 |
| `--radius-lg` | `16px` | 大サイズの角丸 |
| `--shadow-float` | `0 8px 24px rgba(23,33,43,.12)` | 浮上シャドウ |

## コンポーネント一覧

### AppHeader
- 高さ: 56px
- 左: ロゴ + 養蜂場名（サブタイトル）
- 右: 通知ベルアイコン（バッジ付き）
- Props: `farmName`, `notifCount`, `onNotifClick`

### BottomNav
- 固定フッター 72px
- 5タブ: ホーム / 養蜂場 / 作業 / 分析 / 設定
- アクティブ: `--color-primary` + bold
- Props: `activeTab`, `onTabChange`

### PrimaryButton
- 背景: `--color-primary`、文字: white
- バリアント: `solid`（デフォルト）/ `outline` / `ghost`
- サイズ: `md`（デフォルト）/ `sm` / `lg`
- 全幅オプション: `fullWidth`
- disabled/loading 状態

### StatusBadge
- ステータス: `good` / `warn` / `danger` / `unknown`
- 色:
  - good → ok / ok-soft
  - warn → warn / warn-soft
  - danger → danger / danger-soft
  - unknown → text-secondary / border

### EmptyState
- 中央寄せ、絵文字アイコン + タイトル + 説明 + オプションCTA
- Props: `emoji`, `title`, `description`, `actionLabel`, `onAction`

### ErrorBanner
- 画面上部固定、赤系背景
- 重大度: `minor`（薄め）/ `critical`（濃い赤）
- 手動で閉じるまで表示
- Props: `message`, `severity`, `onClose`

## 画面フロー（実装対象）

```
SCR-006 ダッシュボード（ホーム）
  ├─ 通知ベル → SCR-007 通知センター
  └─ 内検を始める → SCR-011 内検開始

SCR-008 蜂群一覧
  └─ カードタップ → SCR-009 蜂群詳細

SCR-011 内検開始
  └─ → SCR-012 内検記録 → SCR-013 枠ビューア
```

## DB アクセス境界

```typescript
// src/lib/db.ts — 将来 window.HoneyDB を接続する境界
declare global {
  interface Window {
    HoneyDB: HoneyDBClient
  }
}
export const db = () => window.HoneyDB
```

直接 Supabase SDK を呼ばない。全 CRUD は `db().*` 経由。

## Onboarding フロー（認証後の表示判定）

### 表示条件
- `user_preferences.onboarding_completed = false` → SCR-003 を表示
- `user_preferences.onboarding_completed = true` → home へ遷移
- DB 取得失敗 → エラー表示・再試行（home 非表示）
- `PASSWORD_RECOVERY` 中 → Onboarding チェックをスキップ（SCR-034 優先）
- DEV モード → Onboarding チェック無効（ビジュアルテスト保護）

### DB が正本
- localStorage だけで完了判定しない
- user_preferences.onboarding_completed が唯一の正本
- 新規ユーザーのデフォルト: false
- 既存ユーザー（migration backfill）: true

### onboarding state machine（App.tsx）
| 状態 | 意味 | 表示 |
|------|------|------|
| `pending` | DB 未確認 | ローディングスピナー |
| `required` | completed=false | SCR-003（オンボーディングステップ1） |
| `completed` | completed=true | 通常ルーティング |
| `error` | DB 取得失敗 | エラー + 再試行ボタン |

### 完了処理順
1. 入力データ保存（saveFarm 等） — SCR-004 で実施
2. SCR-005 でユーザーが「ダッシュボードを見る」または「最初の内検を始める」をタップ
3. onComplete コールバック → updateUserPreferences({ onboarding_completed: true }) を書き込む
4. DB 書き込み成功後のみ → onboardingState='completed' → home へ遷移

### オフライン・DB 失敗時
- 完了ボタンで成功偽装しない
- home へ進まない
- 再試行 UI を表示（SCR-005 の completeError バナー）

### Auth イベント別の挙動
| イベント | onboarding への影響 |
|----------|---------------------|
| SIGNED_OUT | onboardingState を 'pending' にリセット |
| SIGNED_IN（別ユーザー） | onboardingState を 'pending' にリセット（再フェッチ） |
| SIGNED_IN（同ユーザー） | リセットなし |
| TOKEN_REFRESHED | 影響なし（再フェッチしない） |
| USER_UPDATED | 影響なし |
| PASSWORD_RECOVERY | onboarding チェックスキップ（SCR-034 優先） |

### updateUserPreferences 部分更新

- **指定されたフィールドのみ DB へ送信する**。`DEFAULT_PREFS` を既存行更新に使用しない。
- `onboarding_completed` は未指定の更新では変更しない（例: `{ theme: 'dark' }` では `onboarding_completed` フィールドをペイロードに含めない）。
- 許可フィールド: `theme`, `language`, `default_inspection_mode`, `onboarding_completed`, `onboarding_completed_at`
- 除外フィールド: `user_id`（呼び出し元からの指定を無視し常にセッション user_id を使用）、`created_at`、未知フィールド、`undefined` 値
- Supabase JS v2 の upsert は `onConflict` 時ペイロードに含まれるカラムのみ更新するため、フィールド省略 = 既存値保持となる。
- **D-2 バグ修正**: 旧実装では `DEFAULT_PREFS` をスプレッドするため `onboarding_completed: false` が常にペイロードに含まれ、既存ユーザーが設定を変更すると `onboarding_completed` が false にリセットされていた。

### onboarding_completed_at ルール

- `onboarding_completed: true` を設定し `onboarding_completed_at` を未指定 → クライアント時刻 (`new Date().toISOString()`) を自動設定。
  - 注意: DB 側時刻 (`now()`) への変更は将来の改善事項。クライアントとサーバーの時刻差が問題になる場合は DB トリガーに移行すること。
- `onboarding_completed: false` を設定 → `onboarding_completed_at` を `null` にクリア。
- 両フィールドとも未指定 → どちらもペイロードに含めない（DB 値を保持）。

### Migration

- ファイル: `supabase/migrations/20261009_onboarding_completed.sql`
- **remote DB への適用: 未実施**（手動適用が必要）
- 適用手順: supabase db push または Supabase Dashboard の SQL Editor
- 冪等性: IF NOT EXISTS / ON CONFLICT DO NOTHING で複数回実行可能

### deploy 順序

**①supabase migration 適用 → ② フロントエンド deploy の順序で実施すること。**

逆順の場合（フロントエンドを先に deploy すると）、既存ユーザーの `user_preferences` に `onboarding_completed` カラムが存在しないため `getUserPreferences` が `DEFAULT_PREFS`（`onboarding_completed: false`）にフォールバックし、既存ユーザー全員がオンボーディングを再表示してしまう。

### migration トランザクション境界

Supabase CLI は各マイグレーションファイルを自動的に単一トランザクション内で実行する（PostgreSQL の DDL はトランザクション内で安全）。`20261009_onboarding_completed.sql` および `20261004_user_preferences.sql` ともに明示的な `BEGIN`/`COMMIT` を持たないが、これは Supabase CLI がラップするため意図的なものである。マイグレーション SQL の変更は不要。

### initDefaultColonies の接続方針

**Step 2（SCR-004）でfarm・colonies データを直接 `saveFarm`/`saveColony` 経由で保存するため、Onboarding フローから `initDefaultColonies` は呼び出さない。** 二重作成防止のため意図的に未接続。`initDefaultColonies` は将来の admin ツール等で利用できる状態で残す。

### SCR-005 完了処理順（確定版）

1. SCR-004（Step 2）でユーザーが「設定して次へ」→ `saveFarm`/`saveColony` が呼ばれ farm・colony データを保存
2. SCR-005（Step 3）でユーザーが完了ボタンをタップ
3. `onComplete` コールバック → `updateUserPreferences({ onboarding_completed: true })` を書き込む
4. DB 書き込み成功後のみ → `onboardingState = 'completed'` → home へ遷移
5. DB 書き込み失敗時は home へ遷移しない（`completeError` バナー表示・再試行 UI）

### 実 Recovery Link E2E 未確認

Supabase CLI および Docker が利用できないため、実リカバリリンクを使用した E2E テストは未実施。本番環境でのリカバリフロー検証は手動テストが必要。

### DEV モード
- onboarding チェックをスキップ（`setOnboardingState('completed')` で即座に解決）
- 既存の 602 件のビジュアルスナップショットテストを保護（?screen= 直接アクセス）

---

## アカウント削除 (工程E)

### データオーナーシップ監査表

| schema.table | owner_col | FK to auth.users | ON DELETE | RLS | 削除順序 | 明示的削除必要 | 共有データ |
|---|---|---|---|---|---|---|---|
| public.profiles | id (PK) | references auth.users(id) | CASCADE | ✅ | auth.users削除で自動 | 不要 | なし |
| public.farms | user_id | references auth.users(id) | CASCADE | ✅ | auth.users削除で自動 | 不要 | なし |
| public.colonies | user_id | references auth.users(id) | CASCADE | ✅ | auth.users削除で自動 | 不要 | なし |
| public.insp_records | user_id | references auth.users(id) | CASCADE | ✅ | auth.users削除で自動 | 不要 | なし |
| public.work_records | user_id | references auth.users(id) | CASCADE | ✅ | auth.users削除で自動 | 不要 | なし |
| public.tasks | user_id | references auth.users(id) | CASCADE | ✅ | auth.users削除で自動 | 不要 | なし |
| public.push_subscriptions | user_id | references auth.users(id) | CASCADE | ✅ | auth.users削除で自動 | 不要 | なし |
| public.benchmarks | user_id (PK) | references auth.users(id) | CASCADE | ✅ | auth.users削除で自動 | 不要 | 集計のみ参照 |
| public.notification_settings | user_id (PK) | references auth.users(id) | CASCADE | ✅ | auth.users削除で自動 | 不要 | なし |
| public.user_preferences | user_id (PK) | references auth.users(id) | CASCADE | ✅ | auth.users削除で自動 | 不要 | なし |

### FK/カスケード監査結果

全テーブルが `auth.users(id) ON DELETE CASCADE` を持つため、`auth.users` のレコード削除のみで全データが自動削除される。明示的な per-table DELETE は不要。RESTRICT/NO ACTION によるブロックなし。

### 新規マイグレーション

**不要。** 既存スキーマで全テーブルが ON DELETE CASCADE を持つ。

### 削除方式

**ハード削除（完全削除）。** ソフトデリートは採用しない。養蜂家の個人データ保護とデータミニマイゼーションのため、削除リクエストは即時かつ完全に処理する。

### 削除順序

1. JWT を `supabase.auth.getUser(token)` で検証 → `userId` を取得
2. 確認フレーズの完全一致チェック（`アカウントを削除する`）
3. JWT `iat` が 10 分以内であることを確認（直近認証チェック）
4. Storage オブジェクトを削除（現時点ではバケット未設定；将来対応）
5. `adminClient.auth.admin.deleteUser(userId)` → auth.users 削除（全テーブルにカスケード）
6. 200 を返す

### JWT 検証と userId の取得

- `supabase.auth.getUser(token)` で JWT を検証し、返却された `user.id` を userId として使用
- リクエストボディに `userId`/`email`/`targetUserId` が含まれる場合は 400 を返す
- userId は必ず検証済み JWT から取得する（ボディ由来の値は一切使用しない）

### 直近認証チェック（10分）

JWT の `iat`（発行時刻）を取得し、現在時刻との差が 600 秒を超える場合は `{ error: "reauth_required" }` を 401 で返す。`iat` はサーバー側で署名されているため改ざん不可（getUser 検証後のペイロードを使用）。

### Edge Function

- パス: `supabase/functions/delete-account/index.ts`
- メソッド: POST のみ（他は 405、OPTIONS は CORS プリフライト）
- CORS 許可オリジン: 環境変数 `ALLOWED_ORIGINS`（デフォルト: localhost 開発ポート 4 種）+ `PRODUCTION_ORIGIN`
- リクエストオリジンをそのまま反射しない（ホワイトリスト方式）

### service_role キーの保管場所

Edge Function の環境変数のみに存在する（`SUPABASE_SERVICE_ROLE_KEY`）。レスポンスやログに出力しない。React フロントエンド、`supabase_client.js`、リポジトリには一切存在しない。

### 成功/失敗 UX

| 状態 | UI挙動 |
|---|---|
| 成功 | ダイアログを閉じ、キャッシュクリア、ログイン画面へ遷移 |
| API失敗（汎用） | ダイアログ維持、エラーメッセージ表示、入力保持、再試行可能 |
| reauth_required | 「安全のため再ログインしてください」メッセージ + 再ログインボタン |
| オフライン | 削除ボタンを disabled、操作ブロック |
| 送信中 | ボタン disabled（二重送信防止） |

### オフライン挙動

- `navigator.onLine` チェックを実行前に行う
- オフライン時は API コールなし、エラーメッセージ表示

### キャッシュクリアアプローチ

`clearUserCache(userId)` を削除成功後に呼び出す。対象キー:
- `honeyos_user_prefs`
- `honeyos_prefs_user_id`
- `honeyos_prefs_sync_pending`
- `honeyos_react_theme`（legacy）
- `honeyos_react_language`（legacy）
- userId を含む任意のキー（将来のper-userキー対応）

`sb-` プレフィックスのキー（Supabase 内部ストレージ）は絶対に削除しない。

### 部分的失敗のリカバリ設計

- Storage 削除失敗 → auth.users 削除を実行しない（データ孤立防止）
- DB 削除は auth.users 削除のカスケードに委任（アトミック）
- auth.users 削除失敗（404 以外）→ 500 を返す
- 冪等性: auth.users が既に削除済みの場合（404）→ 200 を返す（成功扱い）

### リモート Edge Function デプロイ状況

**未デプロイ。** 本番リモートへのデプロイは未実施。ローカルおよびCI環境での動作確認のみ。

### 実削除 E2E 未確認

実際のユーザーアカウントを対象とした削除 E2E テストは未実施。Edge Function 未デプロイのため。本番環境での検証は手動テストが必要。

### リリース前チェックリスト（工程E）

- [ ] Edge Function を本番 Supabase プロジェクトへデプロイ
- [ ] `ALLOWED_ORIGINS` に本番ドメインを設定
- [ ] `PRODUCTION_ORIGIN` 環境変数を設定
- [ ] `SUPABASE_SERVICE_ROLE_KEY` を Edge Function 環境変数にのみ設定
- [ ] 本番環境でのアカウント削除 E2E テストを手動実施
- [ ] ログに service_role キーが出力されないことを確認
- [ ] RLS が全テーブルで有効であることを確認
