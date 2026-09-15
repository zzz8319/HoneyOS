// [DEV FIXTURE] — replace with window.HoneyDB calls before production
import type { WorkTask } from './types'

export const MOCK_TASKS: WorkTask[] = [
  {
    id: 'task-1',
    title: 'A-05 内検',
    tag: 'A-05',
    note: '前回内検から16日',
    dueDate: '2026-09-07',
    status: 'overdue',
    iconType: 'inspection',
  },
  {
    id: 'task-2',
    title: 'A-03 高温の原因を確認',
    tag: 'A-03',
    dueDate: '2026-09-14',
    status: 'today',
    iconType: 'thermometer',
  },
  {
    id: 'task-3',
    title: 'B-01 給餌',
    tag: 'B-01',
    dueDate: '2026-09-14',
    status: 'today',
    iconType: 'feeding',
  },
  {
    id: 'task-4',
    title: 'A-02 分蜂兆候を確認',
    tag: 'A-02',
    dueDate: '2026-09-15',
    status: 'tomorrow',
    iconType: 'sprout',
  },
  {
    id: 'task-5',
    title: '器具を消毒',
    tag: '宮田養蜂場',
    dueDate: '2026-09-17',
    status: 'upcoming',
    iconType: 'tool',
  },
  {
    id: 'task-6',
    title: 'A-01 採蜜',
    tag: 'A-01',
    dueDate: '2026-09-10',
    status: 'completed',
    iconType: 'inspection',
    completedAt: '2026-09-10',
  },
  {
    id: 'task-7',
    title: 'B-02 給餌',
    tag: 'B-02',
    dueDate: '2026-09-11',
    status: 'completed',
    iconType: 'feeding',
    completedAt: '2026-09-11',
  },
]
