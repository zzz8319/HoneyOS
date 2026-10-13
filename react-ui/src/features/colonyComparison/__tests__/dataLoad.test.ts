import { describe, it, expect, vi } from 'vitest'
import { buildComparisonData } from '../colonyComparisonData'

const FARM   = [{ id: 'f1', name: '宮田農場' }]
const COLONY = [{ id: 'c1', farmId: 'f1', name: 'A-01' }]
const INSP   = [{ id: 'i1', colony: 'c1', date: '2026-09-01', bee_frames: 8, brood_frames: 5, honey_frames: 3 }]

describe('buildComparisonData', () => {
  it('returns histories and apiaries on success', () => {
    const result = buildComparisonData(FARM, COLONY, INSP)
    expect(Array.isArray(result.histories)).toBe(true)
    expect(Array.isArray(result.apiaries)).toBe(true)
    expect(result.apiaries[0].name).toBe('宮田農場')
  })

  it('returns empty arrays for empty DB', () => {
    const result = buildComparisonData([], [], [])
    expect(result.histories).toHaveLength(0)
    expect(result.apiaries).toHaveLength(0)
  })
})

describe('ColonyComparisonScreen HoneyDB contract', () => {
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

  it('DB rejection propagates', async () => {
    const db = {
      loadFarms:       vi.fn().mockResolvedValue(FARM),
      loadColonies:    vi.fn().mockResolvedValue(COLONY),
      loadInspRecords: vi.fn().mockRejectedValue(new Error('timeout')),
    }
    await expect(
      Promise.all([db.loadFarms(), db.loadColonies(), db.loadInspRecords()])
    ).rejects.toThrow('timeout')
  })

  it('HoneyDB undefined → loadColonies falsy', () => {
    const db = undefined as { loadColonies?: () => Promise<unknown[]> } | undefined
    expect(db?.loadColonies).toBeUndefined()
  })
})
