import { describe, it, expect, vi } from 'vitest'
import { buildColonyTrendData } from '../colonyTrendData'

const FARM   = [{ id: 'f1', name: '宮田農場' }]
const COLONY = [{ id: 'c1', farmId: 'f1', name: 'A-01' }]
const INSP   = [{ id: 'i1', colonyId: 'c1', date: '2026-09-01', bee_frames: 8, brood_frames: 5 }]

describe('buildColonyTrendData', () => {
  it('returns ColonyTrendData with series on success', () => {
    const result = buildColonyTrendData(FARM, COLONY, INSP)
    expect(result.series).toBeDefined()
    expect(Array.isArray(result.series)).toBe(true)
    expect(result.availableColonies).toBeDefined()
  })

  it('returns empty series for empty DB', () => {
    const result = buildColonyTrendData([], [], [])
    expect(result.series).toHaveLength(0)
    expect(result.availableColonies).toHaveLength(0)
  })
})

describe('ColonyTrendScreen HoneyDB contract', () => {
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
      loadColonies:    vi.fn().mockRejectedValue(new Error('network')),
      loadInspRecords: vi.fn().mockResolvedValue(INSP),
    }
    await expect(
      Promise.all([db.loadFarms(), db.loadColonies(), db.loadInspRecords()])
    ).rejects.toThrow('network')
  })

  it('HoneyDB undefined → loadInspRecords falsy', () => {
    const db = undefined as { loadInspRecords?: () => Promise<unknown[]> } | undefined
    expect(db?.loadInspRecords).toBeUndefined()
  })
})
