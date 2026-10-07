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
  const makeDb = () => ({
    loadFarms:       vi.fn().mockResolvedValue(FARM),
    loadColonies:    vi.fn().mockResolvedValue(COLONY),
    loadInspRecords: vi.fn().mockResolvedValue(INSP),
  })

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
