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

---

## SCR-012 内検記録方式（default_inspection_mode）

### 完成済み: SCR-031 設定 → SCR-012 新規内検への反映

SCR-031「設定」で保存した `default_inspection_mode` を、SCR-012「内検記録」の新規内検開始時の初期表示方式へ安全に反映する。

#### 本番時の動作

- 新規内検開始時、SCR-031 で保存した `default_inspection_mode` を SCR-012 の初期表示へ反映する
- 同一ユーザーの検証済みキャッシュ（`honeyos_user_prefs` + `honeyos_prefs_user_id`）を利用できる
- キャッシュがない場合は DB の `user_preferences` を取得する
- DB 取得完了前に `frame` を誤確定させない（App 側でゲーティング、Approach A）
- 設定を取得できない場合は `frame` へフォールバックする
- 別ユーザーのキャッシュは `getSession()` でユーザー ID を検証し使用しない
- SCR-012 を開始した後に設定値が変化しても、進行中の入力や選択モードを上書きしない
- `ratio` を利用できない条件（`SUPPORTED_MODES=['frame']`）では `frame` へフォールバックし、理由を案内する

#### 現在の優先順位（本番）

1. 同一ユーザーの検証済みキャッシュ
2. DB の `default_inspection_mode`（`user_preferences`）
3. `frame`（フォールバック）

> **注意**: `?initialMode=` URL パラメータはテスト専用のオーバーライドであり、本番の優先順位には含まれない。一般ユーザー向けの機能として案内・保存しない。不正値は安全に無視し `localStorage` や `user_preferences` へ保存しない。

#### pref-loading の終了保証

以下のいずれの場合も `defaultInspectionMode` は `null` から `'frame'` または `'ratio'` へ必ず解決する:

| 状況 | 動作 |
|---|---|
| `getDB()` が null（HoneyDB 未ロード / オフライン） | キャッシュ使用（なければ `frame`）|
| `getSession()` が失敗 | catch → `frame` |
| 未ログイン（`session.user = null`）| キャッシュ検証 → DB フェッチ → 完了か catch |
| `getUserPreferences()` が失敗 | catch → `frame` |
| `user_preferences` に行がない | `frame`（`getUserPreferences` がデフォルト返却） |
| localStorage が壊れている | `JSON.parse` 例外を無視 → `frame` |
| 別ユーザーのキャッシュのみ存在 | キャッシュ不一致 → DB フェッチ → 完了か catch |

---

### 延期要件: SCR-011 接続後の previousMode 反映

#### 残課題

SCR-012 の初期記録方式には、**対象蜂群の直近確定内検方式（previousMode）** を最優先する仕様が存在するが、SCR-011 から対象蜂群および直近確定内検方式を渡せるようになった段階で接続する。

`InspectionRecordScreen.tsx` の `resolveInitialInspectionMode()` 呼び出しに `// TODO: SCR-011 から渡される前回方式（現在は未接続）` コメントあり。

#### SCR-011 接続後の最終優先順位

1. 対象蜂群の `previousMode`（直近確定済み内検の記録方式）
2. ユーザーの `default_inspection_mode`
3. `frame`

#### 実装時の制約

- `previousMode` を仮データで接続しない
- SCR-011 の `onStart` コールバックに `previousMode` を追加する際は SCR-011 の変更として別工程で行う
- `previousMode` が判明したタイミングで SCR-012 に渡すが、**進行中の SCR-012 セッション（既にマウント済み）を後から上書きしない**
- `useState` lazy init によりマウント時点の値で確定するため、上書きはシステム設計上発生しない
