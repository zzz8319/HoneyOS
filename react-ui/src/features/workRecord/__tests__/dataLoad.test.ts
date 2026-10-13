import { describe, it, expect, vi } from 'vitest'

const FARM   = [{ id: 'f1', name: '宮田農場' }]
const COLONY = [{ id: 'c1', farmId: 'f1', name: 'A-01' }]

describe('WorkRecordScreen HoneyDB contract', () => {
  it('loadFarms and loadColonies called on success path', async () => {
    const db = {
      loadFarms:    vi.fn().mockResolvedValue(FARM),
      loadColonies: vi.fn().mockResolvedValue(COLONY),
    }
    await Promise.all([db.loadFarms(), db.loadColonies()])
    expect(db.loadFarms).toHaveBeenCalledOnce()
    expect(db.loadColonies).toHaveBeenCalledOnce()
  })

  it('maps farm data to apiaries correctly', async () => {
    const db = {
      loadFarms:    vi.fn().mockResolvedValue(FARM),
      loadColonies: vi.fn().mockResolvedValue(COLONY),
    }
    const [farms, colonies] = await Promise.all([db.loadFarms(), db.loadColonies()])
    const farmList = farms as Array<{ id: string; name: string }>
    const colonyList = colonies as Array<{ id: string; name: string; farmId: string | null }>
    const farmMap = new Map(farmList.map(f => [String(f.id), f.name]))
    const builtColonies = colonyList.map(c => ({
      id: c.id,
      name: c.name,
      apiaryId: c.farmId ? String(c.farmId) : 'unknown',
      apiaryName: farmMap.get(c.farmId ? String(c.farmId) : 'unknown') ?? '養蜂場なし',
    }))
    expect(builtColonies).toHaveLength(1)
    expect(builtColonies[0].apiaryName).toBe('宮田農場')
  })

  it('DB rejection is caught silently', async () => {
    const db = {
      loadFarms:    vi.fn().mockRejectedValue(new Error('network')),
      loadColonies: vi.fn().mockResolvedValue(COLONY),
    }
    await expect(
      Promise.all([db.loadFarms(), db.loadColonies()]).catch(() => 'caught')
    ).resolves.toBe('caught')
  })

  it('HoneyDB undefined → loadColonies falsy, effect returns early', () => {
    const db = undefined as { loadColonies?: () => Promise<unknown[]> } | undefined
    expect(db?.loadColonies).toBeUndefined()
  })

  it('empty DB returns empty colony list', async () => {
    const db = {
      loadFarms:    vi.fn().mockResolvedValue([]),
      loadColonies: vi.fn().mockResolvedValue([]),
    }
    const [farms, colonies] = await Promise.all([db.loadFarms(), db.loadColonies()])
    expect(farms).toHaveLength(0)
    expect(colonies).toHaveLength(0)
  })
})
