// [DEV FIXTURE] — replace with window.HoneyDB calls before production
import type { WorkRecordContext, WorkRecordColony, WorkRecordApiary } from './types'

export const MOCK_COLONIES: WorkRecordColony[] = [
  { id: 'A-01', name: 'A-01', apiaryId: 'apiary-1', apiaryName: '宮田養蜂場' },
  { id: 'A-02', name: 'A-02', apiaryId: 'apiary-1', apiaryName: '宮田養蜂場' },
  { id: 'A-03', name: 'A-03', apiaryId: 'apiary-1', apiaryName: '宮田養蜂場' },
  { id: 'A-04', name: 'A-04', apiaryId: 'apiary-1', apiaryName: '宮田養蜂場' },
  { id: 'A-05', name: 'A-05', apiaryId: 'apiary-1', apiaryName: '宮田養蜂場' },
  { id: 'B-01', name: 'B-01', apiaryId: 'apiary-1', apiaryName: '宮田養蜂場' },
  { id: 'B-02', name: 'B-02', apiaryId: 'apiary-2', apiaryName: '田中養蜂場' },
  { id: 'C-01', name: 'C-01', apiaryId: 'apiary-2', apiaryName: '田中養蜂場' },
]

export const MOCK_APIARIES: WorkRecordApiary[] = [
  { id: 'apiary-1', name: '宮田養蜂場' },
  { id: 'apiary-2', name: '田中養蜂場' },
]

export const FEED_TYPES = ['砂糖水', '糖液', '固形飼料', '花粉代替飼料', 'その他']

export const FEED_UNITS = ['mL', 'L']

export const LINKED_CONTEXT: WorkRecordContext = {
  taskId: 'task-001',
  taskName: 'B-01 給餌',
  colonyId: 'B-01',
  colonyName: 'B-01',
  apiaryId: 'apiary-1',
  apiaryName: '宮田養蜂場',
  workType: 'feed',
  dueDate: '2026-09-08',
  initialMemo: '群勢回復のため給餌。',
}

export const NEW_CONTEXT: WorkRecordContext = {}
