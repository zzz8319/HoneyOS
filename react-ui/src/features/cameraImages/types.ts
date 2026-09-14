export type CameraViewState =
  | 'normal'
  | 'none-selected'
  | 'inspection-tab'
  | 'auto-capture-tab'
  | 'empty'
  | 'loading'
  | 'error'
  | 'offline'
  | 'upload-error'
  | 'camera-permission-denied'
  | 'context-missing'

export type PhotoType = 'inspection' | 'auto-capture'
export type CameraTabId = 'all' | 'inspection' | 'auto-capture'

export interface PhotoItem {
  id: string
  type: PhotoType
  timeLabel: string
  inspectionId: string
  colonyId: string
  url?: string
}

export interface InspectionGroup {
  inspectionId: string
  dateLabel: string
  photos: PhotoItem[]
}

export interface AutoCaptureGroup {
  dateLabel: string
  photos: PhotoItem[]
}

export interface CameraImagesData {
  colonyLabel: string
  apiaryName: string
  inspectionId: string
  colonyId: string
  inspectionGroups: InspectionGroup[]
  autoCaptureGroups: AutoCaptureGroup[]
}

export interface AiAnalyzePayload {
  selectedPhotoIds: string[]
  inspectionId: string
  colonyId: string
}
