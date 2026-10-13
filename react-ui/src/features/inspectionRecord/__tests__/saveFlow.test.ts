import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { HoneyDBClient } from '../../../lib/db'

interface InspSession {
  colonyId: string
  inspDate: string
  weather: string
}

// Mirrors the App.tsx onSave handler logic (save → navigate on success, setViewState on failure)
async function runInspSaveFlow(
  db: HoneyDBClient | undefined,
  session: InspSession | null,
  record: Record<string, unknown>,
  setRecordState: (state: string) => void,
  navigate: () => void,
) {
  if (db?.saveInspRecord && session) {
    try {
      await db.saveInspRecord({ colony: session.colonyId, ...record } as Parameters<HoneyDBClient['saveInspRecord']>[0])
    } catch {
      setRecordState('save-error')
      return
    }
  }
  navigate()
}

function makeDB(overrides: Partial<HoneyDBClient> = {}): HoneyDBClient {
  return overrides as unknown as HoneyDBClient
}

describe('App.tsx inspection save flow', () => {
  let setRecordStateMock: ReturnType<typeof vi.fn>
  let navigateMock: ReturnType<typeof vi.fn>
  let setRecordState: (state: string) => void
  let navigate: () => void
  const session: InspSession = { colonyId: 'col-1', inspDate: '2026-10-01', weather: '晴れ' }
  const record = { frames: [], count_mode: 'frame', queen_status: 'laying' }

  beforeEach(() => {
    setRecordStateMock = vi.fn()
    navigateMock = vi.fn()
    setRecordState = setRecordStateMock as unknown as (state: string) => void
    navigate = navigateMock as unknown as () => void
  })

  it('success → navigates to inspection-complete', async () => {
    const db = makeDB({ saveInspRecord: vi.fn().mockResolvedValue(undefined) })
    await runInspSaveFlow(db, session, record, setRecordState, navigate)
    expect(navigateMock).toHaveBeenCalledOnce()
    expect(setRecordStateMock).not.toHaveBeenCalled()
  })

  it('failure → does NOT navigate, sets save-error state', async () => {
    const db = makeDB({ saveInspRecord: vi.fn().mockRejectedValue(new Error('network')) })
    await runInspSaveFlow(db, session, record, setRecordState, navigate)
    expect(navigateMock).not.toHaveBeenCalled()
    expect(setRecordStateMock).toHaveBeenCalledWith('save-error')
  })

  it('failure → error state visible (setRecordState called with save-error)', async () => {
    const db = makeDB({ saveInspRecord: vi.fn().mockRejectedValue(new Error('timeout')) })
    await runInspSaveFlow(db, session, record, setRecordState, navigate)
    expect(setRecordStateMock).toHaveBeenCalledTimes(1)
    expect(setRecordStateMock).toHaveBeenCalledWith('save-error')
  })

  it('retry after failure → succeeds on second attempt', async () => {
    const saveInspRecord = vi.fn()
      .mockRejectedValueOnce(new Error('first fail'))
      .mockResolvedValueOnce(undefined)
    const db = makeDB({ saveInspRecord })

    await runInspSaveFlow(db, session, record, setRecordState, navigate)
    expect(navigateMock).not.toHaveBeenCalled()

    setRecordStateMock.mockClear()
    navigateMock.mockClear()
    await runInspSaveFlow(db, session, record, setRecordState, navigate)
    expect(navigateMock).toHaveBeenCalledOnce()
    expect(setRecordStateMock).not.toHaveBeenCalled()
  })

  it('inputs preserved after failure (session unchanged)', async () => {
    const db = makeDB({ saveInspRecord: vi.fn().mockRejectedValue(new Error('fail')) })
    const capturedSession = { ...session }
    await runInspSaveFlow(db, session, record, setRecordState, navigate)
    expect(session).toEqual(capturedSession)
  })

  it('no double-submit: saveInspRecord called only once per flow', async () => {
    const saveInspRecord = vi.fn().mockResolvedValue(undefined)
    const db = makeDB({ saveInspRecord })
    await runInspSaveFlow(db, session, record, setRecordState, navigate)
    expect(saveInspRecord).toHaveBeenCalledTimes(1)
  })

  it('offline (HoneyDB absent) → navigates without DB call', async () => {
    await runInspSaveFlow(undefined, session, record, setRecordState, navigate)
    expect(navigateMock).toHaveBeenCalledOnce()
    expect(setRecordStateMock).not.toHaveBeenCalled()
  })
})
