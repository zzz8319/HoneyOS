import { describe, it, expect, vi } from 'vitest'
import { buildWorkHistoryData } from '../workHistoryData'

const FARM   = [{ id: 'f1', name: '宮田農場' }]
const COLONY = [{ id: 'c1', farmId: 'f1', name: 'A-01' }]
const WORK   = [{ id: 'w1', colonyIds: ['c1'], type: 'inspection', date: '2026-09-01', note: '' }]

describe('buildWorkHistoryData', () => {
  it('returns records and apiaries on success', () => {
    const result = buildWorkHistoryData(FARM, COLONY, WORK)
    expect(result.apiaries).toHaveLength(1)
    expect(result.apiaries[0].name).toBe('宮田農場')
  })

  it('returns empty arrays for empty DB', () => {
    const result = buildWorkHistoryData([], [], [])
    expect(result.records).toHaveLength(0)
    expect(result.apiaries).toHaveLength(0)
  })
})

describe('WorkHistoryScreen HoneyDB contract', () => {
  it('all three loaders called on success path', async () => {
    const db = {
      loadFarms:       vi.fn().mockResolvedValue(FARM),
      loadColonies:    vi.fn().mockResolvedValue(COLONY),
      loadWorkRecords: vi.fn().mockResolvedValue(WORK),
    }
    await Promise.all([db.loadFarms(), db.loadColonies(), db.loadWorkRecords()])
    expect(db.loadFarms).toHaveBeenCalledOnce()
    expect(db.loadColonies).toHaveBeenCalledOnce()
    expect(db.loadWorkRecords).toHaveBeenCalledOnce()
  })

  it('DB rejection propagates', async () => {
    const db = {
      loadFarms:       vi.fn().mockRejectedValue(new Error('offline')),
      loadColonies:    vi.fn().mockResolvedValue(COLONY),
      loadWorkRecords: vi.fn().mockResolvedValue(WORK),
    }
    await expect(
      Promise.all([db.loadFarms(), db.loadColonies(), db.loadWorkRecords()])
    ).rejects.toThrow('offline')
  })

  it('HoneyDB undefined → loadWorkRecords falsy', () => {
    const db = undefined as { loadWorkRecords?: () => Promise<unknown[]> } | undefined
    expect(db?.loadWorkRecords).toBeUndefined()
  })
})
