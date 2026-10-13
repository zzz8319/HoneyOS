import type { ComparisonApiary } from './types'
import { SERIES_COLORS } from '../colonyTrend/mockData'

interface RawFarm   { id: string; name: string }
interface RawColony { id: string; name: string; farmId: string | null }
interface RawFrame  { bee: number; brood: number; honey: number }
interface RawInsp   { id: string; colony: string; date: string; frames?: RawFrame[] }

function avgComp(frames: RawFrame[]) {
  const filled = frames.filter(f => f && (f.bee + f.brood + f.honey) > 0)
  if (!filled.length) return { bee: 0, brood: 0, honey: 0 }
  const n = filled.length
  return {
    bee:   Math.round(filled.reduce((s, f) => s + f.bee, 0) / n),
    brood: Math.round(filled.reduce((s, f) => s + f.brood, 0) / n),
    honey: Math.round(filled.reduce((s, f) => s + f.honey, 0) / n),
  }
}

export interface BuiltColonyHistory {
  colonyId: string
  colonyName: string
  apiaryId: string
  apiaryName: string
  color: string
  prevStrength: number
  records: { inspectedAt: string; strength: number; bee: number; brood: number; honey: number }[]
}

export function buildComparisonData(
  farms: unknown[],
  colonies: unknown[],
  inspRecords: unknown[],
): { histories: BuiltColonyHistory[]; apiaries: ComparisonApiary[] } {
  const farmList  = farms as RawFarm[]
  const colonyList = colonies as RawColony[]
  const recList   = inspRecords as RawInsp[]

  const farmMap = new Map(farmList.map(f => [String(f.id), f.name]))

  const byColony = new Map<string, RawInsp[]>()
  for (const r of recList) {
    if (!byColony.has(r.colony)) byColony.set(r.colony, [])
    byColony.get(r.colony)!.push(r)
  }
  for (const recs of byColony.values()) recs.sort((a, b) => a.date.localeCompare(b.date))

  const histories: BuiltColonyHistory[] = colonyList.map((c, i) => {
    const farmId = c.farmId ? String(c.farmId) : 'unknown'
    const recs = byColony.get(c.id) ?? []
    const records = recs.map(r => {
      const comp = avgComp(r.frames ?? [])
      const strength = Math.round(comp.bee * 0.6 + comp.brood * 0.4)
      return { inspectedAt: r.date, strength, bee: comp.bee, brood: comp.brood, honey: comp.honey }
    })
    const prevStrength = records.length >= 2 ? records[records.length - 2].strength : (records[0]?.strength ?? 50)
    return {
      colonyId: c.id,
      colonyName: c.name,
      apiaryId: farmId,
      apiaryName: farmMap.get(farmId) ?? '養蜂場なし',
      color: SERIES_COLORS[i % SERIES_COLORS.length],
      prevStrength,
      records,
    }
  })

  const apiaries: ComparisonApiary[] = farmList.map(f => ({ id: String(f.id), name: f.name }))
  return { histories, apiaries }
}
