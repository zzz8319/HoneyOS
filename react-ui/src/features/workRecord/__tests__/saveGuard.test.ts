/**
 * Unit tests for WorkRecordScreen save guard logic (post-fix behaviour).
 * After the #3 bug fix: no colony / no saveWorkRecord → error, not success.
 */
import { describe, it, expect, vi } from 'vitest'

// Mirrors the fixed save handler logic in WorkRecordScreen.tsx
async function runSaveFlowFixed(
  db: { saveWorkRecord?: (p: Record<string, unknown>) => Promise<void> } | undefined,
  colony: { id: string } | null,
  payload: Record<string, unknown>,
  setSaveError: (msg: string | null) => void,
  onSuccess: () => void,
) {
  setSaveError(null)
  if (db?.saveWorkRecord && colony) {
    try {
      await db.saveWorkRecord({ colony: colony.id, ...payload })
      onSuccess()
      return
    } catch {
      setSaveError('保存に失敗しました。もう一度お試しください。')
      return
    }
  }
  // Fixed: no colony or no saveWorkRecord → error, not success
  if (!colony) {
    setSaveError('蜂群を選択してください。')
  } else {
    setSaveError('保存機能が利用できません。アプリを再読み込みしてください。')
  }
}

describe('WorkRecordScreen save guard (post-fix)', () => {
  it('colony未選択 → onSuccess呼ばれない・エラーメッセージ設定', async () => {
    const db = { saveWorkRecord: vi.fn() }
    const onSuccess = vi.fn()
    const setSaveError = vi.fn()
    await runSaveFlowFixed(db, null, {}, setSaveError, onSuccess)
    expect(onSuccess).not.toHaveBeenCalled()
    expect(setSaveError).toHaveBeenCalledWith('蜂群を選択してください。')
  })

  it('saveWorkRecord未定義 → onSuccess呼ばれない・エラーメッセージ設定', async () => {
    const db = {} // saveWorkRecord intentionally absent
    const onSuccess = vi.fn()
    const setSaveError = vi.fn()
    const colony = { id: 'col-1' }
    await runSaveFlowFixed(db, colony, {}, setSaveError, onSuccess)
    expect(onSuccess).not.toHaveBeenCalled()
    expect(setSaveError).toHaveBeenCalledWith('保存機能が利用できません。アプリを再読み込みしてください。')
  })

  it('saveWorkRecord未定義かつcolony未選択 → エラー (colony側のエラーが優先)', async () => {
    const db = {}
    const onSuccess = vi.fn()
    const setSaveError = vi.fn()
    await runSaveFlowFixed(db, null, {}, setSaveError, onSuccess)
    expect(onSuccess).not.toHaveBeenCalled()
    expect(setSaveError).toHaveBeenCalledWith('蜂群を選択してください。')
  })

  it('HoneyDB未初期化 (db=undefined) かつcolony選択済み → onSuccess呼ばれない', async () => {
    const onSuccess = vi.fn()
    const setSaveError = vi.fn()
    const colony = { id: 'col-1' }
    await runSaveFlowFixed(undefined, colony, {}, setSaveError, onSuccess)
    expect(onSuccess).not.toHaveBeenCalled()
    expect(setSaveError).toHaveBeenCalledWith('保存機能が利用できません。アプリを再読み込みしてください。')
  })

  it('正常系: colony選択済み + saveWorkRecord有効 → onSuccess呼ばれる', async () => {
    const db = { saveWorkRecord: vi.fn().mockResolvedValue(undefined) }
    const onSuccess = vi.fn()
    const setSaveError = vi.fn()
    const colony = { id: 'col-1' }
    await runSaveFlowFixed(db, colony, {}, setSaveError, onSuccess)
    expect(onSuccess).toHaveBeenCalledOnce()
    expect(db.saveWorkRecord).toHaveBeenCalledOnce()
  })
})
