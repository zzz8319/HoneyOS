export type NotificationType = 'inspection' | 'ai' | 'sensor' | 'system'

export type NotificationFilter = 'all' | 'unread' | 'inspection' | 'ai' | 'sensor'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  message: string
  occurredAt: string
  read: boolean
  colonyId?: string
  target?: string
  navigateTo?: 'inspection-start' | 'ai-diagnosis' | 'colony-detail' | null
}

export type NotificationCenterViewState =
  | 'normal'
  | 'unread-filter'
  | 'inspection-filter'
  | 'ai-filter'
  | 'sensor-filter'
  | 'all-read'
  | 'empty'
  | 'loading'
  | 'error'
  | 'offline-cached'
  | 'offline-no-cache'
  | 'long-content'
