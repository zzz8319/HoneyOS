# HoneyOS 全機能監査レポート

監査日: 2026-10-25（更新）  
対象ブランチ: `fix/functional-audit-followup`  
監査者: Claude Sonnet 4.6

---

## 監査方法

- 各画面の TSX ソースを通読し、UI → イベントハンドラ → DB 呼び出し → 結果処理のフローを追跡
- `supabase_client.js` で `window.HoneyDB` の実装を確認し、呼び出し側との API 整合を検証
- mock による検証であり、実 Supabase への保存確認とは別物です

---

## 件数整合について

| ラウンド | 発見事項 | 累計 |
|---|---|---|
| 第1回監査（initial）| #1〜#11（11件）| 11件 |
| 第2回調査（saveFarm・mapTask completed_at）| #12〜#13（2件）| 13件 |
| 包括監査（comprehensive）| #14〜#23（10件）| **23件** |

ユーザーが「前回13件 + 新規9件 = 22件のはず」と報告した件数との差異は、包括監査での新規発見が 9件ではなく **10件**（#14〜#23）だったことによる。#14「削除操作未実装」は第3回で追加されており欠番なし。発見事項は **合計23件、#1〜#23に欠番・重複なし**。

---

## 発見事項一覧（正規化版）

| 管理ID | 深刻度 | 画面 | 問題 | 期待動作 | 現在の動作 | 優先度 | 修正状況 | 今回PRに含む | 確認方法 | 実Supabase確認 | 関連PR |
|--------|--------|------|------|----------|-----------|--------|----------|------------|----------|---------------|--------|
| F-001 | CRITICAL | WorkListScreen | `mapTask()` が `loadTasks()` の camelCase `isCompleted` を読まず、`completed_at` 文字列（truthy）で完了判定 → DB 完了済みタスクが再読込後に未完了表示 | `isCompleted: true` ならば完了表示を維持 | 再読込後に完了済みタスクが未完了として表示される | P0 | **修正済み** | ✅ | Unit Test (mapTask.test.ts) | 実環境未確認 | PR #102 |
| F-002 | HIGH | WorkListScreen | 期限超過バナーが常に「期限切れ 1件」とハードコード表示 | 実際の期限超過タスク件数を表示。0件なら非表示 | 常に「1件」と表示（実際の件数に関係なく）| P1 | **修正済み** | ✅ | Production E2E (WL-4/WL-5) | 実環境未確認 | PR #102 |
| F-003 | HIGH | WorkRecordScreen | 蜂群未選択または `saveWorkRecord` 未定義でも `onSuccess()` を呼び出し → 何も保存せず成功遷移 | 保存失敗時はエラー表示、成功遷移しない | 未選択・未定義でも成功遷移する | P1 | **修正済み** | ✅ | Production E2E (WL-7) + Unit Test (saveGuard.test.ts) | 実環境未確認 | PR #102 |
| F-004 | HIGH | ColonyCreateScreen | `saveColony` が未定義の場合でも `onSuccess(newId)` を呼び出し → 存在しない蜂群 ID で詳細画面へ遷移 | `saveColony` 未定義時は throw してエラー表示 | 未定義でも成功遷移する | P1 | **修正済み** | ✅ | Unit Test (saveColonyGuard.test.ts) | 実環境未確認 | PR #102 |
| F-005 | HIGH | WorkRecordScreen | 下書き保存ボタンの `onClick` が空実装（コメントアウトのみ） | タップで下書き保存（仕様未定義） | 何も起きない | P1 | 未修正 | ❌ | 目視確認 | 実環境未確認 | — |
| F-006 | HIGH | InspectionStartScreen | `inspDate`・`weather`・`temperature` がハードコード定数（例: `'2026年9月8日（火）'`、`28`）— 実際の入力を使わない | 当日日付・実際の気象値（または「未取得」）を表示 | ハードコード値が常に表示される | P1 | 未修正 | ❌ | 目視確認 | 実環境未確認 | — |
| F-007 | MEDIUM | InspectionStartScreen | 養蜂場タブが DB から取得した farms ではなく `MOCK_APIARIES` ハードコード定数を参照 | DB の farms を表示 | ハードコードの養蜂場が常に表示される | P2 | 未修正 | ❌ | 目視確認 | 実環境未確認 | — |
| F-008 | MEDIUM | WorkListScreen | カレンダーの週帯が `WEEK_STRIP` ハードコード（2026年9月固定）・月ラベル「2026年9月」固定 | 今週の週帯を動的表示、月移動可能 | 9月固定で変更不可 | P2 | 未修正 | ❌ | 目視確認 | 実環境未確認 | — |
| F-009 | MEDIUM | WorkListScreen | `DeadlineTag` の相対ラベル（「期限切れ1日」「3日後」等）がハードコード | 実際の日付差から動的計算 | 固定文字列が表示される | P2 | 未修正 | ❌ | 目視確認 | 実環境未確認 | — |
| F-010 | MEDIUM | WorkListScreen | 月移動ボタンに `onClick` ハンドラなし | タップで前後月に移動 | 何も起きない | P2 | 未修正 | ❌ | 目視確認 | 実環境未確認 | — |
| F-011 | LOW | WorkListScreen | フィルターチップに `onChange` ハンドラなし（UI 描画のみ） | タップでフィルター切り替え | 何も起きない | P3 | 未修正 | ❌ | 目視確認 | 実環境未確認 | — |
| F-012 | CRITICAL | ApiaryCreateScreen | `saveFarm` をオブジェクト引数で呼び出していたが、`supabase_client.js` の実装は位置引数 `(name, id, opts)`。INSERT 後に ID を返していなかった → 作成後の画面遷移で ID が常に 0 | 正しい引数で呼び出し、有効な ID を取得して遷移 | 引数ミスで保存失敗 or ID=0 で成功遷移 | P0 | **修正済み** | ✅ | Unit Test (apiaryCreateGuard.test.ts) | 実環境未確認 | PR #102 |
| F-013 | HIGH | WorkListScreen | `mapTask` で `completed_at` 文字列（日時）を boolean 判定に使用 → 完了日時があれば未完了タスクも完了扱い | boolean フィールド（`isCompleted` / `is_completed` / `completed`）のみで判定 | `completed_at` が存在すると完了扱いになる | P0 | **修正済み** | ✅ | Unit Test (mapTask.test.ts) | 実環境未確認 | PR #102 |
| F-014 | INFO | 全画面 | タスク・作業記録・蜂群・養蜂場の削除操作が React UI に未実装（`supabase_client.js` には定義あり） | 削除ボタンから DB 削除を実行 | 削除機能なし | P3 | 未修正 | ❌ | コード確認 | 実環境未確認 | — |
| F-015 | MEDIUM | AiDiagnosisScreen | データ全体が `MOCK_DIAGNOSIS_DATA` ハードコード — AI 診断結果が実 DB から取得されない | 実 DB データを使用 | ハードコードのデモデータが表示される | P2 | 未修正 | ❌ | 目視確認 | 実環境未確認 | — |
| F-016 | MEDIUM | AiAnalysisScreen | `MOCK_INSPECTION_SUMMARY` / `MOCK_INSPECTION_DATA` ハードコード | 実 DB データを使用 | ハードコードのデモデータが表示される | P2 | 未修正 | ❌ | 目視確認 | 実環境未確認 | — |
| F-017 | MEDIUM | ApiaryMapScreen | 養蜂場リストが `MOCK_APIARIES`、蜜源情報が `MOCK_NECTAR_SOURCES` ハードコード | 実 DB データを使用 | ハードコードのデモデータが表示される | P2 | 未修正 | ❌ | 目視確認 | 実環境未確認 | — |
| F-018 | MEDIUM | CameraImagesScreen | 写真データが `MOCK_DATA` ハードコード | 実 DB データを使用 | ハードコードのデモデータが表示される | P2 | 未修正 | ❌ | 目視確認 | 実環境未確認 | — |
| F-019 | MEDIUM | RecommendedWorkScreen | 推奨作業データが `MOCK_RECOMMENDED_WORK_DATA` ハードコード | 実 DB データを使用 | ハードコードのデモデータが表示される | P2 | 未修正 | ❌ | 目視確認 | 実環境未確認 | — |
| F-020 | MEDIUM | FrameViewerScreen | 内検記録データが `MOCK_RECORDS` ハードコード | 実 DB データを使用 | ハードコードのデモデータが表示される | P2 | 未修正 | ❌ | 目視確認 | 実環境未確認 | — |
| F-021 | MEDIUM | InspectionCompleteScreen | `getMockData()` ハードコードを使用 | 実 DB データを使用 | ハードコードのデモデータが表示される | P2 | 未修正 | ❌ | 目視確認 | 実環境未確認 | — |
| F-022 | LOW | ColonyDetailScreen | `alert('簡易指標β 算出方法の説明（未実装）')` / `alert('再試行（未実装）')` が残存 | 実装するか alert を除去 | alert が表示される | P3 | 未修正 | ❌ | 目視確認 | 実環境未確認 | — |
| F-023 | LOW | FrameViewerScreen | `alert('内検メモ（未実装）')` が残存 | 実装するか alert を除去 | alert が表示される | P3 | 未修正 | ❌ | 目視確認 | 実環境未確認 | — |

**合計: 23件 / 修正済み: 6件 / 未修正: 17件**
**P0: 3件（F-001/F-012/F-013）、P1: 4件（F-002/F-003/F-004/F-005）、P2: 12件（F-006〜F-011, F-015〜F-021）、P3: 4件（F-014/F-022/F-023 + F-011相当）**

---

## saveFarm API契約

### シグネチャ（supabase_client.js 実装）

```javascript
// 修正前
async function saveFarm(name, id, opts = {}) {
  // ...
  // INSERT パス: 戻り値なし（undefined）
  const { error } = await sb.from('farms').insert({ user_id: session.user.id, ...payload });
  if (error) throw error;
}

// 修正後
async function saveFarm(name, id, opts = {}) {
  // ...
  // INSERT パス: { id: number } を返す
  const { data, error } = await sb.from('farms')
    .insert({ user_id: session.user.id, ...payload })
    .select('id').single();
  if (error) throw error;
  return data;  // → { id: number }
  // UPDATE パス: 変更なし、戻り値なし
}
```

### 戻り値

| パス | 修正前 | 修正後 |
|---|---|---|
| INSERT（新規作成） | `undefined` | `{ id: number }` |
| UPDATE（既存更新） | `undefined` | `undefined`（変更なし） |

### db.ts 型定義（修正後）

```typescript
saveFarm(name: string, id?: string | null | undefined, opts?: { latitude?: number | null; longitude?: number | null }): Promise<{ id: number } | null | undefined>
```

### 全呼び出し元

| ファイル | 引数形式 | 戻り値の使い方 | 修正 |
|---|---|---|---|
| `ApiaryCreateScreen.tsx:235` | `saveFn.call(HoneyDB, name, undefined, {latitude, longitude})` 位置引数 | `result.id` → `onSuccess({id})` ※ falsy なら throw | **修正済み** |
| `OnboardingStep2Screen.tsx:165` | `window.HoneyDB?.saveFarm?.(farmName, undefined, {latitude, longitude})` 位置引数 | 戻り値未使用（`await` のみ） | 変更なし（onboarding の許容範囲） |

### mock の saveFarm

| 場所 | 修正前 | 修正後 |
|---|---|---|
| `tests/visual/helpers/mockHoneyDB.ts` | `async () => {}` (undefined) | `async () => ({ id: 1 })` |
| `tests/visual/scr-034-password-reset.spec.ts` | `async () => ({ id: 1 })` | 変更なし |
| `tests/visual/scr-001-login.spec.ts` | `async () => ({ id: 1 })` | 変更なし |
| `tests/visual/scr-031-api.spec.ts` | `async () => {}` | 変更なし（このテストは saveFarm 戻り値を使わない） |
| Production E2E | `async function() {}` | 変更なし（これらのテストは saveFarm 戻り値を使わない） |

### セキュリティ・整合性

- INSERT 後に `.select('id').single()` で作成された行の id を取得 → RLS が INSERT を許可すれば SELECT も同一トランザクションで取得可能
- 二重登録防止: `ApiaryCreateScreen` に `isActuallySubmitting` ガード（`submitting` state）あり
- `data` が null の場合: `if (!result?.id) throw new Error('saveFarm returned no id')` でエラー
- `farms.id` の型: Supabase が bigint として返す → JavaScript では number として扱われる

---

## mapTask 完了判定仕様

### 最終実装（WorkListScreen.tsx L43）

```typescript
Boolean(raw.isCompleted ?? raw.is_completed ?? raw.completed ?? false)
```

### 優先順位と仕様

| 優先 | フィールド | 型 | 説明 |
|---|---|---|---|
| 1 | `isCompleted` | boolean | `loadTasks()` の camelCase 戻り値 |
| 2 | `is_completed` | boolean | snake_case 代替 |
| 3 | `completed` | boolean | その他互換フィールド |
| 4 | `false` | — | すべて未定義のデフォルト |

**`completed_at` は含まない。** 日時文字列はそれ自体が truthy なため boolean として使用すると誤判定が発生する（F-013 の根本原因）。`completed_at` はあくまで完了日時であり、完了状態の根拠には使用しない。

### 各入力ケースの結果

| 入力 | isCompleted 結果 |
|---|---|
| `{ isCompleted: true }` | `true` |
| `{ isCompleted: false }` | `false`（`??` は null/undefined のみをスキップ、false は通さない） |
| `{ is_completed: true }` | `true` |
| `{ is_completed: false }` | `false` |
| `{ completed: true }` | `true` |
| `{ completed_at: '2026-01-01T...' }` | **`false`**（`completed_at` は判定に使わない） |
| `{ completed_at: null }` | `false` |
| `{ isCompleted: true, completed_at: '2026-01-01T...' }` | `true`（isCompleted 優先） |
| `{}` | `false`（デフォルト） |

---

## 修正内容詳細

### F-001 / F-013 mapTask isCompleted バグ（WorkListScreen）

**修正前（旧）:**
```typescript
Boolean(raw.completed_at ?? raw.completed)
// → completed_at が日時文字列の場合、truthy になり完了扱い（F-013 の原因）
// → isCompleted（camelCase）を参照していない（F-001 の原因）
```

**修正後（現在のコード）:**
```typescript
Boolean(raw.isCompleted ?? raw.is_completed ?? raw.completed ?? false)
// → isCompleted（camelCase）を最優先で参照（F-001 修正）
// → completed_at は除外（F-013 修正）
```

### F-002 期限超過バナー動的カウント（WorkListScreen）

**修正前:** `期限切れ 1件`（ハードコード、常に表示）  
**修正後:** `期限切れ {overdueCount}件`（動的）、`overdueCount === 0` のとき非表示

### F-003 WorkRecordScreen 偽成功バグ

**修正前:** 蜂群未選択・`saveWorkRecord` 未定義でも `onSuccess()` を呼び出し  
**修正後:** 未選択時は `setSaveError('蜂群を選択してください。')` を設定、`onSuccess` 非呼び出し

### F-004 ColonyCreateScreen 偽成功バグ

**修正前:** `saveColony` 未定義でも `onSuccess?.(newId)` を呼び出し  
**修正後:** `saveColony` 未定義時は `throw new Error('saveColony unavailable')`

### F-012 ApiaryCreateScreen saveFarm API 契約違反

**修正前:** `saveFarm({ name, address, lat, lng })` — オブジェクト引数（誤り）、INSERT 後 ID 未取得  
**修正後:** `saveFarm(name, undefined, { latitude, longitude })` — 位置引数、`result.id` が falsy なら throw

---

## 画面別チェック結果サマリー

| 画面 | DB 呼び出し | 結果処理 | エラー処理 | 備考 |
|------|------------|---------|-----------|------|
| LoginScreen | ✅ HoneyDB.signIn | ✅ | ✅ | |
| SignupScreen | ✅ HoneyDB.signUp | ✅ | ✅ | |
| OnboardingStep2Screen | ⚠️ saveFarm/saveColony 任意呼び出し | △ 失敗時もonNext | 弱い | オンボーディングのため許容範囲 |
| WorkListScreen | ✅ loadTasks, completeTask | ✅ (修正後) | ✅ | F-001/F-002/F-013 修正済み |
| WorkRecordScreen | ✅ saveWorkRecord | ✅ (修正後) | ✅ | F-003 修正済み、F-005 未修正 |
| TaskCreateScreen | ✅ saveTask | ✅ | ✅ | |
| ColonyCreateScreen | ✅ saveColony | ✅ (修正後) | ✅ | F-004 修正済み |
| ColonyDetailScreen | ✅ loadColony系 | ✅ | ✅ | |
| ApiaryCreateScreen | ✅ saveFarm（修正後） | ✅ | ✅ | F-012 修正済み |
| InspectionStartScreen | ✅ loadFarms/loadColonies | ⚠️ | △ | F-006/F-007 未修正 |
| SettingsScreen | ✅ signOut/updateProfile等 | ✅ | ✅ | |
| AccountDeleteScreen | ✅ reauthenticate/deleteAccount | ✅ | ✅ | |

---

## DBスキーマ変更の要否

今回の修正範囲ではDBスキーマ変更は不要。すべての修正はフロントエンドのフィールド名参照ミスおよびガード条件の修正。

---

## 残存課題の推奨修正順

### 優先 1: InspectionStartScreen の MOCK_APIARIES 除去（F-007）
### 優先 2: InspectionStartScreen の日時・天気・気温を実データ化（F-006）
### 優先 3: WorkListScreen のカレンダー月移動実装（F-008/F-010）
### 優先 4: WorkRecordScreen の下書き保存仕様決定・実装（F-005）

---

## タスク登録後一覧表示フロー

**フロー（コード確認済み / 実 Supabase 未確認）:**

```
TaskCreateScreen.handleSubmit
  → window.HoneyDB.saveTask(payload)  ※ id が truthy の場合のみ onSuccess
  → setScreen('work')
  → WorkListScreen マウント
  → useEffect → loadTasks()
  → mapTask() → setDbTasks()
```

ペイロードと tasks スキーマ全列が整合していることをコードで確認済み。

---

## テスト結果サマリー（最終）

| テスト種別 | 期待最低件数 | 実測件数 | 結果 | exit code |
|-----------|------------|---------|------|-----------|
| TypeScript (tsc) | 0 errors | 0 errors | ✅ | 0 |
| ESLint | 0 warnings | 0 warnings | ✅ | 0 |
| Build (vite) | success | success | ✅ | 0 |
| Unit Test (vitest) | 449+追加分 | **466 passed** (+17) | ✅ | 0 |
| Production E2E | 88+追加分 | **88 passed** | ✅ | 0 |
| Smoke | 4 | **4 passed** | ✅ | 0 |
| Dev Visual | 602 / 0 failures | **TBD（実行中）** | — | — |

---

## 環境確認事項

- mock 検証：`window.HoneyDB` インターフェースとの整合確認のみ
- 実 Supabase への保存は未確認（全 23件 「実環境未確認」）
- `--update-snapshots` は実行していません
- `PNG` ファイルの変更・削除・追加はしていません（差分 0件）
- `index.html` は変更していません（差分 0行）
- `migration` ファイルは変更していません
