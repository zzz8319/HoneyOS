/**
 * DB アクセス境界
 * 直接 Supabase SDK を呼ばず、必ず window.HoneyDB 経由でアクセスする。
 * 将来 supabase_client.js が window.HoneyDB をセットしたら自動で接続される。
 */

// ── Settings-specific types ───────────────────────────────────────────────────

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: 'ja' | 'en'
  default_inspection_mode: 'frame' | 'ratio'
}

export interface NotificationSettings {
  inspectionReminder: boolean
  aiDiagnosisComplete: boolean
  sensorAlert: boolean
  systemAnnouncement: boolean
}

export interface ExportData {
  exportedAt: string
  profile: { name: string; farm_name: string } | null
  inspRecords: unknown[]
  workRecords: unknown[]
  tasks: unknown[]
}

// ── HoneyDBClient interface ───────────────────────────────────────────────────

export interface HoneyDBClient {
  // 認証
  signIn(email: string, password: string): Promise<unknown>
  signUp(email: string, password: string, name: string, farmName?: string): Promise<unknown>
  signOut(): Promise<void>
  getSession(): Promise<{ user: { id: string; email: string } | null }>
  getUserProfile(): Promise<{ name: string; farm_name: string } | null>
  updateProfile(name: string, farmName: string): Promise<void>
  resetPassword(email: string): Promise<void>

  // 蜂群
  loadColonies(): Promise<unknown[]>
  saveColony(id: string, name: string, sortOrder: number, opts?: { farmId?: string; colonyType?: string }): Promise<void>
  archiveColony(id: string): Promise<void>
  deleteColony(id: string): Promise<void>
  initDefaultColonies(ids: string[]): Promise<void>

  // 養蜂場
  loadFarms(): Promise<unknown[]>
  saveFarm(name: string, id?: string | null | undefined, opts?: { latitude?: number | null; longitude?: number | null }): Promise<void>
  archiveFarm(id: string): Promise<void>
  deleteFarm(id: string): Promise<void>
  searchAddress?(query: string): Promise<Array<{ address: string; lat: number; lng: number }>>

  // 内検記録
  loadInspRecords(): Promise<unknown[]>
  updateInspRecord(id: string, record: unknown): Promise<void>
  deleteInspRecord(id: string): Promise<void>

  // 作業記録
  loadWorkRecords(): Promise<unknown[]>
  updateWorkRecord(id: string, record: unknown): Promise<void>
  deleteWorkRecord(id: string): Promise<void>

  // タスク
  loadTasks(): Promise<unknown[]>
  getTasks(): Promise<unknown[]>
  saveTask(task: unknown): Promise<string | null>
  updateTask(id: string, task: unknown): Promise<void>
  completeTask(id: string): Promise<void>
  deleteTask(id: string): Promise<void>

  // Push通知
  savePushSubscription(sub: PushSubscription): Promise<void>
  deletePushSubscription(endpoint: string): Promise<void>

  // 通知設定 (settings)
  getNotificationSettings(): Promise<NotificationSettings | null>
  updateNotificationSettings(settings: NotificationSettings): Promise<void>

  // ユーザー設定 (settings)
  getUserPreferences(): Promise<UserPreferences>
  updateUserPreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences>

  // データエクスポート (settings)
  exportAllData(): Promise<ExportData>

  // ベンチマーク
  upsertBenchmark(avgHealth: number, colonyCount: number): Promise<void>
  loadBenchmarkStats(): Promise<{ avgAll: number; totalUsers: number; totalColonies: number } | null>

  // Realtime
  subscribeRealtime(
    onInspChange: (data: unknown[]) => void,
    onWorkChange: (data: unknown[]) => void,
    onTaskChange?: (data: unknown[]) => void,
  ): void
  unsubscribeRealtime(): void
}

declare global {
  interface Window {
    HoneyDB: HoneyDBClient
  }
}

/** window.HoneyDB への参照を返す。未初期化時は null を返す（安全）。 */
export function getDB(): HoneyDBClient | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & { HoneyDB?: HoneyDBClient }
  return w.HoneyDB ?? null
}

/** window.HoneyDB への参照を返す。未初期化時はエラーをスロー。 */
export function db(): HoneyDBClient {
  const client = getDB()
  if (!client) {
    throw new Error('HoneyDB is not initialized. Load supabase_client.js first.')
  }
  return client
}
