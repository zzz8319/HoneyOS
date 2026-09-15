// [DEV FIXTURE] — replace with window.HoneyDB calls before production
import type { Colony, Apiary, TaskCreateContext } from './types'

export const MOCK_COLONIES: Colony[] = [
  { id: 'A-01', name: 'A-01', apiaryId: 'apiary-1', apiaryName: '宮田養蜂場' },
  { id: 'A-02', name: 'A-02', apiaryId: 'apiary-1', apiaryName: '宮田養蜂場' },
  { id: 'A-03', name: 'A-03', apiaryId: 'apiary-1', apiaryName: '宮田養蜂場' },
  { id: 'A-04', name: 'A-04', apiaryId: 'apiary-1', apiaryName: '宮田養蜂場' },
  { id: 'A-05', name: 'A-05', apiaryId: 'apiary-1', apiaryName: '宮田養蜂場' },
  { id: 'B-01', name: 'B-01', apiaryId: 'apiary-2', apiaryName: '田中養蜂場' },
  { id: 'B-02', name: 'B-02', apiaryId: 'apiary-2', apiaryName: '田中養蜂場' },
]

export const MOCK_APIARIES: Apiary[] = [
  { id: 'apiary-1', name: '宮田養蜂場' },
  { id: 'apiary-2', name: '田中養蜂場' },
]

export const AI_CONTEXT: TaskCreateContext = {
  source: 'ai-recommendation',
  diagnosisResultId: 'diag-001',
  recommendationId: 'rec-001',
  inspectionId: 'insp-001',
  colonyId: 'A-03',
  apiaryId: 'apiary-1',
  initialTitle: 'A-03を再内検',
  initialDueDate: '2026-09-09',
  initialPriority: 'high',
  initialMemo: '成蜂と育児房を目視確認し、ダニ数を記録する。',
}

export const MANUAL_CONTEXT: TaskCreateContext = {
  source: 'manual',
}
