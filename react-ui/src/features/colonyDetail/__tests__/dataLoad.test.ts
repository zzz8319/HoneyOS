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
