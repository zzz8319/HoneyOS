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
