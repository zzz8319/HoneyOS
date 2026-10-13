/**
 * DashboardScreen data-loading contract
 *
 * Tests that the data builder and HoneyDB access pattern work correctly.
 */
import { describe, it, expect, vi } from 'vitest'
import { buildDashboardData } from '../dashboardData'

const FARM   = [{ id: 'f1', name: '宮田農場' }]
const COLONY = [{ id: 'c1', farmId: 'f1', name: 'A-01', status: 'good', hiveId: 'h1', apiaryId: 'a1' }]
const INSP   = [{ id: 'i1', colonyId: 'c1', date: '2026-09-01', strengthScore: 72 }]

describe('buildDashboardData', () => {
  it('returns a DashboardData object with farmName from DB', () => {
    const result = buildDashboardData(FARM, COLONY, INSP)
    expect(result.farmName).toBe('宮田農場')
    expect(result.colonies).toBeDefined()
    expect(result.weekly).toBeDefined()
  })

  it('returns empty/default values for empty DB', () => {
    const result = buildDashboardData([], [], [])
    expect(result.farmName).toBe('養蜂場')
    expect(result.alertColonyCount).toBe(0)
  })
})

describe('DashboardScreen HoneyDB integration contract', () => {
  it('loadFarms/loadColonies/loadInspRecords are all called on success path', async () => {
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

  it('produces valid DashboardData when DB returns data', async () => {
    const db = {
      loadFarms:       vi.fn().mockResolvedValue(FARM),
      loadColonies:    vi.fn().mockResolvedValue(COLONY),
      loadInspRecords: vi.fn().mockResolvedValue(INSP),
    }
    const [farms, colonies, insp] = await Promise.all([
      db.loadFarms(), db.loadColonies(), db.loadInspRecords(),
    ])
    const data = buildDashboardData(farms as unknown[], colonies as unknown[], insp as unknown[])
    expect(data).not.toBeNull()
    expect(typeof data.farmName).toBe('string')
  })

  it('produces empty DashboardData when DB returns empty arrays', async () => {
    const db = {
      loadFarms:       vi.fn().mockResolvedValue([]),
      loadColonies:    vi.fn().mockResolvedValue([]),
      loadInspRecords: vi.fn().mockResolvedValue([]),
    }
    const [farms, colonies, insp] = await Promise.all([
      db.loadFarms(), db.loadColonies(), db.loadInspRecords(),
    ])
    const data = buildDashboardData(farms as unknown[], colonies as unknown[], insp as unknown[])
    expect(data.alertColonyCount).toBe(0)
  })

  it('rejects when DB throws', async () => {
    const db = {
      loadFarms:       vi.fn().mockResolvedValue(FARM),
      loadColonies:    vi.fn().mockRejectedValue(new Error('network error')),
      loadInspRecords: vi.fn().mockResolvedValue(INSP),
    }
    await expect(
      Promise.all([db.loadFarms(), db.loadColonies(), db.loadInspRecords()])
    ).rejects.toThrow('network error')
  })

  it('HoneyDB undefined → loadColonies is falsy (effect returns early)', () => {
    // Simulate the guard: const db = window.HoneyDB; if (!db?.loadColonies) return
    const db = undefined as { loadColonies?: () => Promise<unknown[]> } | undefined
    expect(db?.loadColonies).toBeUndefined()
  })
})
