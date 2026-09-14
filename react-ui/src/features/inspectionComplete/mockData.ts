import type { InspectionCompleteData, CompleteViewState } from './types'

const BASE_COMPARISON = [
  { key: 'bee'      as const, label: '蜂量',   current: 62, previous: 57 as number | null, unit: '%' },
  { key: 'brood'   as const, label: '育児量', current: 38, previous: 46 as number | null, unit: '%' },
  { key: 'honey'   as const, label: '貯蜜量', current: 54, previous: 51 as number | null, unit: '%' },
  { key: 'strength' as const, label: '簡易強さ', current: 58, previous: 64 as number | null, unit: '' },
]

const BASE: InspectionCompleteData = {
  inspectionId: 'insp-20260908-a05',
  colonyId: 'a05',
  colonyLabel: 'A-05',
  apiaryName: '宮田養蜂場',
  inspDate: '2026年9月8日（火）',
  weather: '晴れ',
  tempCelsius: 28,
  queenStatus: 'laying',
  estimatedBeeCount: 18500,
  strengthScore: 58,
  stageSummary: { stageCount: 2, totalFrames: 14, recordedFrames: 10 },
  previousInspDate: '2026/08/23',
  comparison: BASE_COMPARISON,
  aiDiagnosis: null,
  nextInspection: {
    daysBefore: 14,
    suggestedDate: '2026年9月22日（火）',
    userDate: null,
  },
}

export function getMockData(state: CompleteViewState): InspectionCompleteData | null {
  if (state === 'missing-record') return null

  switch (state) {
    case 'healthy':
      return {
        ...BASE,
        strengthScore: 74,
        comparison: [
          { key: 'bee',      label: '蜂量',   current: 72, previous: 65, unit: '%' },
          { key: 'brood',   label: '育児量', current: 55, previous: 50, unit: '%' },
          { key: 'honey',   label: '貯蜜量', current: 60, previous: 54, unit: '%' },
          { key: 'strength', label: '簡易強さ', current: 74, previous: 68, unit: '' },
        ],
      }

    case 'first-inspection':
      return {
        ...BASE,
        strengthScore: 62,
        previousInspDate: null,
        comparison: [
          { key: 'bee',      label: '蜂量',   current: 62, previous: null, unit: '%' },
          { key: 'brood',   label: '育児量', current: 50, previous: null, unit: '%' },
          { key: 'honey',   label: '貯蜜量', current: 55, previous: null, unit: '%' },
          { key: 'strength', label: '簡易強さ', current: 62, previous: null, unit: '' },
        ],
      }

    case 'ai-analyzed':
      return {
        ...BASE,
        aiDiagnosis: {
          analyzed: true,
          confidence: 'medium',
          summary: '女王蜂の産卵は確認されましたが、蜂量・育児量が前回より低下しています。',
        },
      }

    case 'reminder-off':
      return { ...BASE }

    default: // 'normal', 'loading', 'error', 'offline'
      return BASE
  }
}
