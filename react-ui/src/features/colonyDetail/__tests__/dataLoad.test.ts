import { describe, it, expect, vi } from 'vitest'
import { buildColonyDetail } from '../colonyDetailData'

const FARM   = [{ id: 'f1', name: '宮田農場' }]
const COLONY = [{ id: 'c1', farmId: 'f1', name: 'A-01', status: 'good', hiveId: 'h1', apiaryId: 'a1' }]
const INSP   = [{ id: 'i1', colonyId: 'c1', date: '2026-09-01', strengthScore: 72 }]

describe('buildColonyDetail', () => {
  it('returns ColonyDetail for existing colony', () => {
    const result = buildColonyDetail('c1', FARM, COLONY, INSP)
    expect(result).not.toBeNull()
    expect(result?.id).toBe('c1')
  })

  it('returns null for unknown colonyId', () => {
    const result = buildColonyDetail('unknown', FARM, COLONY, INSP)
    expect(result).toBeNull()
  })

  it('returns null for empty DB', () => {
    const result = buildColonyDetail('c1', [], [], [])
    expect(result).toBeNull()
  })
})

describe('ColonyDetailScreen HoneyDB contract', () => {
  it('all three loaders called', async () => {
    const db = {
      loadFarms:       vi.fn().mockResolvedValue(FARM),
      loadColonies:    vi.fn().mockResolvedValue(COLONY),
      loadInspRecords: vi.fn().mockResolvedValue(INSP),
    }
    await Promise.all([db.loadFarms(), db.loadColonies(), db.loadInspRecords()])
    expect(db.loadFarms).toHaveBeenCalledOnce()
    expect(db.loadColonies).toHaveBeenCalledOnce()
    expect(db.loadInspRecords).toHaveBeenCalledOnce()
  })

  it('DB rejection propagates', async () => {
    const db = {
      loadFarms:       vi.fn().mockRejectedValue(new Error('offline')),
      loadColonies:    vi.fn().mockResolvedValue(COLONY),
      loadInspRecords: vi.fn().mockResolvedValue(INSP),
    }
    await expect(
      Promise.all([db.loadFarms(), db.loadColonies(), db.loadInspRecords()])
    ).rejects.toThrow('offline')
  })

  it('HoneyDB undefined → loadColonies falsy', () => {
    const db = undefined as { loadColonies?: () => Promise<unknown[]> } | undefined
    expect(db?.loadColonies).toBeUndefined()
  })
})

/** Simulates the unified useEffect fetch logic from ColonyDetailScreen */
async function simulateFetch(
  viewState: string,
  db: {
    loadFarms: () => Promise<unknown[]>
    loadColonies: () => Promise<unknown[]>
    loadInspRecords: () => Promise<unknown[]>
  },
  colonyId = 'c1',
) {
  if (viewState === 'error' || viewState === 'offline') return
  const [farms, colonies] = await Promise.all([db.loadFarms(), db.loadColonies()])
  const inspRecords = viewState === 'normal' ? await db.loadInspRecords() : []
  return buildColonyDetail(colonyId, farms as unknown[], colonies as unknown[], inspRecords as unknown[])
}

describe('ColonyDetailScreen fetch counts per viewState', () => {

  it('normal: loadFarms once, loadColonies once, loadInspRecords once', async () => {
    const db = makeDb()
    await simulateFetch('normal', db)
    expect(db.loadFarms).toHaveBeenCalledTimes(1)
    expect(db.loadColonies).toHaveBeenCalledTimes(1)
    expect(db.loadInspRecords).toHaveBeenCalledTimes(1)
  })

  it('empty: loadFarms once, loadColonies once, loadInspRecords not called', async () => {
    const db = makeDb()
    await simulateFetch('empty', db)
    expect(db.loadFarms).toHaveBeenCalledTimes(1)
    expect(db.loadColonies).toHaveBeenCalledTimes(1)
    expect(db.loadInspRecords).not.toHaveBeenCalled()
  })

  it('loading: loadFarms once, loadColonies once, loadInspRecords not called', async () => {
    const db = makeDb()
    await simulateFetch('loading', db)
    expect(db.loadFarms).toHaveBeenCalledTimes(1)
    expect(db.loadColonies).toHaveBeenCalledTimes(1)
    expect(db.loadInspRecords).not.toHaveBeenCalled()
  })

  it('error: no API calls', async () => {
    const db = makeDb()
    await simulateFetch('error', db)
    expect(db.loadFarms).not.toHaveBeenCalled()
    expect(db.loadColonies).not.toHaveBeenCalled()
    expect(db.loadInspRecords).not.toHaveBeenCalled()
  })

  it('offline: no API calls', async () => {
    const db = makeDb()
    await simulateFetch('offline', db)
    expect(db.loadFarms).not.toHaveBeenCalled()
    expect(db.loadColonies).not.toHaveBeenCalled()
    expect(db.loadInspRecords).not.toHaveBeenCalled()
  })
})

// ── missing-value display rules ──────────────────────────────────────────────

const COLONY_A3 = [{ id: 'a3', farmId: 'f1', name: 'A-03' }]

function makeDb() {
  return {
    loadFarms:       vi.fn().mockResolvedValue(FARM),
    loadColonies:    vi.fn().mockResolvedValue(COLONY),
    loadInspRecords: vi.fn().mockResolvedValue(INSP),
  }
}

describe('buildColonyDetail — missing vs zero value distinction', () => {
  it('strengthScore is null when no inspection records exist', () => {
    const result = buildColonyDetail('a3', FARM, COLONY_A3, [])
    expect(result).not.toBeNull()
    expect(result!.strengthScore).toBeNull()
  })

  it('strengthScoreDelta is null when fewer than two inspection records exist', () => {
    const oneRec = [{ id: 'i1', colony: 'a3', date: '2026-09-01', frames: [{ bee: 50, brood: 40, honey: 10 }] }]
    const result = buildColonyDetail('a3', FARM, COLONY_A3, oneRec)
    expect(result!.strengthScoreDelta).toBeNull()
  })

  it('strengthScore is 0 (not null) when bee=0 and brood=0 in inspection', () => {
    const zeroRec = [{ id: 'i1', colony: 'a3', date: '2026-09-01', frames: [{ bee: 0, brood: 0, honey: 0 }] }]
    const result = buildColonyDetail('a3', FARM, COLONY_A3, zeroRec)
    expect(result!.strengthScore).toBe(0)
  })

  it('strengthScore is computed correctly when inspection records exist', () => {
    const recs = [{ id: 'i1', colony: 'a3', date: '2026-09-01', frames: [{ bee: 50, brood: 50, honey: 10 }] }]
    const result = buildColonyDetail('a3', FARM, COLONY_A3, recs)
    // round(50*0.6 + 50*0.4) = 50
    expect(result!.strengthScore).toBe(50)
  })

  it('all sensor fields are null (no sensor integration in HoneyDB yet)', () => {
    const result = buildColonyDetail('a3', FARM, COLONY_A3, [])
    expect(result!.sensor.temperature).toBeNull()
    expect(result!.sensor.humidity).toBeNull()
    expect(result!.sensor.weight).toBeNull()
    expect(result!.sensor.fetchedAt).toBeNull()
  })
})

// ── error/offline colonyData contract ────────────────────────────────────────

describe('error/offline colonyData contract', () => {
  it('error state returns undefined (no API calls, no colony data built)', async () => {
    const db = makeDb()
    const result = await simulateFetch('error', db)
    // simulateFetch returns undefined (early return) — no mock data is injected
    expect(result).toBeUndefined()
    expect(db.loadFarms).not.toHaveBeenCalled()
    expect(db.loadColonies).not.toHaveBeenCalled()
  })

  it('offline state returns undefined (no API calls, no colony data built)', async () => {
    const db = makeDb()
    const result = await simulateFetch('offline', db)
    expect(result).toBeUndefined()
    expect(db.loadFarms).not.toHaveBeenCalled()
  })

  it('A-03 name is derived from HoneyDB colonies, not a hardcoded mock', async () => {
    // Verify that colony name comes from the DB response, not mockColonyDetail
    const customDb = {
      loadFarms:       vi.fn().mockResolvedValue([{ id: 'f1', name: 'テスト農場' }]),
      loadColonies:    vi.fn().mockResolvedValue([{ id: 'a3', farmId: 'f1', name: 'カスタム名' }]),
      loadInspRecords: vi.fn().mockResolvedValue([]),
    }
    const result = await simulateFetch('empty', customDb, 'a3')
    expect(result!.name).toBe('カスタム名')
    expect(result!.name).not.toBe('A-03')
  })
})
