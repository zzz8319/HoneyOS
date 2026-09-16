export type WorkHistoryViewState =
  | 'normal'
  | 'filtered-feeding'
  | 'filtered-apiary'
  | 'filtered-colony'
  | 'filtered-period'
  | 'search-results'
  | 'empty'
  | 'no-results'
  | 'loading'
  | 'error'
  | 'offline'
  | 'offline-no-cache'
  | 'filter-menu'
  | 'search-open'

export type WorkHistoryWorkType = 'harvest' | 'feeding' | 'treatment' | 'swarming' | 'wintering'

export type PeriodOption = 'all' | '7d' | '30d' | '3m' | 'custom'

export interface WorkHistoryRecord {
  id: string
  workType: WorkHistoryWorkType
  title: string
  performedDate: string
  performedTime: string
  apiaryId?: string
  apiaryName?: string
  colonyIds: string[]
  colonyLabels: string[]
  memo?: string
  photos?: string[]
  details?: {
    harvestAmount?: number
    harvestUnit?: string
    process?: string
    feedType?: string
    feedAmount?: number
    feedUnit?: string
    treatmentName?: string
    nextTreatmentDate?: string
    newColonyId?: string
  }
}

export interface WorkHistoryApiary {
  id: string
  name: string
}

export interface WorkHistoryFilters {
  workType: WorkHistoryWorkType | 'all'
  apiaryId: string | null
  colonyId: string | null
  period: PeriodOption
  periodStart: string
  periodEnd: string
  searchQuery: string
}
