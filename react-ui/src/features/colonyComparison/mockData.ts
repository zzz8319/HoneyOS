// [DEV FIXTURE] — replace with window.HoneyDB calls before production
import type { ComparisonApiary, ComparisonColonyRow } from './types'

export const COMPARISON_APIARIES: ComparisonApiary[] = [
  { id: 'apiary-miyata', name: '宮田養蜂場' },
  { id: 'apiary-kawahigashi', name: '川東養蜂場' },
]

// Reference date: 2026-09-08
// Last inspection dates (≤ reference date):
//   A-01: 2026-09-05  (3日前)
//   B-01: 2026-09-03  (5日前)
//   A-05: 2026-08-23  (16日前)
//   A-03: 2026-08-28  (11日前)
export const COMPARISON_ROWS_FIXTURE: ComparisonColonyRow[] = [
  {
    colonyId: 'a1',
    colonyName: 'A-01',
    apiaryId: 'apiary-miyata',
    apiaryName: '宮田養蜂場',
    color: '#3B82F6',
    strength: 79,
    bee: 85,
    brood: 72,
    honey: 64,
    lastInspectionDate: '2026-09-05',
    daysSinceInspection: 3,
    status: 'good',
    warningKind: null,
    prevStrength: 75,
    strengthDelta: 4,
  },
  {
    colonyId: 'b1',
    colonyName: 'B-01',
    apiaryId: 'apiary-kawahigashi',
    apiaryName: '川東養蜂場',
    color: '#22C55E',
    strength: 70,
    bee: 65,
    brood: 78,
    honey: 52,
    lastInspectionDate: '2026-09-03',
    daysSinceInspection: 5,
    status: 'good',
    warningKind: null,
    prevStrength: 68,
    strengthDelta: 2,
  },
  {
    colonyId: 'a5',
    colonyName: 'A-05',
    apiaryId: 'apiary-miyata',
    apiaryName: '宮田養蜂場',
    color: '#F59E0B',
    strength: 65,
    bee: 60,
    brood: 58,
    honey: 70,
    lastInspectionDate: '2026-08-23',
    daysSinceInspection: 16,
    status: 'caution',
    warningKind: null,
    prevStrength: 66,
    strengthDelta: -1,
  },
  {
    colonyId: 'a3',
    colonyName: 'A-03',
    apiaryId: 'apiary-miyata',
    apiaryName: '宮田養蜂場',
    color: '#EF4444',
    strength: 35,
    bee: 40,
    brood: 28,
    honey: 55,
    lastInspectionDate: '2026-08-28',
    daysSinceInspection: 11,
    status: 'alert',
    warningKind: 'strength-low',
    prevStrength: 45,
    strengthDelta: -10,
  },
]

export const COMPARISON_ROWS_MIYATA: ComparisonColonyRow[] = COMPARISON_ROWS_FIXTURE.filter(
  r => r.apiaryId === 'apiary-miyata',
)

export const COMPARISON_ROWS_KAWAHIGASHI: ComparisonColonyRow[] = COMPARISON_ROWS_FIXTURE.filter(
  r => r.apiaryId === 'apiary-kawahigashi',
)

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

    // nulls always go last
    if (aVal === null && bVal === null) return a.colonyName.localeCompare(b.colonyName)
    if (aVal === null) return 1
    if (bVal === null) return -1

    // For lastInspection asc = most recent first (smallest days)
    const cmp = aVal - bVal
    const dirMul = dir === 'asc' ? 1 : -1
    return cmp !== 0 ? cmp * dirMul : a.colonyName.localeCompare(b.colonyName)
  })
  return sorted
}
