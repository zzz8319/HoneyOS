import type {
  ReportRecord,
  ReportColony,
  StrengthEntry,
  ReportKPI,
  WorkBreakdown,
  MonthlyHarvest,
  MonthlyStrength,
} from './types'

// ── Period filtering ──────────────────────────────────────────────────────────

export function filterByMonth(records: ReportRecord[], year: number, month: number): ReportRecord[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`
  return records.filter(r => r.performedDate.startsWith(prefix))
}

export function filterByYear(records: ReportRecord[], year: number): ReportRecord[] {
  return records.filter(r => r.performedDate.startsWith(String(year)))
}

export function filterByApiary(records: ReportRecord[], apiaryId: string | null): ReportRecord[] {
  if (!apiaryId) return records
  return records.filter(r => r.apiaryId === apiaryId)
}

export function filterStrengthByApiary(entries: StrengthEntry[], apiaryId: string | null): StrengthEntry[] {
  if (!apiaryId) return entries
  return entries.filter(e => e.apiaryId === apiaryId)
}

// ── KPI aggregations ──────────────────────────────────────────────────────────

export function calcHarvestKg(records: ReportRecord[]): number {
  return records.reduce((sum, r) => sum + (r.harvestAmountKg ?? 0), 0)
}

export function calcWorkCount(records: ReportRecord[]): number {
  return records.length
}

// inspectionRate definition:
// Colonies that appeared in at least one inspection record in the period /
// total active colonies in scope × 100
// "active colonies in scope" = colonies passed via activeColonies param
export function calcInspectionRate(
  records: ReportRecord[],
  activeColonies: ReportColony[],
): number | null {
  if (activeColonies.length === 0) return null
  const inspected = records.filter(r => r.hasInspection)
  const inspectedIds = new Set(inspected.flatMap(r => r.colonyIds))
  const activeIds = new Set(activeColonies.map(c => c.id))
  let count = 0
  for (const id of inspectedIds) {
    if (activeIds.has(id)) count++
  }
  return Math.round((count / activeColonies.length) * 100)
}

export function calcAiAlertCount(records: ReportRecord[]): number {
  return records.filter(r => r.isAiAlert).length
}

// percentage change, null if prev is 0 or unavailable
function pctChange(current: number, prev: number | null): number | null {
  if (prev == null || prev === 0) return null
  return Math.round(((current - prev) / prev) * 100)
}

export function buildKPI(
  current: ReportRecord[],
  prev: ReportRecord[] | null,
  activeColonies: ReportColony[],
): ReportKPI {
  const harvestKg = calcHarvestKg(current)
  const prevHarvest = prev != null ? calcHarvestKg(prev) : null
  const inspRate = calcInspectionRate(current, activeColonies)
  const prevInspRate = prev != null ? calcInspectionRate(prev, activeColonies) : null

  return {
    harvestKg,
    harvestKgPrevChange: pctChange(harvestKg, prevHarvest),
    workCount: calcWorkCount(current),
    inspectionRate: inspRate,
    inspectionRatePrevChange:
      inspRate != null && prevInspRate != null
        ? inspRate - prevInspRate  // percentage point delta
        : null,
    aiAlertCount: calcAiAlertCount(current),
  }
}

// ── Work breakdown ────────────────────────────────────────────────────────────

export function calcWorkBreakdown(records: ReportRecord[]): WorkBreakdown {
  const bd: WorkBreakdown = { harvest: 0, feeding: 0, treatment: 0, other: 0 }
  for (const r of records) {
    if (r.workType === 'harvest') bd.harvest++
    else if (r.workType === 'feeding') bd.feeding++
    else if (r.workType === 'treatment') bd.treatment++
    else bd.other++
  }
  return bd
}

// ── Graph series ──────────────────────────────────────────────────────────────

export function calcMonthlyHarvest(records: ReportRecord[], year: number): MonthlyHarvest[] {
  const map = new Map<number, number>()
  for (const r of records) {
    if (!r.performedDate.startsWith(String(year))) continue
    const m = parseInt(r.performedDate.split('-')[1], 10)
    if (isNaN(m) || m < 1 || m > 12) continue
    map.set(m, (map.get(m) ?? 0) + (r.harvestAmountKg ?? 0))
  }
  const result: MonthlyHarvest[] = []
  for (let m = 1; m <= 12; m++) {
    result.push({ month: m, kg: map.get(m) ?? 0 })
  }
  return result
}

export function calcMonthlyStrength(entries: StrengthEntry[]): MonthlyStrength[] {
  const map = new Map<number, number[]>()
  for (const e of entries) {
    if (e.score == null || isNaN(e.score)) continue
    const arr = map.get(e.month) ?? []
    arr.push(e.score)
    map.set(e.month, arr)
  }
  const result: MonthlyStrength[] = []
  for (let m = 1; m <= 12; m++) {
    const scores = map.get(m)
    if (!scores || scores.length === 0) {
      result.push({ month: m, avgScore: null })
    } else {
      const avg = scores.reduce((s, v) => s + v, 0) / scores.length
      result.push({ month: m, avgScore: Math.round(avg) })
    }
  }
  return result
}
