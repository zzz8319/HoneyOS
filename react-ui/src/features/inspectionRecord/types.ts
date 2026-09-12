export type QueenStatus = 'laying' | 'unconfirmed' | 'concern'

export interface FrameRecord {
  bee: number    // 0–100 (whole %)
  brood: number
  honey: number
  // empty = 100 - bee - brood - honey (auto-computed)
}

export interface StageRecord {
  id: string
  label: string              // "1段目"
  frameCount: number         // 1–8
  frames: (FrameRecord | null)[]
  hasQueenExcluderAbove: boolean
  isExpanded: boolean
}

export interface InspectionSession {
  colonyId: string
  colonyLabel: string   // "A-05"
  apiaryName: string
  statusLabel: string
  inspDate: string
  weather: string
}

export type RecordViewState =
  | 'normal'
  | 'multi-stage'
  | 'unsaved'
  | 'saved'
  | 'draft-restore'
  | 'save-error'
  | 'offline'
