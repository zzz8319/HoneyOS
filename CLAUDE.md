# HoneyOS — Claude Code ガイド

## プロジェクト概要
養蜂家向けモバイル PWA。単一 HTML 版（`index.html`）と React 版（`react-ui/`）の 2 実装が共存する。

## ディレクトリ構成

```
HoneyOS/
├── index.html            # 既存の単一HTML版（変更禁止）
├── supabase_client.js    # DB アクセス層 → window.HoneyDB
├── react-ui/             # React版の新実装領域
│   ├── src/
│   │   ├── components/   # UIコンポーネント
│   │   ├── hooks/        # カスタムフック
│   │   ├── styles/       # tokens.css / app.css
│   │   └── App.tsx
│   ├── tests/            # Playwright ビジュアルテスト
│   ├── package.json
│   └── vite.config.ts
└── docs/
    └── HoneyOS_UI_Implementation_Spec.md
```

## 開発ルール

### セキュリティ（最重要）
- Supabase へ **直接アクセス禁止**。必ず `window.HoneyDB` 経由
- 将来の接続境界: `src/lib/db.ts` に `HoneyDB` ラッパーを置く
- RLS は全テーブルで有効

### React UI
- TypeScript strict モード
- CSS Modules または CSS Custom Properties（デザイントークン）を使う
- Tailwind は使わない（tokens.css で管理）
- コンポーネントは `src/components/` に配置

### コマンド（react-ui/ ディレクトリで実行）
```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run build       # typecheck + vite build
npm run dev         # 開発サーバー
```

### コミット規則
- `feat:` 新機能、`fix:` バグ修正、`chore:` 雑務
- index.html（既存HTML版）は触らない
