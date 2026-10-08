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

### Migration
- ファイル: `supabase/migrations/20261009_onboarding_completed.sql`
- remote DB への適用: **未実施**（手動適用が必要）
- 適用手順: supabase db push または Supabase Dashboard の SQL Editor
- 冪等性: IF NOT EXISTS / ON CONFLICT DO NOTHING で複数回実行可能

### DEV モード
- onboarding チェックをスキップ（`setOnboardingState('completed')` で即座に解決）
- 既存の 602 件のビジュアルスナップショットテストを保護（?screen= 直接アクセス）
