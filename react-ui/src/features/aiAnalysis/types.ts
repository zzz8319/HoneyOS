export type AiAnalysisViewState =
  | 'normal'
  | 'no-images'
  | 'max-images'
  | 'targets-empty'
  | 'loading-inspection'
  | 'data-missing'
  | 'context-missing'
  | 'offline'
  | 'request-pending'
  | 'request-error'
  | 'camera-permission-denied'

export type AnalysisTarget = 'health' | 'disease-pest' | 'queen'
export type PhotoType = 'inspection' | 'auto-capture'

export interface SelectedPhoto {
  id: string
  timeLabel: string
  type: PhotoType
  url?: string
}

export interface InspectionContext {
  inspectionId: string
  colonyId: string
  apiaryId?: string
  selectedPhotos: SelectedPhoto[]
}

export interface InspectionSummary {
  colonyLabel: string
  dateLabel: string
  apiaryName: string
  boxName: string
}

export interface MetricDiff {
  value: number
  diff: number
}

export interface InspectionData {
  beePopulation: MetricDiff
  brood: MetricDiff
  honey: MetricDiff
  queenConfirmed: boolean | null
  estimatedBees: number
}
