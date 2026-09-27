export type DiagnosisViewState =
  | 'normal'
  | 'loading'
  | 'context-missing'
  | 'error'
  | 'offline'
  | 'offline-no-cache'
  | 'saving'

export type Severity = 'danger' | 'warn'

export interface DetectionItem {
  id: string
  title: string
  severity: Severity
  confidence: number
  description: string
  nextCheck: string
}

export interface DiagnosisSummary {
  severity: Severity
  confidence: number
  text: string
}

export interface DiagnosisData {
  diagnosisId: string
  inspectionId: string
  colonyLabel: string
  dateLabel: string
  summary: DiagnosisSummary
  detections: DetectionItem[]
}
