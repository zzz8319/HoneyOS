export type RecommendedWorkState =
  | 'normal'
  | 'none-selected'
  | 'multi-selected'
  | 'loading'
  | 'context-missing'
  | 'error'
  | 'offline'
  | 'offline-no-cache'
  | 'creating-tasks'

export type Severity = 'danger' | 'warn'

export interface WorkTag {
  label: string
  variant: 'danger' | 'warn' | 'neutral'
}

export interface RecommendedWorkItem {
  id: string
  priority: 1 | 2 | 3
  title: string
  description: string
  tags: WorkTag[]
}

export interface DiagnosisFinding {
  title: string
  confidence: number
  severity: Severity
  description: string
}

export interface RecommendedWorkData {
  colonyLabel: string
  diagnosisId: string
  inspectionId: string
  findings: DiagnosisFinding[]
  items: RecommendedWorkItem[]
}
