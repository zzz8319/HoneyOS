import type { ColonyTrendData, TrendPoint, Metric, ColonySeries, RadarData } from './mockData'
import { SERIES_COLORS } from './mockData'

interface RawFarm   { id: string; name: string }
interface RawColony { id: string; name: string; farmId: string | null }
interface RawFrame  { bee: number; brood: number; honey: number }
interface RawInsp   { id: string; colony: string; date: string; frames?: RawFrame[]; queen_present?: boolean | null }

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

function strength(bee: number, brood: number) { return Math.round(bee * 0.6 + brood * 0.4) }

export function buildColonyTrendData(
  farms: unknown[],
  colonies: unknown[],
  inspRecords: unknown[],
): ColonyTrendData {
  const farmList  = farms as RawFarm[]
  const colonyList = colonies as RawColony[]
  const recList   = inspRecords as RawInsp[]

  const farmMap = new Map(farmList.map(f => [String(f.id), f.name]))

  // Per-colony records sorted ascending by date
  const byColony = new Map<string, RawInsp[]>()
  for (const r of recList) {
    if (!byColony.has(r.colony)) byColony.set(r.colony, [])
    byColony.get(r.colony)!.push(r)
  }
  for (const recs of byColony.values()) recs.sort((a, b) => a.date.localeCompare(b.date))

  const availableColonies = colonyList.map(c => ({
    id: c.id,
    name: c.name,
    apiaryName: c.farmId ? (farmMap.get(String(c.farmId)) ?? '養蜂場なし') : '養蜂場なし',
  }))

  const series: ColonySeries[] = colonyList.map((c, i) => {
    const recs = byColony.get(c.id) ?? []
    const pts = (key: Metric): TrendPoint[] => recs.map(r => {
      const comp = avgComp(r.frames ?? [])
      const val = key === 'strength' ? strength(comp.bee, comp.brood)
        : key === 'bee' ? comp.bee
        : key === 'brood' ? comp.brood
        : comp.honey
      return { date: r.date, value: val }
    })

    const latest = recs[recs.length - 1]
    const comp = avgComp(latest?.frames ?? [])
    const radar: RadarData = {
      bee:   comp.bee,
      brood: comp.brood,
      honey: comp.honey,
      queen: latest?.queen_present ? 80 : 40,
      latestDate: latest?.date ?? '',
    }

    return {
      colonyId: c.id,
      name: c.name,
      color: SERIES_COLORS[i % SERIES_COLORS.length],
      points: { strength: pts('strength'), bee: pts('bee'), brood: pts('brood'), honey: pts('honey') },
      radar,
    }
  })

  // Average series: collect all dates, compute mean per date across all colonies
  const allDates = [...new Set(recList.map(r => r.date))].sort()
  const avgPoints = (key: Metric): TrendPoint[] => allDates.map(date => {
    const values = recList
      .filter(r => r.date === date)
      .map(r => {
        const comp = avgComp(r.frames ?? [])
        return key === 'strength' ? strength(comp.bee, comp.brood)
          : key === 'bee' ? comp.bee
          : key === 'brood' ? comp.brood
          : comp.honey
      })
    const avg = values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : 0
    return { date, value: avg }
  })

  return {
    availableColonies,
    series,
    average: { points: { strength: avgPoints('strength'), bee: avgPoints('bee'), brood: avgPoints('brood'), honey: avgPoints('honey') } },
    alertThreshold: 40,
  }
}
