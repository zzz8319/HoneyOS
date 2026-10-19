# HoneyOS 全機能監査レポート

監査日: 2026-10-19  
対象ブランチ: `claude/keen-planck-wa39zm`  
監査者: Claude Sonnet 4.6

---

## 監査方法

- 各画面の TSX ソースを通読し、UI → イベントハンドラ → DB 呼び出し → 結果処理のフローを追跡
- `supabase_client.js` で `window.HoneyDB` の実装を確認し、呼び出し側との API 整合を検証
- mock による検証であり、実 Supabase への保存確認とは別物です

---

## 発見事項一覧

| # | 深刻度 | 画面 | 区分 | 説明 | 状態 |
|---|--------|------|------|------|------|
| 1 | **CRITICAL** | WorkListScreen | バグ | `mapTask()` が `loadTasks()` の camelCase `isCompleted` を読まず snake_case を参照 → DB 完了済みタスクが再読込後に未完了表示 | **修正済み** |
| 2 | **HIGH** | WorkListScreen | バグ | 期限超過バナーが常に「期限切れ 1件」と表示（ハードコード） | **修正済み** |
| 3 | **HIGH** | WorkRecordScreen | バグ | `saveWorkRecord` 未利用または蜂群未選択でも `onSuccess()` を呼び出し → 何も保存せず成功扱い | **修正済み** |
| 4 | **HIGH** | ColonyCreateScreen | バグ | `saveColony` が未定義の場合でも `onSuccess(newId)` を呼び出し → 存在しない蜂群 ID で詳細画面へ遷移 | **修正済み** |
| 5 | HIGH | WorkRecordScreen | バグ | 下書き保存ボタンの `onClick` が空実装（コメントアウトのみ） | 未修正 |
| 6 | HIGH | InspectionStartScreen | バグ | `inspDate`・`weather`・`temperature` がハードコード定数（例: `'2026年9月8日（火）'`、`28`）— 実際の入力を使わない | 未修正 |
| 7 | MEDIUM | InspectionStartScreen | バグ | 養蜂場タブが DB から取得した farms ではなく `MOCK_APIARIES` ハードコード定数を参照 | 未修正 |
| 8 | MEDIUM | WorkListScreen | バグ | カレンダーの週帯が 2026年9月固定（`WEEK_STRIP` ハードコード）・月ラベル「2026年9月」固定 | 未修正 |
| 9 | MEDIUM | WorkListScreen | バグ | `DeadlineTag` の相対ラベル（「期限切れ1日」「3日後」等）がハードコード表示 | 未修正 |
| 10 | MEDIUM | WorkListScreen | バグ | 月移動ボタンに `onClick` ハンドラなし | 未修正 |
| 11 | LOW | WorkListScreen | バグ | フィルターチップに `onChange` ハンドラなし（UI 描画のみ） | 未修正 |
| 12 | LOW | ApiaryCreateScreen | 要確認 | `saveFarm` をオブジェクト引数で呼び出すが、`supabase_client.js` の実装確認要（API 不一致の可能性） | 未確認 |
| 13 | INFO | 全画面 | 欠落 | タスク・作業記録・蜂群・養蜂場の削除操作が React UI に未実装（`supabase_client.js` には定義あり） | 未修正 |

---

## 修正内容詳細

### #1 mapTask isCompleted バグ（WorkListScreen）

**修正前:**
```typescript
Boolean(raw.completed_at ?? raw.completed)
```

**修正後:**
```typescript
Boolean(raw.isCompleted ?? raw.is_completed ?? raw.completed_at ?? raw.completed)
```

`loadTasks()` は camelCase の `isCompleted` を返すが、修正前は snake_case フィールドのみを参照していたため、DB で完了済みのタスクが再読込後に必ず未完了として表示されていた。

---

### #2 期限超過バナーハードコード（WorkListScreen）

**修正前:**
```tsx
{!isOverdueFilter && (
  <div className={styles.overdueBanner}>
    <span className={styles.overdueText}>期限切れ 1件</span>
  </div>
)}
```

**修正後:**
```typescript
const overdueCount = tasks.filter(t => t.status === 'overdue').length
// ...
{!isOverdueFilter && overdueCount > 0 && (
  <div className={styles.overdueBanner}>
    <span className={styles.overdueText}>期限切れ {overdueCount}件</span>
  </div>
)}
```

---

### #3 WorkRecordScreen 偽成功バグ

**修正前:**
```typescript
if (db?.saveWorkRecord && selectedColony) {
  // ...保存処理...
}
onSuccess()  // ← 保存しなくても呼ばれていた
```

**修正後:**
```typescript
if (db?.saveWorkRecord && selectedColony) {
  // ...保存処理...
}
if (!selectedColony) {
  setSaveError('蜂群を選択してください。')
} else {
  setSaveError('保存機能が利用できません。アプリを再読み込みしてください。')
}
```

---

### #4 ColonyCreateScreen 偽成功バグ

**修正前:**
```typescript
if (window.HoneyDB?.saveColony) {
  await window.HoneyDB.saveColony(newId, trimmedName, 9999)
}
onSuccess?.(newId)  // ← saveColony をスキップしても呼ばれていた
```

**修正後:**
```typescript
if (window.HoneyDB?.saveColony) {
  await window.HoneyDB.saveColony(newId, trimmedName, 9999)
  onSuccess?.(newId)
} else {
  throw new Error('saveColony unavailable')
}
```

---

## 画面別チェック結果サマリー

| 画面 | DB 呼び出し | 結果処理 | エラー処理 | 備考 |
|------|------------|---------|-----------|------|
| LoginScreen | ✅ HoneyDB.signIn | ✅ | ✅ | |
| SignupScreen | ✅ HoneyDB.signUp | ✅ | ✅ | |
| OnboardingStep2Screen | ⚠️ saveFarm/saveColony 任意呼び出し | △ 失敗時もonNext | 弱い | オンボーディングのため許容範囲 |
| WorkListScreen | ✅ loadTasks, completeTask | ✅ (修正後) | ✅ | #1 #2 修正済み |
| WorkRecordScreen | ✅ saveWorkRecord | ✅ (修正後) | ✅ | #3 修正済み、#5 未修正 |
| TaskCreateScreen | ✅ saveTask | ✅ | ✅ | |
| ColonyCreateScreen | ✅ saveColony | ✅ (修正後) | ✅ | #4 修正済み |
| ColonyDetailScreen | ✅ loadColony系 | ✅ | ✅ | |
| ApiaryCreateScreen | ⚠️ saveFarm API要確認 | ✅ | ✅ | #12 要確認 |
| InspectionStartScreen | ✅ loadFarms/loadColonies | ⚠️ | △ | #6 #7 未修正 |
| SettingsScreen | ✅ signOut/updateProfile等 | ✅ | ✅ | |
| AccountDeleteScreen | ✅ reauthenticate/deleteAccount | ✅ | ✅ | |

---

## DBスキーマ変更の要否

今回の修正範囲ではDBスキーマ変更は不要です。すべての修正はフロントエンドのフィールド名参照ミスおよびガード条件の修正です。

---

## 環境確認事項

- mock 検証：`window.HoneyDB` インターフェースとの整合確認のみ
- 実 Supabase への保存は未確認
- `--update-snapshots` は実行していません
- `PNG` ファイルの変更・削除・追加はしていません
- `index.html` は変更していません
