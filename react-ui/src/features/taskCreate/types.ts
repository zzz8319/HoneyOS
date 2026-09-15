export type TaskCreateViewState =
  | 'normal-ai'
  | 'normal-manual'
  | 'validation-error'
  | 'submitting'
  | 'submit-error'
  | 'offline'
  | 'context-missing'
  | 'loading'
  | 'colony-picker'
  | 'date-picker'
  | 'discard-dialog'

export type TaskPriority = 'high' | 'medium' | 'low'
export type TaskSource = 'ai-recommendation' | 'manual'

export interface TaskCreateContext {
  source: TaskSource
  diagnosisResultId?: string
  recommendationId?: string
  inspectionId?: string
  colonyId?: string
  apiaryId?: string
  initialTitle?: string
  initialDueDate?: string
  initialPriority?: TaskPriority
  initialMemo?: string
}

export interface TaskCreatePayload {
  title: string
  dueDate: string // YYYY-MM-DD, local date
  priority: TaskPriority
  colonyId: string | null
  apiaryId: string | null
  memo: string
  reminderEnabled: boolean
  source: TaskSource
  recommendationId?: string
  diagnosisResultId?: string
  inspectionId?: string
}

export interface Colony {
  id: string
  name: string
  apiaryId: string
  apiaryName: string
}

export interface Apiary {
  id: string
  name: string
}
