/**
 * DB アクセス境界
 * 直接 Supabase SDK を呼ばず、必ず window.HoneyDB 経由でアクセスする。
 * 将来 supabase_client.js が window.HoneyDB をセットしたら自動で接続される。
 */

// ── Settings-specific types ───────────────────────────────────────────────────

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
  // 認証 (legacy aliases kept for existing components)
  login(email: string, password: string): Promise<void>
  signUp(email: string, password: string, name: string): Promise<void>
  logout(): Promise<void>
  getSession(): Promise<{ user: { id: string; email: string } | null }>
  resetPassword(email: string): Promise<void>
  updatePassword(newPassword: string): Promise<void>

  // 認証 (actual window.HoneyDB methods)
  signIn(email: string, password: string): Promise<unknown>
  signOut(): Promise<void>
  getUserProfile(): Promise<{ name: string; farm_name: string } | null>
  updateProfile(name: string, farmName: string): Promise<void>

  // プロフィール (legacy alias)
  getProfile(): Promise<{ name: string; farm_name: string } | null>

  // 蜂群 (legacy aliases)
  getColonies(): Promise<Array<{ id: string; name: string; farm_id: number | null }>>
  saveColony(id: string, name: string, sortOrder: number): Promise<void>
  deleteColony(id: string): Promise<void>

  // 蜂群 (actual)
  loadColonies(): Promise<unknown[]>
  archiveColony(id: string): Promise<void>
  initDefaultColonies(ids: string[]): Promise<void>

  // 養蜂場 (legacy aliases)
  getFarms(): Promise<Array<{ id: number; name: string }>>
  saveFarm(data: { name: string; address: string; lat: number; lng: number }): Promise<{ id: number }>
  searchAddress?(query: string): Promise<Array<{ address: string; lat: number; lng: number }>>

  // 養蜂場 (actual)
  loadFarms(): Promise<unknown[]>
  archiveFarm(id: string): Promise<void>
  deleteFarm(id: string): Promise<void>

  // 内検記録 (legacy)
  getInspRecords(): Promise<unknown[]>
  saveInspRecord(record: unknown): Promise<{ id: number }>

  // 内検記録 (actual)
  loadInspRecords(): Promise<unknown[]>
  updateInspRecord(id: string, record: unknown): Promise<void>
  deleteInspRecord(id: string): Promise<void>

  // 作業記録 (legacy)
  getWorkRecords(): Promise<unknown[]>
  saveWorkRecord(record: unknown): Promise<{ id: number }>

  // 作業記録 (actual)
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
