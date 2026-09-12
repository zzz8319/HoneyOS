import type { FrameRecord, QueenStatus } from '../inspectionRecord/types'

export type { FrameRecord, QueenStatus }

export interface ViewerStage {
  id: string
  label: string
  frameCount: number
  frames: (FrameRecord | null)[]
  hasQueenExcluderAbove: boolean
  foundationFrames: number[]  // frame indices with foundation pattern
  alertFrames: number[]       // frame indices with attention badge
}

export interface InspectionRecord {
  id: string
  colonyId: string
  colonyLabel: string
  apiaryName: string
  inspDate: string
  weather: string
  stages: ViewerStage[]
  queenStatus: QueenStatus | null
  observations: string[]
  memo: string
}

export interface EditTarget {
  stageId: string
  frameIndex: number
}

export type ViewerViewState =
  | 'normal'
  | 'frame-selected'
  | 'deselected'
  | 'other-stage'
  | 'history'
  | 'loading'
  | 'empty'
  | 'error'
  | 'offline'
