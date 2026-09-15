export type WorkRecordViewState =
  | 'normal-linked-top'
  | 'normal-linked-bottom'
  | 'normal-new'
  | 'validation-error'
  | 'loading'
  | 'context-missing'
  | 'saving-draft'
  | 'saving'
  | 'save-error'
  | 'offline'
  | 'camera-permission-denied'
  | 'photo-upload-error'
  | 'photo-added'
  | 'discard-confirm'
  | 'colony-selector'
  | 'date-picker'
  | 'time-picker'

export type WorkType = 'harvest' | 'feed' | 'treatment' | 'swarm' | 'winter'

export interface WorkRecordContext {
  taskId?: string
  taskName?: string
  recommendationId?: string
  diagnosisResultId?: string
  inspectionId?: string
  colonyId?: string
  colonyName?: string
  apiaryId?: string
  apiaryName?: string
  workType?: WorkType
  dueDate?: string
  initialMemo?: string
}

export interface WorkRecordColony {
  id: string
  name: string
  apiaryId: string
  apiaryName: string
}

export interface WorkRecordApiary {
  id: string
  name: string
}

export interface WorkRecordPayload {
  taskId?: string
  recommendationId?: string
  diagnosisResultId?: string
  inspectionId?: string
  workType: WorkType
  colonyId: string | null
  apiaryId: string | null
  performedDate: string
  performedTime: string
  details?: {
    feedType?: string
    feedAmount?: number
    feedUnit?: string
  }
  memo: string
  photos: string[]
  completeSourceTask: boolean
  status: 'draft' | 'completed'
}
