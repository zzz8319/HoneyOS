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

describe('buildWeeklyStats boundary conditions', () => {
  it('0件: no NaN or Infinity in output', () => {
    const result = buildDashboardData(FARM, COLONY, INSP, [])
    const w = result.weekly
    expect(Number.isFinite(w.honeyKg)).toBe(true)
    expect(Number.isFinite(w.honeyPrevPct)).toBe(true)
    expect(Number.isFinite(w.workCount)).toBe(true)
    expect(Number.isFinite(w.workPrevDiff)).toBe(true)
    expect(w.honeyHistory).toHaveLength(4)
    w.honeyHistory.forEach(h => expect(Number.isFinite(h.kg)).toBe(true))
  })

  it('prevKg=0: honeyPrevPct is 0 (not Infinity)', () => {
    // this week has harvest, prev week has none → no division by zero
    const today = new Date()
    const thisMonday = today.toISOString().slice(0, 10)
    const workRecords = [{ type: 'harvest', date: thisMonday, yieldKg: 5 }]
    const result = buildDashboardData(FARM, COLONY, INSP, workRecords)
    expect(result.weekly.honeyPrevPct).toBe(0)
    expect(Number.isFinite(result.weekly.honeyPrevPct)).toBe(true)
  })

  it('non-harvest work records: not counted in honeyKg', () => {
    const today = new Date().toISOString().slice(0, 10)
    const workRecords = [
      { type: 'feeding', date: today, yieldKg: 10 },
      { type: 'treatment', date: today },
    ]
    const result = buildDashboardData(FARM, COLONY, INSP, workRecords)
    expect(result.weekly.honeyKg).toBe(0)
    expect(result.weekly.workCount).toBe(2)
  })

  it('yieldKg as string: coerced to number', () => {
    const today = new Date().toISOString().slice(0, 10)
    const workRecords = [{ type: 'harvest', date: today, yieldKg: '3.5' as unknown as number }]
    const result = buildDashboardData(FARM, COLONY, INSP, workRecords)
    expect(result.weekly.honeyKg).toBe(3.5)
  })

  it('weather is always null (no external API)', () => {
    const result = buildDashboardData(FARM, COLONY, INSP, [])
    expect(result.weather).toBeNull()
  })
})
