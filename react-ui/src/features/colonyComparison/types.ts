export type ColonyComparisonViewState =
  | 'normal'
  | 'empty'
  | 'loading'
  | 'error'
  | 'offline'
  | 'offline-no-cache'

export type ComparisonTab = 'table' | 'ranking'

export type SortKey = 'strength' | 'bee' | 'brood' | 'honey' | 'lastInspection'
export type SortDir = 'asc' | 'desc'

export type ColonyStatus = 'good' | 'caution' | 'alert'
export type WarningKind = 'strength-low' | 'strength-drop' | 'no-inspection'

export interface ComparisonApiary {
  id: string
  name: string
}

export interface ComparisonColonyRow {
  colonyId: string
  colonyName: string
  apiaryId: string
  apiaryName: string
  color: string
  strength: number | null
  bee: number | null
  brood: number | null
  honey: number | null
  lastInspectionDate: string | null
  daysSinceInspection: number | null
  status: ColonyStatus
  warningKind: WarningKind | null
  prevStrength: number | null
  strengthDelta: number | null
}

export interface ComparisonWarning {
  colonyId: string
  colonyName: string
  message: string
  warningKind: WarningKind
}
