// [DEV FIXTURE] — replace with window.HoneyDB calls before production
import type { ComparisonApiary, ComparisonColonyRow, ColonyStatus, WarningKind } from './types'

export const COMPARISON_APIARIES: ComparisonApiary[] = [
  { id: 'apiary-miyata',      name: '宮田養蜂場' },
  { id: 'apiary-kawahigashi', name: '川東養蜂場' },
]

// ── Per-colony inspection history ─────────────────────────────────────────
interface InspRecord {
  inspectedAt: string  // 'YYYY-MM-DD' (JST date)
  strength: number
  bee: number
  brood: number
  honey: number
}

interface ColonyHistoryEntry {
  colonyId: string
  colonyName: string
  apiaryId: string
  apiaryName: string
  color: string
  prevStrength: number  // used for strengthDelta (baseline before the history window)
  records: InspRecord[] // must be sorted ascending by inspectedAt
}

const COLONY_HISTORIES: ColonyHistoryEntry[] = [
  {
    colonyId: 'a1', colonyName: 'A-01',
    apiaryId: 'apiary-miyata', apiaryName: '宮田養蜂場',
    color: '#3B82F6', prevStrength: 75,
    records: [
      { inspectedAt: '2026-08-27', strength: 73, bee: 80, brood: 68, honey: 58 },
      { inspectedAt: '2026-09-05', strength: 79, bee: 85, brood: 72, honey: 64 },
    ],
  },
  {
    colonyId: 'b1', colonyName: 'B-01',
    apiaryId: 'apiary-kawahigashi', apiaryName: '川東養蜂場',
    color: '#22C55E', prevStrength: 68,
    records: [
      { inspectedAt: '2026-08-22', strength: 63, bee: 58, brood: 68, honey: 44 },
      { inspectedAt: '2026-09-03', strength: 70, bee: 65, brood: 78, honey: 52 },
    ],
  },
  {
    colonyId: 'a5', colonyName: 'A-05',
    apiaryId: 'apiary-miyata', apiaryName: '宮田養蜂場',
    color: '#F59E0B', prevStrength: 66,
    records: [
      { inspectedAt: '2026-08-10', strength: 55, bee: 50, brood: 48, honey: 65 },
      { inspectedAt: '2026-08-23', strength: 65, bee: 60, brood: 58, honey: 70 },
    ],
  },
  {
    colonyId: 'a3', colonyName: 'A-03',
    apiaryId: 'apiary-miyata', apiaryName: '宮田養蜂場',
    color: '#EF4444', prevStrength: 45,
    records: [
      { inspectedAt: '2026-08-15', strength: 42, bee: 44, brood: 26, honey: 52 },
      { inspectedAt: '2026-08-28', strength: 35, bee: 40, brood: 28, honey: 55 },
    ],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────

function computeStatus(strength: number): ColonyStatus {
  if (strength >= 70) return 'good'
  if (strength >= 45) return 'caution'
  return 'alert'
}

/** Days between two 'YYYY-MM-DD' strings using local calendar arithmetic. */
function daysBetweenDates(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  const a = Date.UTC(fy, fm - 1, fd)
  const b = Date.UTC(ty, tm - 1, td)
  return Math.round((b - a) / 86400000)
}

/**
 * For each colony, pick the most recent inspection record ≤ refDateStr,
 * then compute strength / daysSinceInspection / status relative to that date.
 */
export function selectRowsForDate(
  histories: ColonyHistoryEntry[],
  refDateStr: string,
): ComparisonColonyRow[] {
  return histories.map(h => {
    const eligible = h.records.filter(r => r.inspectedAt <= refDateStr)
    const latest = eligible.length > 0
      ? eligible.reduce((best, r) => r.inspectedAt > best.inspectedAt ? r : best)
      : null

    if (!latest) {
      return {
        colonyId: h.colonyId, colonyName: h.colonyName,
        apiaryId: h.apiaryId, apiaryName: h.apiaryName,
        color: h.color,
        strength: null, bee: null, brood: null, honey: null,
        lastInspectionDate: null, daysSinceInspection: null,
        status: 'good' as const, warningKind: null,
        prevStrength: null, strengthDelta: null,
      }
    }

    const days = daysBetweenDates(latest.inspectedAt, refDateStr)
    const status = computeStatus(latest.strength)
    const warningKind: WarningKind | null =
      latest.strength < 45 ? 'strength-low'
      : (h.prevStrength - latest.strength) > 10 ? 'strength-drop'
      : null

    return {
      colonyId: h.colonyId, colonyName: h.colonyName,
      apiaryId: h.apiaryId, apiaryName: h.apiaryName,
      color: h.color,
      strength: latest.strength,
      bee: latest.bee,
      brood: latest.brood,
      honey: latest.honey,
      lastInspectionDate: latest.inspectedAt,
      daysSinceInspection: days,
      status,
      warningKind,
      prevStrength: h.prevStrength,
      strengthDelta: latest.strength - h.prevStrength,
    }
  })
}

// ── Stable fixture for 2026-09-08 (used by unit tests and as initial state) ──
// Values: A-01=79, B-01=70, A-05=65, A-03=35 (days: 3, 5, 16, 11)
export const COMPARISON_ROWS_FIXTURE: ComparisonColonyRow[] =
  selectRowsForDate(COLONY_HISTORIES, '2026-09-08')

export { COLONY_HISTORIES }

// ── Selectors ─────────────────────────────────────────────────────────────

/** Generate warnings from row data (not from hardcoded strings) */
export function buildWarnings(rows: ComparisonColonyRow[]) {
  return rows
    .filter(r => r.warningKind !== null || r.status === 'alert')
    .map(r => ({
      colonyId: r.colonyId,
      colonyName: r.colonyName,
      message: r.warningKind === 'strength-low'
        ? `${r.colonyName} は強さスコアが低下しています`
        : r.warningKind === 'strength-drop'
          ? `${r.colonyName} の強さスコアが急減しました`
          : `${r.colonyName} の状態を確認してください`,
      warningKind: r.warningKind ?? 'strength-low' as const,
    }))
}

/** Filter rows by apiary, status, and last-inspection days */
export function filterRows(
  rows: ComparisonColonyRow[],
  opts: {
    apiaryId: string | null   // null = all
    status: string            // 'all' | 'good' | 'caution' | 'alert'
    lastInspection: string    // 'all' | '7d' | '14d' | '30d' | '30d+'
  },
): ComparisonColonyRow[] {
  let result = rows
  if (opts.apiaryId) {
    result = result.filter(r => r.apiaryId === opts.apiaryId)
  }
  if (opts.status !== 'all') {
    result = result.filter(r => r.status === opts.status)
  }
  if (opts.lastInspection !== 'all') {
    result = result.filter(r => {
      const d = r.daysSinceInspection
      if (d === null) return false
      if (opts.lastInspection === '7d')  return d <= 7
      if (opts.lastInspection === '14d') return d <= 14
      if (opts.lastInspection === '30d') return d <= 30
      if (opts.lastInspection === '30d+') return d > 30
      return true
    })
  }
  return result
}

/** Sort rows stably */
export function sortRows(
  rows: ComparisonColonyRow[],
  key: import('./types').SortKey,
  dir: import('./types').SortDir,
): ComparisonColonyRow[] {
  const sorted = [...rows].sort((a, b) => {
    let aVal: number | null
    let bVal: number | null
    if (key === 'strength')       { aVal = a.strength;       bVal = b.strength }
    else if (key === 'bee')       { aVal = a.bee;            bVal = b.bee }
    else if (key === 'brood')     { aVal = a.brood;          bVal = b.brood }
    else if (key === 'honey')     { aVal = a.honey;          bVal = b.honey }
    else                          { aVal = a.daysSinceInspection; bVal = b.daysSinceInspection }

    if (aVal === null && bVal === null) return a.colonyName.localeCompare(b.colonyName)
    if (aVal === null) return 1
    if (bVal === null) return -1

    const cmp = aVal - bVal
    const dirMul = dir === 'asc' ? 1 : -1
    return cmp !== 0 ? cmp * dirMul : a.colonyName.localeCompare(b.colonyName)
  })
  return sorted
}
