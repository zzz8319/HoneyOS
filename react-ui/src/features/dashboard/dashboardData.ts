import type { DashboardData, ColonySummaryItem, ColonyStatus, WeeklyStats } from './mockData'

interface RawFarm   { id: string; name: string; [k: string]: unknown }
interface RawColony { id: string; name: string; farmId: string | null; [k: string]: unknown }
interface RawFrame  { bee: number; brood: number; honey: number }
interface RawInsp   { id: string; colony: string; date: string; frames?: RawFrame[]; [k: string]: unknown }
interface RawWork   { type?: string; date?: string; yieldKg?: number; [k: string]: unknown }

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

function score(bee: number, brood: number): number {
  return Math.round(bee * 0.6 + brood * 0.4)
}

function colonyStatus(sc: number): ColonyStatus {
  if (sc >= 60) return 'good'
  if (sc >= 40) return 'warn'
  return 'danger'
}

function buildWeeklyStats(workRecords: RawWork[]): WeeklyStats {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const prevWeekStart = new Date(weekStart)
  prevWeekStart.setDate(weekStart.getDate() - 7)

  const harvests = workRecords.filter(r => r.type === 'harvest')
  const thisWeek = harvests.filter(r => r.date && new Date(r.date) >= weekStart)
  const prevWeek = harvests.filter(r => {
    if (!r.date) return false
    const d = new Date(r.date)
    return d >= prevWeekStart && d < weekStart
  })

  const thisKg = thisWeek.reduce((s, r) => s + (Number(r.yieldKg) || 0), 0)
  const prevKg = prevWeek.reduce((s, r) => s + (Number(r.yieldKg) || 0), 0)
  const honeyPrevPct = prevKg > 0 ? Math.round(((thisKg - prevKg) / prevKg) * 100) : 0

  const allThisWeek = workRecords.filter(r => r.date && new Date(r.date) >= weekStart)
  const allPrevWeek = workRecords.filter(r => {
    if (!r.date) return false
    const d = new Date(r.date)
    return d >= prevWeekStart && d < weekStart
  })

  const label = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`
  const periodEnd = new Date(weekStart)
  periodEnd.setDate(weekStart.getDate() + 6)

  const historyWeeks = 4
  const honeyHistory = Array.from({ length: historyWeeks }, (_, i) => {
    const ws = new Date(weekStart)
    ws.setDate(weekStart.getDate() - (historyWeeks - 1 - i) * 7)
    const we = new Date(ws)
    we.setDate(ws.getDate() + 7)
    const kg = harvests
      .filter(r => r.date && new Date(r.date) >= ws && new Date(r.date) < we)
      .reduce((s, r) => s + (Number(r.yieldKg) || 0), 0)
    return { label: label(ws), kg: Math.round(kg * 10) / 10 }
  })

  return {
    period: `${label(weekStart)} - ${label(periodEnd)}`,
    honeyKg: Math.round(thisKg * 10) / 10,
    honeyPrevPct,
    workCount: allThisWeek.length,
    workPrevDiff: allThisWeek.length - allPrevWeek.length,
    honeyHistory,
  }
}

export function buildDashboardData(
  farms: unknown[],
  colonies: unknown[],
  inspRecords: unknown[],
  workRecords: unknown[] = [],
): DashboardData {
  const farmList = farms as RawFarm[]
  const colonyList = colonies as RawColony[]
  const recordList = inspRecords as RawInsp[]
  const workList = workRecords as RawWork[]

  const farmName = farmList[0]?.name ?? '養蜂場'

  // Latest 2 records per colony
  const byColony = new Map<string, RawInsp[]>()
  for (const r of recordList) {
    if (!byColony.has(r.colony)) byColony.set(r.colony, [])
    byColony.get(r.colony)!.push(r)
  }
  for (const recs of byColony.values()) recs.sort((a, b) => b.date.localeCompare(a.date))

  const items: ColonySummaryItem[] = colonyList.map(c => {
    const recs = byColony.get(c.id) ?? []
    const latest = recs[0]
    const prev   = recs[1]
    const curr = avgComp(latest?.frames ?? [])
    const currScore = score(curr.bee, curr.brood)
    const prevComp = avgComp(prev?.frames ?? [])
    const prevScore = score(prevComp.bee, prevComp.brood)
    return {
      id: c.id,
      name: c.name,
      status: colonyStatus(currScore),
      score: currScore,
      delta: prev ? currScore - prevScore : 0,
    }
  })

  const alertColonyCount = items.filter(i => i.status !== 'good').length
  const good   = items.filter(i => i.status === 'good').length
  const warn   = items.filter(i => i.status === 'warn').length
  const danger = items.filter(i => i.status === 'danger').length
  const average = items.length
    ? Math.round(items.reduce((s, i) => s + i.score, 0) / items.length)
    : 0

  return {
    farmName,
    alertColonyCount,
    weather: null,
    colonies: { total: items.length, average, good, warn, danger, colonies: items },
    weekly: buildWeeklyStats(workList),
  }
}
