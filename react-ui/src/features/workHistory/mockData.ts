// [DEV FIXTURE] — replace with window.HoneyDB calls before production
import type { WorkHistoryRecord, WorkHistoryApiary } from './types'

export const MOCK_APIARIES: WorkHistoryApiary[] = [
  { id: 'apiary-1', name: '宮田養蜂場' },
  { id: 'apiary-2', name: '田中養蜂場' },
]

export const MOCK_COLONIES = [
  { id: 'A-01', name: 'A-01', apiaryId: 'apiary-1' },
  { id: 'A-02', name: 'A-02', apiaryId: 'apiary-1' },
  { id: 'A-03', name: 'A-03', apiaryId: 'apiary-1' },
  { id: 'A-04', name: 'A-04', apiaryId: 'apiary-1' },
  { id: 'A-05', name: 'A-05', apiaryId: 'apiary-1' },
  { id: 'B-01', name: 'B-01', apiaryId: 'apiary-1' },
  { id: 'B-02', name: 'B-02', apiaryId: 'apiary-2' },
  { id: 'C-01', name: 'C-01', apiaryId: 'apiary-2' },
]

export const MOCK_RECORDS: WorkHistoryRecord[] = [
  {
    id: 'rec-001',
    workType: 'harvest',
    title: '採蜜',
    performedDate: '2026-09-07',
    performedTime: '14:20',
    apiaryId: 'apiary-1',
    apiaryName: '宮田養蜂場',
    colonyIds: ['A-01', 'A-02'],
    colonyLabels: ['A-01', 'A-02'],
    details: {
      harvestAmount: 12.4,
      harvestUnit: 'kg',
      process: '遠心分離',
    },
  },
  {
    id: 'rec-002',
    workType: 'feeding',
    title: '給餌',
    performedDate: '2026-09-06',
    performedTime: '10:30',
    apiaryId: 'apiary-1',
    apiaryName: '宮田養蜂場',
    colonyIds: ['B-01'],
    colonyLabels: ['B-01'],
    memo: '群勢回復のため給餌。',
    details: {
      feedType: '砂糖水',
      feedAmount: 1.0,
      feedUnit: 'L',
    },
  },
  {
    id: 'rec-003',
    workType: 'treatment',
    title: '治療',
    performedDate: '2026-09-02',
    performedTime: '09:15',
    apiaryId: 'apiary-1',
    apiaryName: '宮田養蜂場',
    colonyIds: ['A-03', 'A-04'],
    colonyLabels: ['A-03', 'A-04'],
    details: {
      treatmentName: 'アピバール',
      nextTreatmentDate: '2026-09-16',
    },
  },
  {
    id: 'rec-004',
    workType: 'swarming',
    title: '人工分蜂',
    performedDate: '2026-08-28',
    performedTime: '11:20',
    apiaryId: 'apiary-1',
    apiaryName: '宮田養蜂場',
    colonyIds: ['A-05'],
    colonyLabels: ['A-05'],
    details: {
      newColonyId: 'B-03',
    },
  },
  {
    id: 'rec-005',
    workType: 'wintering',
    title: '越冬準備',
    performedDate: '2026-08-20',
    performedTime: '16:40',
    apiaryId: 'apiary-1',
    apiaryName: '宮田養蜂場',
    colonyIds: [],
    colonyLabels: [],
  },
]
