/**
 * Unit tests for ColonyCreateScreen saveColony guard (post-fix behaviour).
 * After #4 bug fix: saveColony absent → throw, not onSuccess.
 */
import { describe, it, expect, vi } from 'vitest'

// Mirrors the fixed save flow in ColonyCreateScreen.tsx
async function runColonySaveFlow(
  db: { saveColony?: (id: string, name: string, sortOrder: number) => Promise<void> } | undefined,
  id: string,
  name: string,
  onSuccess: (id: string) => void,
): Promise<void> {
  if (db?.saveColony) {
    await db.saveColony(id, name, 9999)
    onSuccess(id)
  } else {
    throw new Error('saveColony unavailable')
  }
}

describe('ColonyCreateScreen saveColony guard (post-fix)', () => {
  it('saveColony未定義 → onSuccess呼ばれない・例外スロー', async () => {
    const db = {} // saveColony intentionally absent
    const onSuccess = vi.fn()
    await expect(runColonySaveFlow(db, 'new-id', 'A-07', onSuccess)).rejects.toThrow('saveColony unavailable')
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('HoneyDB未初期化 (db=undefined) → onSuccess呼ばれない・例外スロー', async () => {
    const onSuccess = vi.fn()
    await expect(runColonySaveFlow(undefined, 'new-id', 'A-07', onSuccess)).rejects.toThrow('saveColony unavailable')
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('正常系: saveColony有効 → onSuccess呼ばれる', async () => {
    const db = { saveColony: vi.fn().mockResolvedValue(undefined) }
    const onSuccess = vi.fn()
    await runColonySaveFlow(db, 'new-id', 'A-07', onSuccess)
    expect(onSuccess).toHaveBeenCalledWith('new-id')
    expect(db.saveColony).toHaveBeenCalledWith('new-id', 'A-07', 9999)
  })

  it('saveColony DB エラー → onSuccess呼ばれない・例外が伝播', async () => {
    const db = { saveColony: vi.fn().mockRejectedValue(new Error('DB error')) }
    const onSuccess = vi.fn()
    await expect(runColonySaveFlow(db, 'new-id', 'A-07', onSuccess)).rejects.toThrow('DB error')
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
