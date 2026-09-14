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

export type TaskPriority = 'high' | 'medium' | 'low'
export type TaskStatus = 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'completed'

export interface WorkTask {
  id: string
  title: string
  colonyId?: string
  colonyName?: string
  apiaryName?: string
  dueDate: string // ISO date string
  status: TaskStatus
  priority: TaskPriority
  category: string
  completedAt?: string
}

export type FilterStatus = '未完了' | '完了済み' | '全て'
export type FilterApiary = '全養蜂場' | string
export type FilterSort = '期限順' | '優先度順' | '作成日順'
