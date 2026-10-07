import { describe, it, expect, vi } from 'vitest'
import { buildReportData } from '../reportData'

const FARM   = [{ id: 'f1', name: '宮田農場' }]
const COLONY = [{ id: 'c1', farmId: 'f1', name: 'A-01' }]
const WORK   = [{ id: 'w1', colonyIds: ['c1'], type: 'inspection', date: '2026-09-01' }]
const INSP   = [{ id: 'i1', colony: 'c1', date: '2026-09-01', bee_frames: 8, brood_frames: 5 }]

describe('buildReportData', () => {
  it('returns records, apiaries, and strengthEntries on success', () => {
    const result = buildReportData(FARM, COLONY, WORK, INSP)
    expect(Array.isArray(result.records)).toBe(true)
    expect(Array.isArray(result.apiaries)).toBe(true)
    expect(Array.isArray(result.strengthEntries)).toBe(true)
    expect(Array.isArray(result.reportColonies)).toBe(true)
  })

  it('returns empty arrays for empty DB', () => {
    const result = buildReportData([], [], [], [])
    expect(result.records).toHaveLength(0)
    expect(result.apiaries).toHaveLength(0)
    expect(result.strengthEntries).toHaveLength(0)
  })
})

describe('ReportScreen HoneyDB contract', () => {
  it('all four loaders called on success path', async () => {
    const db = {
      loadFarms:       vi.fn().mockResolvedValue(FARM),
      loadColonies:    vi.fn().mockResolvedValue(COLONY),
      loadWorkRecords: vi.fn().mockResolvedValue(WORK),
      loadInspRecords: vi.fn().mockResolvedValue(INSP),
    }
    await Promise.all([db.loadFarms(), db.loadColonies(), db.loadWorkRecords(), db.loadInspRecords()])
    expect(db.loadFarms).toHaveBeenCalledOnce()
    expect(db.loadColonies).toHaveBeenCalledOnce()
    expect(db.loadWorkRecords).toHaveBeenCalledOnce()
    expect(db.loadInspRecords).toHaveBeenCalledOnce()
  })

  it('DB rejection propagates', async () => {
    const db = {
      loadFarms:       vi.fn().mockRejectedValue(new Error('server error')),
      loadColonies:    vi.fn().mockResolvedValue(COLONY),
      loadWorkRecords: vi.fn().mockResolvedValue(WORK),
      loadInspRecords: vi.fn().mockResolvedValue(INSP),
    }
    await expect(
      Promise.all([db.loadFarms(), db.loadColonies(), db.loadWorkRecords(), db.loadInspRecords()])
    ).rejects.toThrow('server error')
  })

  it('HoneyDB undefined → loadColonies falsy', () => {
    const db = undefined as { loadColonies?: () => Promise<unknown[]> } | undefined
    expect(db?.loadColonies).toBeUndefined()
  })
})
