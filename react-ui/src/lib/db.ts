/**
 * DB アクセス境界
 * 直接 Supabase SDK を呼ばず、必ず window.HoneyDB 経由でアクセスする。
 * 将来 supabase_client.js が window.HoneyDB をセットしたら自動で接続される。
 */

export interface HoneyDBClient {
  // 認証
  login(email: string, password: string): Promise<void>
  logout(): Promise<void>
  getSession(): Promise<{ user: { id: string; email: string } | null }>

  // プロフィール
  getProfile(): Promise<{ name: string; farm_name: string } | null>

  // 蜂群
  getColonies(): Promise<Array<{ id: string; name: string; farm_id: number | null }>>
  saveColony(id: string, name: string, sortOrder: number): Promise<void>
  deleteColony(id: string): Promise<void>

  // 養蜂場
  getFarms(): Promise<Array<{ id: number; name: string }>>

  // 内検記録
  getInspRecords(): Promise<unknown[]>
  saveInspRecord(record: unknown): Promise<{ id: number }>

  // 作業記録
  getWorkRecords(): Promise<unknown[]>
  saveWorkRecord(record: unknown): Promise<{ id: number }>
}

declare global {
  interface Window {
    HoneyDB: HoneyDBClient
  }
}

/** window.HoneyDB への参照を返す。未初期化時はエラーをスロー。 */
export function db(): HoneyDBClient {
  if (typeof window === 'undefined' || !window.HoneyDB) {
    throw new Error('HoneyDB is not initialized. Load supabase_client.js first.')
  }
  return window.HoneyDB
}
