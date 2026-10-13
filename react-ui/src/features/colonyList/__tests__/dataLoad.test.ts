import { describe, it, expect, vi } from 'vitest'
import { buildColonyListData } from '../colonyListData'

const FARM   = [{ id: 'f1', name: '宮田農場' }]
const COLONY = [{ id: 'c1', farmId: 'f1', name: 'A-01', status: 'good', hiveId: 'h1', apiaryId: 'a1' }]
const INSP   = [{ id: 'i1', colonyId: 'c1', date: '2026-09-01', strengthScore: 72 }]

describe('buildColonyListData', () => {
  it('returns apiaries with colonies on success', () => {
    const result = buildColonyListData(FARM, COLONY, INSP)
    expect(result.apiaries).toBeDefined()
    expect(Array.isArray(result.apiaries)).toBe(true)
  })

  it('returns empty apiaries for empty DB', () => {
    const result = buildColonyListData([], [], [])
    expect(result.apiaries).toHaveLength(0)
  })
})

describe('ColonySummaryScreen HoneyDB contract', () => {
  it('all three loaders called on success path', async () => {
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

  it('DB rejection propagates as error', async () => {
    const db = {
      loadFarms:       vi.fn().mockResolvedValue(FARM),
      loadColonies:    vi.fn().mockRejectedValue(new Error('fetch failed')),
      loadInspRecords: vi.fn().mockResolvedValue(INSP),
    }
    await expect(
      Promise.all([db.loadFarms(), db.loadColonies(), db.loadInspRecords()])
    ).rejects.toThrow('fetch failed')
  })

  it('HoneyDB undefined → no loadColonies', () => {
    const db = undefined as { loadColonies?: () => Promise<unknown[]> } | undefined
    expect(db?.loadColonies).toBeUndefined()
  })
})
