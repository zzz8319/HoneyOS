export type WorkListViewState =
  | 'normal'
  | 'calendar-view'
  | 'empty'
  | 'loading'
  | 'error'
  | 'offline'
  | 'offline-no-cache'
  | 'completed-expanded'
  | 'overdue-filtered'
  | 'updating-completion'

export type TaskStatus = 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'completed'
export type TaskIconType = 'inspection' | 'thermometer' | 'feeding' | 'sprout' | 'tool'

export interface WorkTask {
  id: string
  title: string
  /** Colony ID tag (e.g. "A-05") or apiary name (e.g. "宮田養蜂場") */
  tag: string
  note?: string
  dueDate: string
  status: TaskStatus
  iconType: TaskIconType
  completedAt?: string
}

export type FilterStatus = '未完了' | '完了済み' | '全て'
export type FilterSort = '期限順' | '優先度順' | '作成日順'
