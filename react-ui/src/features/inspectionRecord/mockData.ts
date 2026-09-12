import type { StageRecord, InspectionSession, FrameRecord, RecordViewState } from './types'

export const DEFAULT_SESSION: InspectionSession = {
  colonyId: 'a05',
  colonyLabel: 'A-05',
  apiaryName: '宮田養蜂場',
  statusLabel: '16日未内検',
  inspDate: '2026年9月8日（火）',
  weather: '晴れ 28℃',
}

const F_L: FrameRecord = { bee: 35, brood: 22, honey: 20 }
const F_2: FrameRecord = { bee: 32, brood: 18, honey: 28 }
const F_3: FrameRecord = { bee: 28, brood: 20, honey: 30 }
const F_4: FrameRecord = { bee: 25, brood: 15, honey: 35 }
const F_5: FrameRecord = { bee: 30, brood: 25, honey: 22 }

const ALL_8: (FrameRecord | null)[] = [
  { bee: 35, brood: 22, honey: 20 },
  { bee: 32, brood: 18, honey: 28 },
  { bee: 28, brood: 20, honey: 30 },
  { bee: 25, brood: 15, honey: 35 },
  { bee: 30, brood: 25, honey: 22 },
  { bee: 20, brood: 10, honey: 42 },
  { bee: 18, brood: 8,  honey: 45 },
  { bee: 15, brood: 5,  honey: 48 },
]

export function getInitialStages(viewState: RecordViewState): StageRecord[] {
  switch (viewState) {
    case 'multi-stage':
      return [
        {
          id: 'stage-2',
          label: '2段目',
          frameCount: 6,
          frames: [
            { bee: 20, brood: 10, honey: 42 },
            { bee: 18, brood: 8,  honey: 45 },
            null, null, null, null,
          ],
          hasQueenExcluderAbove: false,
          isExpanded: true,
        },
        {
          id: 'stage-1',
          label: '1段目',
          frameCount: 8,
          frames: [F_L, F_2, F_3, F_4, F_5, null, null, null],
          hasQueenExcluderAbove: true,
          isExpanded: false,
        },
      ]
    case 'unsaved':
      return [{
        id: 'stage-1',
        label: '1段目',
        frameCount: 8,
        frames: [F_L, F_2, null, null, null, null, null, null],
        hasQueenExcluderAbove: false,
        isExpanded: true,
      }]
    case 'saved':
      return [{
        id: 'stage-1',
        label: '1段目',
        frameCount: 8,
        frames: ALL_8,
        hasQueenExcluderAbove: false,
        isExpanded: true,
      }]
    default:
      return [{
        id: 'stage-1',
        label: '1段目',
        frameCount: 8,
        frames: [F_L, F_2, F_3, F_4, F_5, null, null, null],
        hasQueenExcluderAbove: false,
        isExpanded: true,
      }]
  }
}

export function getInitialEditPos(viewState: RecordViewState): { stageId: string; frameIndex: number } {
  if (viewState === 'multi-stage') return { stageId: 'stage-2', frameIndex: 0 }
  if (viewState === 'saved')       return { stageId: 'stage-1', frameIndex: 7 }
  return { stageId: 'stage-1', frameIndex: 2 }  // 3rd frame
}
