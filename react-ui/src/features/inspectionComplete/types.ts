export type CompleteViewState =
  | 'normal'
  | 'healthy'
  | 'first-inspection'
  | 'ai-analyzed'
  | 'reminder-off'
  | 'loading'
  | 'error'
  | 'offline'
  | 'missing-record'

export interface StageSummary {
  stageCount: number
  totalFrames: number
  recordedFrames: number
}

export type ComparisonKey = 'bee' | 'brood' | 'honey' | 'strength'

export interface ComparisonMetric {
  key: ComparisonKey
  label: string
  current: number   // 0–100 (or score for strength)
  previous: number | null  // null = first inspection
  unit: string
}

export interface AiDiagnosis {
  analyzed: true
  confidence: 'high' | 'medium' | 'low'
  summary: string
}

export interface NextInspectionSuggestion {
  daysBefore: number
  suggestedDate: string   // "2026年9月22日（火）"
  userDate: string | null
}

export interface InspectionCompleteData {
  inspectionId: string
  colonyId: string
  colonyLabel: string         // "A-05"
  apiaryName: string          // "宮田養蜂場"
  inspDate: string            // "2026年9月8日（火）"
  weather: string             // "晴れ"
  tempCelsius: number         // 28
  queenStatus: 'laying' | 'unconfirmed' | 'concern'
  estimatedBeeCount: number   // 18500
  strengthScore: number       // 0–100
  stageSummary: StageSummary
  previousInspDate: string | null  // null = first inspection
  comparison: ComparisonMetric[]
  aiDiagnosis: AiDiagnosis | null
  nextInspection: NextInspectionSuggestion
}
