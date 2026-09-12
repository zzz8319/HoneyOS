import type { FrameRecord, ViewerStage, InspectionRecord, ViewerViewState } from './types'

const F1: FrameRecord = { bee: 38, brood: 22, honey: 20 }
const F2: FrameRecord = { bee: 34, brood: 18, honey: 28 }
const F3: FrameRecord = { bee: 28, brood: 20, honey: 30 }
const F4: FrameRecord = { bee: 25, brood: 15, honey: 35 }
const F6: FrameRecord = { bee: 20, brood: 10, honey: 42 }
const G1: FrameRecord = { bee: 22, brood: 10, honey: 42 }
const G2: FrameRecord = { bee: 18, brood: 8,  honey: 45 }

const STAGES_AUG28: ViewerStage[] = [
  {
    id: 'stage-2',
    label: '2段目',
    frameCount: 6,
    frames: [G1, G2, null, null, null, null],
    hasQueenExcluderAbove: false,
    foundationFrames: [5],
    alertFrames: [],
  },
  {
    id: 'stage-1',
    label: '1段目',
    frameCount: 8,
    frames: [F1, F2, F3, F4, null, F6, null, null],
    hasQueenExcluderAbove: true,
    foundationFrames: [6],
    alertFrames: [4],
  },
]

const RECORD_AUG28: InspectionRecord = {
  id: 'rec-001',
  colonyId: 'a03',
  colonyLabel: 'A-03',
  apiaryName: '宮田養蜂場',
  inspDate: '2026年8月28日（金）',
  weather: '晴れ 30℃',
  stages: STAGES_AUG28,
  queenStatus: 'unconfirmed',
  observations: ['空巣房'],
  memo: '',
}

const STAGES_AUG21: ViewerStage[] = [
  {
    id: 'stage-1',
    label: '1段目',
    frameCount: 8,
    frames: [
      { bee: 38, brood: 25, honey: 18 },
      { bee: 34, brood: 20, honey: 24 },
      { bee: 30, brood: 22, honey: 28 },
      { bee: 28, brood: 18, honey: 32 },
      { bee: 25, brood: 15, honey: 38 },
      { bee: 22, brood: 12, honey: 40 },
      null,
      null,
    ],
    hasQueenExcluderAbove: false,
    foundationFrames: [6, 7],
    alertFrames: [],
  },
]

const RECORD_AUG21: InspectionRecord = {
  id: 'rec-000',
  colonyId: 'a03',
  colonyLabel: 'A-03',
  apiaryName: '宮田養蜂場',
  inspDate: '2026年8月21日（金）',
  weather: 'くもり 26℃',
  stages: STAGES_AUG21,
  queenStatus: 'laying',
  observations: [],
  memo: '女王確認。産卵継続中。',
}

// Ordered list: newest first
export const MOCK_RECORDS: InspectionRecord[] = [RECORD_AUG28, RECORD_AUG21]

export function getInitialRecord(viewState: ViewerViewState): InspectionRecord {
  if (viewState === 'history') return RECORD_AUG21
  return RECORD_AUG28
}

export function getInitialSelected(
  viewState: ViewerViewState,
): { stageId: string; frameIndex: number } | null {
  switch (viewState) {
    case 'normal':
    case 'offline':
    case 'history':
      return { stageId: 'stage-1', frameIndex: 2 }  // 3枠目
    case 'frame-selected':
      return { stageId: 'stage-1', frameIndex: 5 }  // 6枠目
    case 'other-stage':
      return { stageId: 'stage-2', frameIndex: 1 }  // 2段目 2枠目
    case 'deselected':
    case 'loading':
    case 'empty':
    case 'error':
    default:
      return null
  }
}

export function getRecordIndex(viewState: ViewerViewState): number {
  return viewState === 'history' ? 1 : 0
}
