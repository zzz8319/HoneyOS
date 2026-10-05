// Mock data for SCR-031 Settings screen (dev/test fixture)

export interface SettingsProfile {
  username: string
  email: string
  primaryApiaryName: string
}

export interface SettingsNotifications {
  inspectionReminder: boolean
  aiDiagnosisComplete: boolean
  sensorAlert: boolean
  systemAnnouncement: boolean
}

export type AppTheme = 'light' | 'dark' | 'system'
export type AppLanguage = 'ja' | 'en'
export type DefaultRecordType = 'frame' | 'percentage'

export interface AppSettings {
  theme: AppTheme
  language: AppLanguage
  defaultRecordType: DefaultRecordType
}

export type SyncStatus = 'synced' | 'syncing' | 'unsynced' | 'sync-error' | 'offline'

export interface DataStatus {
  syncStatus: SyncStatus
  unsyncedCount: number
  lastSyncedAt: string | null
}

export const MOCK_PROFILE: SettingsProfile = {
  username: '山田 太郎',
  email: 'yamada.taro@example.com',
  primaryApiaryName: '山田養蜂場',
}

export const MOCK_NOTIFICATIONS: SettingsNotifications = {
  inspectionReminder: true,
  aiDiagnosisComplete: true,
  sensorAlert: false,
  systemAnnouncement: true,
}

export const MOCK_APP_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'ja',
  defaultRecordType: 'frame',
}

export const MOCK_DATA_STATUS_SYNCED: DataStatus = {
  syncStatus: 'synced',
  unsyncedCount: 0,
  lastSyncedAt: '2026-10-04T08:30:00Z',
}

export const MOCK_DATA_STATUS_UNSYNCED: DataStatus = {
  syncStatus: 'unsynced',
  unsyncedCount: 3,
  lastSyncedAt: '2026-10-03T12:00:00Z',
}

export const MOCK_DATA_STATUS_ERROR: DataStatus = {
  syncStatus: 'sync-error',
  unsyncedCount: 2,
  lastSyncedAt: '2026-10-03T12:00:00Z',
}

export const APP_VERSION = '1.0.0-beta'
