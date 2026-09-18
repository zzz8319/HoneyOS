export type ReportViewState =
  | 'normal'
  | 'loading'
  | 'empty'
  | 'error'
  | 'offline'
  | 'offline-no-cache'

export type ReportPeriodMode = 'monthly' | 'yearly'
export type ReportAggUnit = 'overall' | 'apiary' | 'colony'

export interface ReportApiary {
  id: string
  name: string
}

export interface ReportColony {
  id: string
  name: string
  apiaryId: string
}

// Single work record used for report aggregation
export interface ReportRecord {
  id: string
  workType: 'harvest' | 'feeding' | 'treatment' | 'swarming' | 'wintering' | 'inspection'
  performedDate: string  // YYYY-MM-DD
  apiaryId: string
  colonyIds: string[]
  harvestAmountKg?: number
  isAiAlert?: boolean
  hasInspection?: boolean
}

// Monthly strength score entry (from colony inspections)
export interface StrengthEntry {
  month: number   // 1-12
  apiaryId: string
  colonyId: string
  score: number   // 0-100
}

export interface ReportKPI {
  harvestKg: number
  harvestKgPrevChange: number | null  // percentage, null if no prev data
  workCount: number
  inspectionRate: number | null        // 0-100, null if no colony data
  inspectionRatePrevChange: number | null
  aiAlertCount: number
}

export interface WorkBreakdown {
  harvest: number
  feeding: number
  treatment: number
  other: number
}

export interface MonthlyHarvest {
  month: number   // 1-12
  kg: number
}

export interface MonthlyStrength {
  month: number   // 1-12
  avgScore: number | null
}
