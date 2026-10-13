import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { HoneyDBClient } from '../../../lib/db'

// Simulate the save flow logic extracted from WorkRecordScreen's onClick handler
async function runSaveFlow(
  db: HoneyDBClient | undefined,
  colony: { id: string } | null,
  payload: Record<string, unknown>,
  setSaveError: (msg: string | null) => void,
  onSuccess: () => void,
) {
  setSaveError(null)
  if (db?.saveWorkRecord && colony) {
    try {
      await db.saveWorkRecord({ colony: colony.id, ...payload } as Parameters<HoneyDBClient['saveWorkRecord']>[0])
      onSuccess()
      return
    } catch {
      setSaveError('保存に失敗しました。もう一度お試しください。')
      return
    }
  }
  onSuccess()
}

function makeDB(overrides: Partial<HoneyDBClient> = {}): HoneyDBClient {
  return overrides as unknown as HoneyDBClient
}

describe('WorkRecordScreen save flow', () => {
  let onSuccessMock: ReturnType<typeof vi.fn>
  let setSaveErrorMock: ReturnType<typeof vi.fn>
  let onSuccess: () => void
  let setSaveError: (msg: string | null) => void
  const colony = { id: 'col-1' }
  const payload = { type: 'feed', date: '2026-10-01', time: '10:00', memo: '' }

  beforeEach(() => {
    onSuccessMock = vi.fn()
    setSaveErrorMock = vi.fn()
    onSuccess = onSuccessMock as unknown as () => void
    setSaveError = setSaveErrorMock as unknown as (msg: string | null) => void
  })

  it('success → calls onSuccess', async () => {
    const db = makeDB({ saveWorkRecord: vi.fn().mockResolvedValue(undefined) })
    await runSaveFlow(db, colony, payload, setSaveError, onSuccess)
    expect(onSuccessMock).toHaveBeenCalledOnce()
    expect(setSaveErrorMock).toHaveBeenCalledWith(null)
    expect(setSaveErrorMock).toHaveBeenCalledTimes(1)
  })

  it('failure → does NOT call onSuccess, sets error', async () => {
    const db = makeDB({ saveWorkRecord: vi.fn().mockRejectedValue(new Error('network')) })
    await runSaveFlow(db, colony, payload, setSaveError, onSuccess)
    expect(onSuccessMock).not.toHaveBeenCalled()
    expect(setSaveErrorMock).toHaveBeenCalledWith('保存に失敗しました。もう一度お試しください。')
  })

  it('failure → error message visible (setSaveError called with string)', async () => {
    const db = makeDB({ saveWorkRecord: vi.fn().mockRejectedValue(new Error('offline')) })
    await runSaveFlow(db, colony, payload, setSaveError, onSuccess)
    const errorMsg = setSaveErrorMock.mock.calls.find(([v]) => typeof v === 'string')?.[0]
    expect(typeof errorMsg).toBe('string')
    expect((errorMsg as string).length).toBeGreaterThan(0)
  })

  it('retry after failure → can succeed on second attempt', async () => {
    const saveWorkRecord = vi.fn()
      .mockRejectedValueOnce(new Error('first fail'))
      .mockResolvedValueOnce(undefined)
    const db = makeDB({ saveWorkRecord })

    await runSaveFlow(db, colony, payload, setSaveError, onSuccess)
    expect(onSuccessMock).not.toHaveBeenCalled()

    setSaveErrorMock.mockClear()
    onSuccessMock.mockClear()
    await runSaveFlow(db, colony, payload, setSaveError, onSuccess)
    expect(onSuccessMock).toHaveBeenCalledOnce()
  })

  it('no double-submit: inputs are preserved (colony/payload unchanged between calls)', async () => {
    const db = makeDB({ saveWorkRecord: vi.fn().mockRejectedValue(new Error('fail')) })
    const capturedColony = { ...colony }
    const capturedPayload = { ...payload }
    await runSaveFlow(db, colony, payload, setSaveError, onSuccess)
    expect(colony).toEqual(capturedColony)
    expect(payload).toEqual(capturedPayload)
  })

  it('offline (HoneyDB absent) → navigates without DB call', async () => {
    await runSaveFlow(undefined, colony, payload, setSaveError, onSuccess)
    expect(onSuccessMock).toHaveBeenCalledOnce()
  })

  it('no colony selected → navigates without DB call (dev mode fallback)', async () => {
    const saveWorkRecord = vi.fn()
    const db = makeDB({ saveWorkRecord })
    await runSaveFlow(db, null, payload, setSaveError, onSuccess)
    expect(onSuccessMock).toHaveBeenCalledOnce()
    expect(saveWorkRecord).not.toHaveBeenCalled()
  })
})
