import type { ReportRecord, ReportApiary, ReportColony, StrengthEntry } from './types'

interface RawFarm   { id: string; name: string }
interface RawColony { id: string; name: string; farmId: string | null }
interface RawFrame  { bee: number; brood: number; honey: number }
interface RawWork   { id: string; colony?: string | null; colonies?: string[]; colonyIds?: string[]; type?: string; workType?: string; date: string; harvest_amount_kg?: number; harvestAmountKg?: number; is_ai_alert?: boolean; farm?: string | null; farmId?: string | null }
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

function strength(bee: number, brood: number) { return Math.round(bee * 0.6 + brood * 0.4) }

const WORK_TYPE_MAP: Record<string, ReportRecord['workType']> = {
  harvest: 'harvest', feeding: 'feeding', treatment: 'treatment',
  swarming: 'swarming', wintering: 'wintering', inspection: 'inspection',
  feed: 'feeding', 'queen-check': 'inspection', other: 'inspection',
}

export function buildReportData(
  farms: unknown[],
  colonies: unknown[],
  workRecords: unknown[],
  inspRecords: unknown[],
): {
  records: ReportRecord[]
  strengthEntries: StrengthEntry[]
  apiaries: ReportApiary[]
  reportColonies: ReportColony[]
} {
  const farmList   = farms as RawFarm[]
  const colonyList = colonies as RawColony[]
  const workList   = workRecords as RawWork[]
  const inspList   = inspRecords as RawInsp[]

  const colonyMap  = new Map(colonyList.map(c => [String(c.id), c]))

  const apiaries: ReportApiary[] = farmList.map(f => ({ id: String(f.id), name: f.name }))

  const reportColonies: ReportColony[] = colonyList.map(c => ({
    id: c.id,
    name: c.name,
    apiaryId: c.farmId ? String(c.farmId) : 'unknown',
  }))

  // Build records from work records
  const records: ReportRecord[] = workList.map(w => {
    const rawType = (w.workType ?? w.type ?? 'other') as string
    const workType: ReportRecord['workType'] = WORK_TYPE_MAP[rawType] ?? 'inspection'

    // Resolve colonyIds
    const rawIds: string[] = w.colonyIds ?? w.colonies ?? (w.colony ? [w.colony] : [])
    const colonyIds = rawIds.map(String)

    // Resolve apiaryId: from first colony's farmId or raw field
    const farmIdRaw = w.farm ?? w.farmId ?? null
    let apiaryId = farmIdRaw ? String(farmIdRaw) : 'unknown'
    if (apiaryId === 'unknown' && colonyIds.length > 0) {
      const col = colonyMap.get(colonyIds[0])
      if (col?.farmId) apiaryId = String(col.farmId)
    }

    return {
      id: w.id,
      workType,
      performedDate: w.date,
      apiaryId,
      colonyIds,
      harvestAmountKg: w.harvestAmountKg ?? w.harvest_amount_kg,
      isAiAlert: w.is_ai_alert ?? false,
      hasInspection: workType === 'inspection',
    }
  })

  // Add inspection records as 'inspection' work records
  for (const r of inspList) {
    const col = colonyMap.get(String(r.colony))
    const apiaryId = col?.farmId ? String(col.farmId) : 'unknown'
    records.push({
      id: `insp-${r.id}`,
      workType: 'inspection',
      performedDate: r.date,
      apiaryId,
      colonyIds: [String(r.colony)],
      hasInspection: true,
    })
  }

  // Build strength entries from insp records grouped by colony+month
  const strengthMap = new Map<string, { bee: number; brood: number; count: number }>()
  for (const r of inspList) {
    const month = Number(r.date.slice(5, 7))
    const col = colonyMap.get(String(r.colony))
    const apiaryId = col?.farmId ? String(col.farmId) : 'unknown'
    const key = `${month}:${apiaryId}:${r.colony}`
    const comp = avgComp(r.frames ?? [])
    if (!strengthMap.has(key)) strengthMap.set(key, { bee: 0, brood: 0, count: 0 })
    const entry = strengthMap.get(key)!
    entry.bee   += comp.bee
    entry.brood += comp.brood
    entry.count += 1
  }

  const strengthEntries: StrengthEntry[] = []
  for (const [key, val] of strengthMap) {
    const [monthStr, apiaryId, colonyId] = key.split(':')
    const avgBee   = val.count ? val.bee   / val.count : 0
    const avgBrood = val.count ? val.brood / val.count : 0
    strengthEntries.push({
      month: Number(monthStr),
      apiaryId,
      colonyId,
      score: strength(avgBee, avgBrood),
    })
  }

  // Deduplicate inspection records (work + insp may overlap)
  const seen = new Set<string>()
  const deduped = records.filter(r => {
    const k = `${r.workType}:${r.performedDate}:${r.colonyIds.sort().join(',')}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

  return { records: deduped, strengthEntries, apiaries, reportColonies }
}
