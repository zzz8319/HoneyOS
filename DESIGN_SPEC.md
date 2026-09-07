# HoneyOS 設計書

> 最終更新: 2026-09-07  
> ブランチ: `claude/keen-planck-wa39zm`

---

## 目次

1. [プロジェクト概要](#1-プロジェクト概要)
2. [技術スタック](#2-技術スタック)
3. [画面フロー](#3-画面フロー)
4. [DB / テーブル設計](#4-db--テーブル設計)
5. [セキュリティ方針](#5-セキュリティ方針)
6. [実装ロードマップ](#6-実装ロードマップ)

---

## 1. プロジェクト概要

**HoneyOS** は養蜂家向けのモバイル PWA（Progressive Web App）。  
蜂群の内検記録・作業管理・分析を一元化し、養蜂の日常業務を効率化することを目的とする。

| 項目 | 内容 |
|------|------|
| 対象ユーザー | 個人・小規模養蜂家 |
| 提供形態 | PWA（iOS Safari / Android Chrome 対応） |
| ホスティング | GitHub Pages（`/HoneyOS/`） |
| バックエンド | Supabase（PostgreSQL + Auth + Realtime） |
| 言語 | 日本語（英語切替あり） |

---

## 2. 技術スタック

### フロントエンド
- **単一ファイル構成**: `index.html`（DCLogic/x-sc マイクロフレームワーク内蔵）
- **テンプレート**: `{{ expr }}` バインディング、`sc-if` / `sc-for` ディレクティブ
- **テーマシステム**: `THEMES` オブジェクト → `t.*` トークンで全スタイルを制御
- **デフォルトテーマ**: `clean`（白ベース + アンバーアクセント）
- **PWA**: `sw.js`（Service Worker）、`manifest.json`

### バックエンド
- **Supabase**: 認証・DB・Realtime・Push通知
- **DB アクセス層**: `supabase_client.js` → `window.HoneyDB` として公開

### 補助ファイル
| ファイル | 役割 |
|---------|------|
| `supabase_client.js` | DB操作のラッパー（全 CRUD + Realtime + Push） |
| `supabase_schema.sql` | テーブル定義・RLSポリシー |
| `support.js` | ユーティリティ（日付・計算系） |
| `utils.js` | 汎用ヘルパー |
| `sw.js` | Service Worker（Cache-first / Network-first 振り分け） |
| `component.js` | 追加コンポーネント（将来拡張用） |

---

## 3. 画面フロー

### 認証フロー（ログイン前）

```
[起動]
  │
  ├─ 未ログイン → SCR-001 ログイン
  │                ├─ 新規登録 → SCR-002 新規登録
  │                │               └─ SCR-003 オンボーディング① ようこそ
  │                │                   └─ SCR-004 オンボーディング② 養蜂場設定
  │                │                       └─ SCR-005 オンボーディング③ 準備完了
  │                │                           └─ [メイン画面へ]
  │                └─ ログイン成功 → [メイン画面へ]
  │
  └─ ログイン済み → [メイン画面へ]
```

### メイン画面（ボトムナビ 5タブ）

```
┌──────────────────────────────────────┐
│  ホーム │ 養蜂場 │ 作業 │ 分析 │ 設定 │
└──────────────────────────────────────┘
```

#### ホームタブ
```
SCR-006 ダッシュボード
  ├─ 通知ベル → SCR-007 通知センター
  └─ 内検を始める → SCR-011 内検開始
```

#### 養蜂場タブ
```
SCR-008 蜂群サマリー（蜂群一覧）
  ├─ 蜂群タップ → SCR-009 養蜂場詳細
  │               ├─ 巣箱タップ → SCR-009b 巣箱サマリー
  │               │               ├─ SCR-013 枠ビューア
  │               │               ├─ SCR-017 センサー詳細
  │               │               │   └─ SCR-018-020 センサーグラフ
  │               │               └─ SCR-021 カメラ画像
  │               └─ マップ → SCR-010 養蜂場マップ
  └─ 内検履歴 → SCR-016 内検履歴ダッシュボード
                 └─ SCR-016b 内検詳細
```

#### 作業タブ
```
SCR-024 作業（カレンダー + タスク一覧）
  ├─ タスク作成 → SCR-025 タスク作成
  ├─ 作業記録 → SCR-026 作業記録入力
  └─ 履歴 → SCR-027 作業履歴
```

#### 分析タブ
```
SCR-028 レポート
SCR-029 蜂群トレンド
SCR-030 蜂群比較
```

#### 内検フロー（ホームまたは養蜂場から起動）
```
SCR-011 内検開始（蜂群・日付選択）
  └─ SCR-012 内検記録（段→枠 2階層）
      ├─ SCR-014 AI解析入力
      │   └─ SCR-022 AI診断結果
      │       └─ SCR-023 AI推奨作業
      └─ SCR-015 内検サマリー（完了）
```

---

## 4. DB / テーブル設計

### テーブル一覧

| テーブル名 | 説明 |
|-----------|------|
| `auth.users` | Supabase 組み込み認証ユーザー |
| `profiles` | ユーザープロファイル（名前・養蜂場名） |
| `colonies` | 蜂群マスタ |
| `farms` | 養蜂場マスタ |
| `insp_records` | 内検記録 |
| `work_records` | 作業記録（採蜜・給餌・治療 等） |
| `push_subscriptions` | Web Push 通知購読情報 |
| `benchmarks` | 匿名統計（全ユーザー平均健康度） |

---

### `profiles`

| カラム | 型 | 説明 |
|-------|-----|------|
| `id` | `uuid` PK | `auth.users.id` と 1:1 |
| `name` | `text` | ユーザー表示名 |
| `farm_name` | `text` | 養蜂場名 |
| `created_at` | `timestamptz` | |

> サインアップ時に `handle_new_user()` トリガーで自動作成。

---

### `colonies`

| カラム | 型 | 説明 |
|-------|-----|------|
| `id` | `text` | 蜂群ID（例: `A-01`）|
| `user_id` | `uuid` | FK: `auth.users` |
| `name` | `text` | 表示名 |
| `sort_order` | `integer` | 並び順 |
| `created_at` | `timestamptz` | |

> PK は `(id, user_id)` の複合キー。

---

### `farms`

| カラム | 型 | 説明 |
|-------|-----|------|
| `id` | `bigint` auto PK | |
| `user_id` | `uuid` | FK: `auth.users` |
| `name` | `text` | 養蜂場名 |
| `sort_order` | `integer` | 並び順 |
| `created_at` | `timestamptz` | |

---

### `insp_records`（内検記録）

| カラム | 型 | 説明 |
|-------|-----|------|
| `id` | `bigint` auto PK | |
| `user_id` | `uuid` | FK: `auth.users` |
| `colony` | `text` | 蜂群ID |
| `date` | `text` | 内検日（`YYYY-MM-DD`） |
| `time` | `text` | 内検時刻 |
| `weather` | `text` | 天気 |
| `frames` | `integer[]` | 枠番号リスト |
| `count_mode` | `text` | `'frame'`（枠式）or `'space'`（割合式） |
| `frame_details` | `jsonb` | 枠ごとの詳細データ |
| `space_count` | `integer` | 割合式の総スペース数 |
| `space_levels` | `jsonb` | 割合式の各スペースレベル |
| `queen_present` | `boolean` | 女王確認 |
| `bees_total` | `integer` | 総蜂数概算 |
| `frame_memo` | `text` | メモ |
| `ai_memo` | `text` | AI診断メモ |
| `created_at` | `timestamptz` | |

**`frame_details` / `space_levels` の JSON 構造例:**
```json
{
  "1": { "bees": 80, "brood": 60, "honey": 40 },
  "2": { "bees": 100, "brood": 80, "honey": 20 }
}
```

---

### `work_records`（作業記録）

| カラム | 型 | 説明 |
|-------|-----|------|
| `id` | `bigint` auto PK | |
| `user_id` | `uuid` | FK: `auth.users` |
| `type` | `text` | 作業種別（採蜜・給餌・治療・分蜂・越冬 等） |
| `colony` | `text` | 対象蜂群ID |
| `date` | `text` | 作業日（`YYYY-MM-DD`） |
| `time` | `text` | 作業時刻 |
| `memo` | `text` | メモ |
| `yield_kg` | `decimal` | 採蜜量 kg（採蜜時のみ） |
| `created_at` | `timestamptz` | |

---

### `push_subscriptions`

| カラム | 型 | 説明 |
|-------|-----|------|
| `id` | `bigint` auto PK | |
| `user_id` | `uuid` | FK: `auth.users` |
| `endpoint` | `text` | Push エンドポイント URL |
| `p256dh` | `text` | 暗号化キー |
| `auth_key` | `text` | 認証キー |
| `created_at` | `timestamptz` | |

> `(user_id, endpoint)` にユニーク制約。

---

### `benchmarks`（匿名統計）

| カラム | 型 | 説明 |
|-------|-----|------|
| `user_id` | `uuid` PK | |
| `avg_health` | `numeric` | ユーザーの平均健康スコア |
| `colony_count` | `integer` | 管理蜂群数 |
| `updated_at` | `timestamptz` | |

---

## 5. セキュリティ方針

### 大原則

> **「セキュリティだけは一番気を付けて」**  
> RLS は全テーブルで有効。コンポーネントコードから `window.supabase` を直接叩くことを禁止し、必ず `window.HoneyDB` を経由する。

---

### Row Level Security（RLS）

全テーブルで RLS を有効化。ポリシーは以下の原則に従う:

| 操作 | ポリシー条件 |
|------|------------|
| SELECT | `auth.uid() = user_id` |
| INSERT | `auth.uid() = user_id` |
| UPDATE | `auth.uid() = user_id` |
| DELETE | `auth.uid() = user_id` |

→ 他ユーザーのデータには一切アクセスできない。

---

### DB アクセス層（HoneyDB）

```
コンポーネント (index.html)
       ↓ window.HoneyDB のみ
supabase_client.js
       ↓
Supabase SDK (window.supabase)
       ↓
Supabase API + RLS
```

- `index.html` 内から `window.supabase` を直接呼ぶことを禁止
- 全 DB 操作は `window.HoneyDB.*` 関数を経由する
- 各 HoneyDB 関数はセッション確認を行い、未ログイン時は例外を投げる

---

### 認証

- **Supabase Auth**（メール + パスワード）を使用
- `persistSession: true` / `autoRefreshToken: true` でセッション自動更新
- パスワードリセットは `resetPasswordForEmail()` → メールリンク方式

---

### Service Worker とキャッシュ

- アプリシェル（HTML/JS/画像）は **Cache-first** で配信
- Supabase API / Sentry / OpenMeteo / Nominatim は **Network-first**（キャッシュに古い認証情報が残らない）
- キャッシュ名は `honeyos-YYYYMMDD-X` 形式でデプロイごとにバンプ → 旧キャッシュを自動削除

---

### Push 通知

- `push_subscriptions` テーブルに端末キーを保存（RLS で保護）
- Service Worker の `push` イベントハンドラで受信・表示
- 通知クリックで該当画面へ遷移

---

### データエクスポート

- `HoneyDB.exportAllData()` でユーザー自身のデータのみを JSON エクスポート
- Supabase の RLS により、他ユーザーデータの混入は構造上不可能

---

## 6. 実装ロードマップ

### 現在の実装状況（v0.x）

| 機能 | 状態 |
|------|------|
| 認証（ログイン・新規登録・リセット） | ✅ 完了 |
| オンボーディング | ✅ 完了 |
| ダッシュボード（ミニマル） | ✅ 完了 |
| 蜂群サマリー（Beewiseスタイル縦バー図） | ✅ 完了 |
| 内検記録（枠式・割合式） | ✅ 完了 |
| 内検履歴・詳細表示 | ✅ 完了 |
| 作業記録・履歴 | ✅ 完了 |
| カレンダー（作業管理） | ✅ 完了 |
| 分析（トレンド・比較・レポート） | ✅ 完了 |
| AI診断入力・結果表示 | ✅ 完了 |
| Push通知（購読・受信） | ✅ 完了 |
| Realtime同期 | ✅ 完了 |
| PWA（Service Worker・オフライン） | ✅ 完了 |
| テーマシステム（clean / honey 等） | ✅ 完了 |
| データエクスポート | ✅ 完了 |
| 匿名ベンチマーク統計 | ✅ 完了 |

---

### v1.0 — 品質安定化

| # | タスク | 優先度 |
|---|--------|--------|
| 1.1 | 内検記録の編集機能（保存済みレコードを修正） | 高 |
| 1.2 | 蜂群の削除確認ダイアログ改善 | 中 |
| 1.3 | オフライン時の操作キュー（再接続時に自動送信） | 中 |
| 1.4 | エラー表示の統一（トースト → エラーバナー） | 中 |
| 1.5 | ローディング状態の改善（スケルトン UI） | 低 |

---

### v1.5 — UX 強化

| # | タスク | 優先度 |
|---|--------|--------|
| 2.1 | 内検リマインダー（前回から 14 日でプッシュ通知） | 高 |
| 2.2 | 養蜂場マップの実装（Google Maps または OpenStreetMap） | 高 |
| 2.3 | センサーデータの外部連携（温度・重量センサー API） | 中 |
| 2.4 | 写真添付（内検・作業記録に画像を紐付け） | 中 |
| 2.5 | 蜂群の健康スコア自動算出ロジックの精緻化 | 中 |
| 2.6 | 多言語対応の完成（現在の英語切替の全画面対応） | 低 |

---

### v2.0 — 高度機能

| # | タスク | 優先度 |
|---|--------|--------|
| 3.1 | 実際の AI 連携（Supabase Edge Function + Claude API で診断） | 高 |
| 3.2 | CSV / PDF エクスポートの UI 化 | 中 |
| 3.3 | 複数養蜂家のチーム共有（共有養蜂場） | 中 |
| 3.4 | Apple Watch / スマートデバイス連携 | 低 |
| 3.5 | ネイティブアプリ化（Capacitor / PWABuilder） | 低 |

---

## 付録: ファイル構成

```
HoneyOS/
├── index.html          # アプリ本体（全画面・ロジック・テーマ）
├── supabase_client.js  # DB アクセス層（window.HoneyDB）
├── supabase_schema.sql # テーブル定義・RLS ポリシー
├── support.js          # ユーティリティ
├── utils.js            # 汎用ヘルパー
├── component.js        # 追加コンポーネント
├── sw.js               # Service Worker
├── manifest.json       # PWA マニフェスト
├── icon-192.png        # PWA アイコン
├── icon-512.png        # PWA アイコン
├── hive_good.png       # 蜂群状態アイコン（良好）
├── hive_warn.png       # 蜂群状態アイコン（注意）
├── hive_danger.png     # 蜂群状態アイコン（危険）
├── hive_unknown.png    # 蜂群状態アイコン（不明）
├── DESIGN_SPEC.md      # 本設計書
└── tests/              # テスト
```

---

*このドキュメントはコードベースの実装状況をもとに自動生成されました。実装が進んだ際は適宜更新してください。*
