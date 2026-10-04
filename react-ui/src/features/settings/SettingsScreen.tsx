import { useState, useEffect, useCallback, useRef } from 'react'
import { BottomNav } from '../../components'
import type { TabId } from '../../components'
import { getDB } from '../../lib/db'
import type { NotificationSettings, UserPreferences } from '../../lib/db'
import {
  MOCK_PROFILE,
  MOCK_NOTIFICATIONS,
  MOCK_APP_SETTINGS,
  MOCK_DATA_STATUS_SYNCED,
  MOCK_DATA_STATUS_UNSYNCED,
  MOCK_DATA_STATUS_ERROR,
  APP_VERSION,
} from './mockData'
import type {
  SettingsProfile,
  AppSettings,
  AppTheme,
  AppLanguage,
  DefaultRecordType,
  DataStatus,
  SyncStatus,
} from './mockData'
import styles from './SettingsScreen.module.css'

// ── View state ────────────────────────────────────────────────────────────────
export type SettingsViewState =
  | 'normal'
  | 'profile-edit'
  | 'profile-saving'
  | 'profile-error'
  | 'notifications-disabled'
  | 'unsynced-data'
  | 'sync-error'
  | 'logout-confirm'
  | 'delete-confirm'
  | 'loading'
  | 'error'
  | 'offline'

// ── localStorage keys ─────────────────────────────────────────────────────────
const LS_THEME         = 'honeyos_react_theme'
const LS_LANGUAGE      = 'honeyos_react_language'
const LS_PREFS_KEY     = 'honeyos_user_prefs'
const LS_PREFS_USER_KEY = 'honeyos_prefs_user_id'
const LS_PREFS_SYNC_PENDING = 'honeyos_prefs_sync_pending'

// ── Pref sync status per field ────────────────────────────────────────────────
type PrefSyncStatus = '' | 'local' | 'pending' | 'failed'

// These init-time readers only use the legacy per-key localStorage entries,
// NOT the LS_PREFS_KEY blob, because at init time we don't yet know the
// current user ID and cannot safely apply another user's cached prefs.
// The useEffect on mount performs the user-ID-aware lookup from DB / LS_PREFS_KEY.
function readLSTheme(): AppTheme {
  try {
    const v = localStorage.getItem(LS_THEME)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch { /* ignore */ }
  return MOCK_APP_SETTINGS.theme
}

function readLSLanguage(): AppLanguage {
  try {
    const v = localStorage.getItem(LS_LANGUAGE)
    if (v === 'ja' || v === 'en') return v
  } catch { /* ignore */ }
  return MOCK_APP_SETTINGS.language
}

function readLSInspectionMode(): DefaultRecordType {
  return MOCK_APP_SETTINGS.defaultRecordType
}

/** Map UI DefaultRecordType to DB default_inspection_mode */
function toDbMode(t: DefaultRecordType): 'frame' | 'ratio' {
  return t === 'percentage' ? 'ratio' : 'frame'
}
/** Map DB default_inspection_mode to UI DefaultRecordType */
function fromDbMode(m: 'frame' | 'ratio'): DefaultRecordType {
  return m === 'ratio' ? 'percentage' : 'frame'
}

function resolveTheme(theme: AppTheme): 'light' | 'dark' {
  if (theme === 'light') return 'light'
  if (theme === 'dark') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: AppTheme) {
  if (typeof document === 'undefined') return
  const resolved = resolveTheme(theme)
  document.documentElement.setAttribute('data-theme', resolved)
}

function writeLSPrefs(prefs: Partial<UserPreferences>, userId: string) {
  try {
    const existing = localStorage.getItem(LS_PREFS_KEY)
    const current = existing ? (JSON.parse(existing) as Partial<UserPreferences>) : {}
    localStorage.setItem(LS_PREFS_KEY, JSON.stringify({ ...current, ...prefs }))
    localStorage.setItem(LS_PREFS_USER_KEY, userId)
    // Also keep legacy keys in sync
    if (prefs.theme) localStorage.setItem(LS_THEME, prefs.theme)
    if (prefs.language) localStorage.setItem(LS_LANGUAGE, prefs.language)
  } catch { /* ignore */ }
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface SettingsScreenProps {
  viewState: SettingsViewState
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  onColonyCreate: () => void
  onApiaryCreate: () => void
  onPasswordReset: () => void
  onLogout?: () => void
}

// ── Icons ────────────────────────────────────────────────────────────────────
function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

function Spinner() {
  return <div className={styles.spinner} role="status" aria-label="読み込み中" />
}

// ── Sync status helpers ───────────────────────────────────────────────────────
function getSyncLabel(status: SyncStatus): string {
  switch (status) {
    case 'synced':     return '同期済み'
    case 'syncing':    return '同期中…'
    case 'unsynced':   return '未送信'
    case 'sync-error': return '同期失敗'
    case 'offline':    return 'オフライン'
  }
}

function getSyncClassName(status: SyncStatus, styles: Record<string, string>): string {
  switch (status) {
    case 'synced':     return styles.syncBadgeOk
    case 'syncing':    return styles.syncBadgePending
    case 'unsynced':   return styles.syncBadgeWarn
    case 'sync-error': return styles.syncBadgeError
    case 'offline':    return styles.syncBadgeOffline
  }
}

// ── Toggle switch component ────────────────────────────────────────────────────
interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  disabled?: boolean
}
function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.toggleThumb} />
    </button>
  )
}

// ── Pref sync status label ────────────────────────────────────────────────────
function PrefSyncLabel({ status }: { status: PrefSyncStatus }) {
  if (!status) return null
  const text =
    status === 'local'   ? 'この端末に保存' :
    status === 'pending' ? '同期待ち' :
    status === 'failed'  ? '同期失敗' : ''
  if (!text) return null
  return <span className={styles.prefSyncNote} role="status">{text}</span>
}

// ── Main component ────────────────────────────────────────────────────────────
export function SettingsScreen({
  viewState,
  activeTab,
  onTabChange,
  onColonyCreate,
  onApiaryCreate,
  onPasswordReset,
  onLogout,
}: SettingsScreenProps) {
  const isOffline = viewState === 'offline'

  // Profile state
  const [profile, setProfile] = useState<SettingsProfile>(MOCK_PROFILE)
  const [editUsername, setEditUsername] = useState(MOCK_PROFILE.username)
  const [editApiaryName, setEditApiaryName] = useState(MOCK_PROFILE.primaryApiaryName)

  // Derived edit open/saving state
  const isSaving = viewState === 'profile-saving'

  // Local UI state for edit panel
  const [localEditOpen, setLocalEditOpen] = useState(
    viewState === 'profile-edit' || viewState === 'profile-saving' || viewState === 'profile-error',
  )
  const [localSaving, setLocalSaving] = useState(viewState === 'profile-saving')
  const [localSaveError, setLocalSaveError] = useState<string | null>(
    viewState === 'profile-error'
      ? '保存に失敗しました。通信状況を確認して再試行してください。'
      : null,
  )

  // Dialog state
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(
    viewState === 'logout-confirm',
  )
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(
    viewState === 'delete-confirm',
  )

  // Delete confirmation text input
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // Logout in-flight state
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  // Export in-flight state
  const [exportLoading, setExportLoading] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  // Notification state — loaded from HoneyDB on mount if available
  const [notifs, setNotifs] = useState<NotificationSettings>(MOCK_NOTIFICATIONS)
  const [notifSaveError, setNotifSaveError] = useState<string | null>(null)

  // App settings — theme/language from localStorage, defaultRecordType from mockData
  const [appSettings, setAppSettings] = useState<AppSettings>(() => ({
    theme: readLSTheme(),
    language: readLSLanguage(),
    defaultRecordType: readLSInspectionMode(),
  }))

  // Per-field sync status indicator
  const [themeSyncStatus, setThemeSyncStatus] = useState<PrefSyncStatus>('')
  const [langSyncStatus, setLangSyncStatus] = useState<PrefSyncStatus>('')
  const [modeSyncStatus, setModeSyncStatus] = useState<PrefSyncStatus>('')

  // "Saved locally" confirmation note (brief transient feedback)
  const [themeSavedLocal, setThemeSavedLocal] = useState(false)
  const [langSavedLocal, setLangSavedLocal] = useState(false)

  // pref sync feedback messages
  const [prefFeedback, setPrefFeedback] = useState<string | null>(null)
  const prefFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Data status
  const dataStatus: DataStatus =
    viewState === 'unsynced-data'
      ? MOCK_DATA_STATUS_UNSYNCED
      : viewState === 'sync-error'
        ? MOCK_DATA_STATUS_ERROR
        : { ...MOCK_DATA_STATUS_SYNCED, syncStatus: isOffline ? 'offline' : 'synced' }

  // Push permission denied state (from viewState or actual Notification API)
  const [actualPushDenied] = useState(() => {
    if (viewState === 'notifications-disabled') return true
    if (typeof Notification !== 'undefined' && Notification.permission === 'denied') return true
    return false
  })

  // ── On-mount: load data from HoneyDB ─────────────────────────────────────

  useEffect(() => {
    const db = getDB()
    if (!db) return

    // Load profile
    db.getUserProfile().then(p => {
      if (p) {
        setProfile(prev => ({
          ...prev,
          username: p.name || prev.username,
          primaryApiaryName: p.farm_name || prev.primaryApiaryName,
        }))
      }
    }).catch(() => { /* silent: keep mock */ })

    // Load notification settings
    db.getNotificationSettings().then(ns => {
      if (ns) setNotifs(ns)
    }).catch(() => { /* silent: keep mock */ })

    // Load user preferences
    ;(async () => {
      let currentUserId: string | null = null
      try {
        const session = await db.getSession() as unknown as { user?: { id: string } } | null
        currentUserId = session?.user?.id ?? null
      } catch { /* ignore */ }

      if (currentUserId) {
        try {
          const prefs = await db.getUserPreferences()
          setAppSettings(prev => ({
            ...prev,
            theme: prefs.theme,
            language: prefs.language,
            defaultRecordType: fromDbMode(prefs.default_inspection_mode),
          }))
          writeLSPrefs(prefs, currentUserId!)
          setThemeSyncStatus('')
          setLangSyncStatus('')
          setModeSyncStatus('')
          // Attempt pending sync if needed
          const isSyncPending = localStorage.getItem(LS_PREFS_SYNC_PENDING) === 'true'
          const cachedUserId = localStorage.getItem(LS_PREFS_USER_KEY)
          if (isSyncPending && cachedUserId === currentUserId) {
            try {
              const cachedRaw = localStorage.getItem(LS_PREFS_KEY)
              if (cachedRaw) {
                const cached = JSON.parse(cachedRaw) as Partial<UserPreferences>
                await db.updateUserPreferences(cached)
                localStorage.removeItem(LS_PREFS_SYNC_PENDING)
                showPrefFeedback('同期完了')
              }
            } catch { /* keep pending */ }
          }
        } catch {
          // DB failed — fall back to localStorage if same user
          try {
            const cachedUserId = localStorage.getItem(LS_PREFS_USER_KEY)
            if (cachedUserId === currentUserId) {
              const cachedRaw = localStorage.getItem(LS_PREFS_KEY)
              if (cachedRaw) {
                const cached = JSON.parse(cachedRaw) as Partial<UserPreferences>
                if (cached.theme) setAppSettings(prev => ({ ...prev, theme: cached.theme as AppTheme }))
                if (cached.language) setAppSettings(prev => ({ ...prev, language: cached.language as AppLanguage }))
                if (cached.default_inspection_mode) setAppSettings(prev => ({ ...prev, defaultRecordType: fromDbMode(cached.default_inspection_mode as 'frame' | 'ratio') }))
              }
            }
          } catch { /* ignore */ }
        }
      }
    })()
  }, [])

  // Apply theme on mount and whenever it changes
  useEffect(() => {
    applyTheme(appSettings.theme)
  }, [appSettings.theme])

  // OS theme detection when theme === 'system'
  useEffect(() => {
    if (appSettings.theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [appSettings.theme])

  function showPrefFeedback(msg: string) {
    setPrefFeedback(msg)
    if (prefFeedbackTimer.current) clearTimeout(prefFeedbackTimer.current)
    prefFeedbackTimer.current = setTimeout(() => setPrefFeedback(null), 2000)
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleEditOpen() {
    setEditUsername(profile.username)
    setEditApiaryName(profile.primaryApiaryName)
    setLocalSaveError(null)
    setLocalEditOpen(true)
  }

  function handleEditCancel() {
    setEditUsername(profile.username)
    setEditApiaryName(profile.primaryApiaryName)
    setLocalEditOpen(false)
    setLocalSaveError(null)
  }

  async function handleEditSave() {
    if (!editUsername.trim()) {
      setLocalSaveError('ユーザー名を入力してください')
      return
    }
    if (isOffline) {
      setLocalSaveError('オフラインのため保存できません。接続後にお試しください。')
      return
    }
    setLocalSaving(true)
    setLocalSaveError(null)
    try {
      const db = getDB()
      if (db) {
        await db.updateProfile(editUsername.trim(), editApiaryName.trim())
      }
      setProfile({ ...profile, username: editUsername.trim(), primaryApiaryName: editApiaryName.trim() })
      setLocalEditOpen(false)
    } catch {
      setLocalSaveError('保存に失敗しました。通信状況を確認して再試行してください。')
    } finally {
      setLocalSaving(false)
    }
  }

  const handleNotifToggle = useCallback(async (key: keyof NotificationSettings) => {
    const next = { ...notifs, [key]: !notifs[key] }
    setNotifs(next)
    setNotifSaveError(null)
    const db = getDB()
    if (!db) return
    try {
      await db.updateNotificationSettings(next)
    } catch {
      // Revert on failure
      setNotifs(notifs)
      setNotifSaveError('通知設定の保存に失敗しました')
    }
  }, [notifs])

  async function handleThemeChange(theme: AppTheme) {
    // Apply immediately to UI — do NOT wait for DB
    setAppSettings(prev => ({ ...prev, theme }))
    setThemeSavedLocal(false)
    const db = getDB()
    if (!db) {
      try { localStorage.setItem(LS_THEME, theme) } catch { /* ignore */ }
      return
    }
    try {
      await db.updateUserPreferences({ theme })
      const session = await db.getSession() as unknown as { user?: { id: string } } | null
      const uid = session?.user?.id
      if (uid) writeLSPrefs({ theme }, uid)
      setThemeSyncStatus('')
      showPrefFeedback('サーバーに保存しました')
    } catch {
      try {
        const uid = localStorage.getItem(LS_PREFS_USER_KEY) ?? ''
        writeLSPrefs({ theme }, uid)
        localStorage.setItem(LS_PREFS_SYNC_PENDING, 'true')
      } catch { /* ignore */ }
      setThemeSyncStatus('pending')
      showPrefFeedback('この端末に保存しました（同期待ち）')
    }
  }

  async function handleLanguageChange(language: AppLanguage) {
    // Apply immediately to UI — do NOT wait for DB
    setAppSettings(prev => ({ ...prev, language }))
    setLangSavedLocal(false)
    const db = getDB()
    if (!db) {
      try { localStorage.setItem(LS_LANGUAGE, language) } catch { /* ignore */ }
      return
    }
    try {
      await db.updateUserPreferences({ language })
      const session = await db.getSession() as unknown as { user?: { id: string } } | null
      const uid = session?.user?.id
      if (uid) writeLSPrefs({ language }, uid)
      setLangSyncStatus('')
      showPrefFeedback('サーバーに保存しました')
    } catch {
      try {
        const uid = localStorage.getItem(LS_PREFS_USER_KEY) ?? ''
        writeLSPrefs({ language }, uid)
        localStorage.setItem(LS_PREFS_SYNC_PENDING, 'true')
      } catch { /* ignore */ }
      setLangSyncStatus('pending')
      showPrefFeedback('この端末に保存しました（同期待ち）')
    }
  }

  async function handleDefaultRecordTypeChange(defaultRecordType: DefaultRecordType) {
    // Apply immediately to UI — do NOT wait for DB
    setAppSettings(prev => ({ ...prev, defaultRecordType }))
    const db = getDB()
    const dbMode = toDbMode(defaultRecordType)
    if (!db) return
    try {
      await db.updateUserPreferences({ default_inspection_mode: dbMode })
      const session = await db.getSession() as unknown as { user?: { id: string } } | null
      const uid = session?.user?.id
      if (uid) writeLSPrefs({ default_inspection_mode: dbMode }, uid)
      setModeSyncStatus('')
      showPrefFeedback('サーバーに保存しました')
    } catch {
      try {
        const uid = localStorage.getItem(LS_PREFS_USER_KEY) ?? ''
        writeLSPrefs({ default_inspection_mode: dbMode }, uid)
        localStorage.setItem(LS_PREFS_SYNC_PENDING, 'true')
      } catch { /* ignore */ }
      setModeSyncStatus('pending')
      showPrefFeedback('この端末に保存しました（同期待ち）')
    }
  }

  async function handleLogout() {
    if (isOffline) {
      setLogoutError('オフラインのためログアウトできません。接続後にお試しください。')
      return
    }
    setLogoutLoading(true)
    setLogoutError(null)
    try {
      const db = getDB()
      if (db) {
        await db.signOut()
      }
      setLogoutDialogOpen(false)
      onLogout?.()
    } catch {
      setLogoutError('ログアウトに失敗しました。通信状況を確認して再試行してください。')
    } finally {
      setLogoutLoading(false)
    }
  }

  async function handleExport() {
    if (isOffline) {
      setExportError('オフラインのためエクスポートできません。接続後にお試しください。')
      return
    }
    const db = getDB()
    if (!db) {
      setExportError('データベース接続が利用できません')
      return
    }
    setExportLoading(true)
    setExportError(null)
    try {
      const data = await db.exportAllData()
      const json = JSON.stringify(
        {
          formatVersion: '1.0',
          ...data,
        },
        null,
        2,
      )
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const date = new Date().toISOString().slice(0, 10)
      const a = document.createElement('a')
      a.href = url
      a.download = `honeyos-export-${date}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      setExportError('エクスポートに失敗しました。通信状況を確認して再試行してください。')
    } finally {
      setExportLoading(false)
    }
  }

  function handleDeleteAccount() {
    // No safe server-side deletion API — keep button disabled
    // This handler is never reached because the button is always disabled
    setDeleteDialogOpen(false)
  }

  // ── Special states ─────────────────────────────────────────────────────────

  if (viewState === 'loading') {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <div className={styles.headerSpacer} />
          <h1 className={styles.headerTitle}>設定</h1>
          <div className={styles.headerSpacer} />
        </header>
        <div className={styles.loadingBody}>
          <Spinner />
          <p className={styles.loadingText}>設定を読み込み中…</p>
        </div>
        <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    )
  }

  if (viewState === 'error') {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <div className={styles.headerSpacer} />
          <h1 className={styles.headerTitle}>設定</h1>
          <div className={styles.headerSpacer} />
        </header>
        <div className={styles.errorBody} role="alert">
          <p className={styles.errorTitle}>設定を取得できませんでした</p>
          <p className={styles.errorText}>ネットワーク接続を確認してから再度お試しください。</p>
          <button className={styles.retryBtn}>再試行</button>
        </div>
        <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    )
  }

  const pushDenied = actualPushDenied
  // Whether export button is available (HoneyDB must be initialized)
  const exportAvailable = getDB() != null

  // ── Main layout ────────────────────────────────────────────────────────────
  return (
    <div className={styles.screen}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerSpacer} />
        <h1 className={styles.headerTitle}>設定</h1>
        <div className={styles.headerSpacer} />
      </header>

      {/* Offline banner */}
      {isOffline && (
        <div className={styles.offlineBanner} role="status" aria-live="polite">
          オフライン — 一部の操作は利用できません
        </div>
      )}

      {/* Scrollable content */}
      <div className={styles.body}>

        {/* ── Profile section ── */}
        <section className={styles.section} aria-label="プロフィール">
          <div className={styles.profileCard}>
            <div className={styles.profileInfo}>
              <p className={styles.profileName}>{profile.username}</p>
              <p className={styles.profileEmail}>{profile.email}</p>
              <p className={styles.profileApiary}>{profile.primaryApiaryName}</p>
            </div>
            <button
              className={styles.editBtn}
              aria-label="プロフィールを編集"
              onClick={handleEditOpen}
              disabled={isSaving}
            >
              編集
            </button>
          </div>

          {/* Inline profile edit form */}
          {localEditOpen && (
            <div className={styles.editForm} role="form" aria-label="プロフィール編集">
              {localSaveError && (
                <p className={styles.editError} role="alert">{localSaveError}</p>
              )}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="edit-username">ユーザー名</label>
                <input
                  id="edit-username"
                  type="text"
                  className={styles.fieldInput}
                  value={editUsername}
                  onChange={e => setEditUsername(e.target.value)}
                  disabled={localSaving}
                  autoComplete="name"
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="edit-apiary">養蜂場名</label>
                <input
                  id="edit-apiary"
                  type="text"
                  className={styles.fieldInput}
                  value={editApiaryName}
                  onChange={e => setEditApiaryName(e.target.value)}
                  disabled={localSaving}
                  autoComplete="organization"
                />
              </div>
              <div className={styles.editActions}>
                <button
                  className={styles.cancelBtn}
                  onClick={handleEditCancel}
                  disabled={localSaving}
                >
                  キャンセル
                </button>
                <button
                  className={styles.saveBtn}
                  onClick={handleEditSave}
                  disabled={localSaving || isOffline}
                >
                  {localSaving ? '保存中…' : isOffline ? '同期待ち' : '保存'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ── Account section ── */}
        <section className={styles.section} aria-label="アカウント">
          <p className={styles.sectionLabel}>アカウント</p>
          <div className={styles.rowList}>
            <button className={styles.row} onClick={handleEditOpen} aria-label="プロフィールを編集">
              <span className={styles.rowText}>プロフィールを編集</span>
              <ChevronRightIcon />
            </button>
            <button
              className={styles.row}
              onClick={onPasswordReset}
              aria-label="パスワードを再設定"
            >
              <span className={styles.rowText}>パスワードを再設定</span>
              <ChevronRightIcon />
            </button>
            <button
              className={styles.row}
              aria-label="ログアウト"
              onClick={() => { setLogoutError(null); setLogoutDialogOpen(true) }}
              disabled={isSaving}
            >
              <span className={styles.rowText}>ログアウト</span>
              <ChevronRightIcon />
            </button>
            <button
              className={`${styles.row} ${styles.rowDanger}`}
              aria-label="アカウントを削除"
              onClick={() => { setDeleteConfirmText(''); setDeleteDialogOpen(true) }}
              disabled={isSaving}
            >
              <span className={styles.rowText}>アカウントを削除</span>
              <ChevronRightIcon />
            </button>
          </div>
        </section>

        {/* ── Notifications section ── */}
        <section className={styles.section} aria-label="通知設定">
          <p className={styles.sectionLabel}>通知設定</p>
          {/* VAPID key not configured — push is localStorage-only placeholder */}
          <p className={styles.pushReadyNote} role="note">
            プッシュ通知は現在準備中です
          </p>
          {pushDenied && (
            <p className={styles.pushDeniedNote} role="note">
              ブラウザの通知が許可されていません。端末の設定からHoneyOSの通知を許可してください。
            </p>
          )}
          {notifSaveError && (
            <p className={styles.actionError} role="alert">{notifSaveError}</p>
          )}
          <div className={styles.rowList}>
            <div className={styles.toggleRow}>
              <div className={styles.toggleRowText}>
                <span className={styles.rowText}>内検リマインダー</span>
                <span className={styles.rowDesc}>内検の予定時刻前にお知らせします</span>
              </div>
              <Toggle
                checked={notifs.inspectionReminder}
                onChange={() => handleNotifToggle('inspectionReminder')}
                label="内検リマインダーを切り替え"
                disabled={pushDenied}
              />
            </div>
            <div className={styles.toggleRow}>
              <div className={styles.toggleRowText}>
                <span className={styles.rowText}>AI診断完了</span>
                <span className={styles.rowDesc}>AI診断が完了したときにお知らせします</span>
              </div>
              <Toggle
                checked={notifs.aiDiagnosisComplete}
                onChange={() => handleNotifToggle('aiDiagnosisComplete')}
                label="AI診断完了通知を切り替え"
                disabled={pushDenied}
              />
            </div>
            <div className={styles.toggleRow}>
              <div className={styles.toggleRowText}>
                <span className={styles.rowText}>センサー異常アラート</span>
                <span className={styles.rowDesc}>センサーが異常値を検知したときにお知らせします</span>
              </div>
              <Toggle
                checked={notifs.sensorAlert}
                onChange={() => handleNotifToggle('sensorAlert')}
                label="センサー異常アラートを切り替え"
                disabled={pushDenied}
              />
            </div>
            <div className={styles.toggleRow}>
              <div className={styles.toggleRowText}>
                <span className={styles.rowText}>システムお知らせ</span>
                <span className={styles.rowDesc}>アプリの更新・重要なお知らせを通知します</span>
              </div>
              <Toggle
                checked={notifs.systemAnnouncement}
                onChange={() => handleNotifToggle('systemAnnouncement')}
                label="システムお知らせを切り替え"
                disabled={pushDenied}
              />
            </div>
          </div>
        </section>

        {/* ── App settings section ── */}
        <section className={styles.section} aria-label="アプリ設定">
          <p className={styles.sectionLabel}>アプリ設定</p>
          {prefFeedback && (
            <p className={styles.localSavedNote} role="status">{prefFeedback}</p>
          )}
          <div className={styles.rowList}>
            <div className={styles.settingRow}>
              <span className={styles.rowText}>テーマ</span>
              <div className={styles.segmentControl} role="group" aria-label="テーマを選択">
                {(['light', 'dark', 'system'] as AppTheme[]).map(t => (
                  <button
                    key={t}
                    className={`${styles.segmentBtn} ${appSettings.theme === t ? styles.segmentBtnActive : ''}`}
                    aria-pressed={appSettings.theme === t}
                    onClick={() => handleThemeChange(t)}
                  >
                    {t === 'light' ? 'ライト' : t === 'dark' ? 'ダーク' : 'システム'}
                  </button>
                ))}
              </div>
            </div>
            <PrefSyncLabel status={themeSyncStatus} />
            {themeSavedLocal && (
              <p className={styles.localSavedNote} role="status">この端末に保存しました</p>
            )}
            <div className={styles.settingRow}>
              <div>
                <span className={styles.rowText}>言語</span>
                <span className={styles.rowDesc}>English表示は翻訳が未完了の箇所があります</span>
              </div>
              <div className={styles.segmentControl} role="group" aria-label="言語を選択">
                {(['ja', 'en'] as AppLanguage[]).map(lang => (
                  <button
                    key={lang}
                    className={`${styles.segmentBtn} ${appSettings.language === lang ? styles.segmentBtnActive : ''}`}
                    aria-pressed={appSettings.language === lang}
                    onClick={() => handleLanguageChange(lang)}
                  >
                    {lang === 'ja' ? '日本語' : 'English'}
                  </button>
                ))}
              </div>
            </div>
            <PrefSyncLabel status={langSyncStatus} />
            {appSettings.language === 'en' && (
              <p className={styles.localSavedNote} role="note">
                一部の画面はまだ日本語のみ対応しています
              </p>
            )}
            {langSavedLocal && appSettings.language === 'ja' && (
              <p className={styles.localSavedNote} role="status">この端末に保存しました</p>
            )}
          </div>
        </section>

        {/* ── Beekeeping settings section ── */}
        <section className={styles.section} aria-label="養蜂設定">
          <p className={styles.sectionLabel}>養蜂設定</p>
          <div className={styles.rowList}>
            <div className={styles.settingRow}>
              <span className={styles.rowText}>デフォルト記録方式</span>
              <div className={styles.segmentControl} role="group" aria-label="記録方式を選択">
                {(['frame', 'percentage'] as DefaultRecordType[]).map(t => (
                  <button
                    key={t}
                    className={`${styles.segmentBtn} ${appSettings.defaultRecordType === t ? styles.segmentBtnActive : ''}`}
                    aria-pressed={appSettings.defaultRecordType === t}
                    onClick={() => handleDefaultRecordTypeChange(t)}
                  >
                    {t === 'frame' ? '枠式' : '割合式'}
                  </button>
                ))}
              </div>
            </div>
            <PrefSyncLabel status={modeSyncStatus} />
            <div className={styles.infoRow}>
              <span className={styles.rowText}>蜂群の強さ指標</span>
              <span className={styles.infoRowValue}>現在：簡易指標β</span>
            </div>
          </div>
        </section>

        {/* ── Data management section ── */}
        <section className={styles.section} aria-label="データ管理">
          <p className={styles.sectionLabel}>データ管理</p>

          {/* Sync status */}
          {(viewState === 'unsynced-data' || viewState === 'sync-error') && (
            <div className={styles.syncBanner} role="status">
              <span>
                {viewState === 'unsynced-data'
                  ? `未送信のデータが ${dataStatus.unsyncedCount} 件あります`
                  : `同期に失敗しました（未送信 ${dataStatus.unsyncedCount} 件）`}
              </span>
              {!isOffline && (
                <button className={styles.syncRetryBtn}>
                  {viewState === 'sync-error' ? '再試行' : '今すぐ同期'}
                </button>
              )}
            </div>
          )}

          {exportError && (
            <p className={styles.actionError} role="alert">{exportError}</p>
          )}

          <div className={styles.rowList}>
            <button className={styles.row} onClick={onColonyCreate} aria-label="蜂群を追加">
              <span className={styles.rowText}>蜂群を追加</span>
              <ChevronRightIcon />
            </button>
            <button className={styles.row} onClick={onApiaryCreate} aria-label="養蜂場を追加">
              <span className={styles.rowText}>養蜂場を追加</span>
              <ChevronRightIcon />
            </button>
            {exportAvailable ? (
              <button
                className={styles.row}
                aria-label="データエクスポート"
                onClick={handleExport}
                disabled={exportLoading || isOffline}
              >
                <span className={styles.rowText}>データエクスポート</span>
                {exportLoading
                  ? <span className={styles.rowBadge}>出力中…</span>
                  : <ChevronRightIcon />}
              </button>
            ) : (
              <button
                className={`${styles.row} ${styles.rowDisabled}`}
                aria-label="データエクスポート（準備中）"
                disabled
              >
                <span className={styles.rowText}>データエクスポート</span>
                <span className={styles.rowBadge}>準備中</span>
              </button>
            )}
            <div className={styles.infoRow}>
              <span className={styles.rowText}>同期状態</span>
              <span className={getSyncClassName(dataStatus.syncStatus, styles)}>
                {getSyncLabel(dataStatus.syncStatus)}
              </span>
            </div>
            <button
              className={`${styles.row} ${styles.rowDisabled}`}
              aria-label="アーカイブ・ゴミ箱（準備中）"
              disabled
            >
              <span className={styles.rowText}>アーカイブ・ゴミ箱</span>
              <span className={styles.rowBadge}>準備中</span>
            </button>
          </div>
        </section>

        {/* ── App info section ── */}
        <section className={styles.section} aria-label="アプリ情報">
          <p className={styles.sectionLabel}>アプリ情報</p>
          <div className={styles.rowList}>
            <button
              className={`${styles.row} ${styles.rowDisabled}`}
              aria-label="お問い合わせ・フィードバック（近日公開）"
              disabled
            >
              <span className={styles.rowText}>お問い合わせ・フィードバック</span>
              <span className={styles.rowBadge}>近日公開</span>
            </button>
            <button
              className={`${styles.row} ${styles.rowDisabled}`}
              aria-label="利用規約（近日公開）"
              disabled
            >
              <span className={styles.rowText}>利用規約</span>
              <span className={styles.rowBadge}>近日公開</span>
            </button>
            <button
              className={`${styles.row} ${styles.rowDisabled}`}
              aria-label="プライバシーポリシー（近日公開）"
              disabled
            >
              <span className={styles.rowText}>プライバシーポリシー</span>
              <span className={styles.rowBadge}>近日公開</span>
            </button>
            <div className={styles.infoRow}>
              <span className={styles.rowText}>アプリバージョン</span>
              <span className={styles.versionText}>{APP_VERSION}</span>
            </div>
          </div>
        </section>

        <div className={styles.bodyEnd} />
      </div>

      {/* ── BottomNav ── */}
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />

      {/* ── Logout confirmation dialog ── */}
      {logoutDialogOpen && (
        <div className={styles.dialogOverlay} role="dialog" aria-modal="true" aria-label="ログアウト確認">
          <div className={styles.dialog}>
            <h2 className={styles.dialogTitle}>ログアウトしますか？</h2>
            <p className={styles.dialogBody}>ログアウトすると、オフラインでのデータアクセスが無効になります。</p>
            {logoutError && (
              <p className={styles.actionError} role="alert">{logoutError}</p>
            )}
            <div className={styles.dialogActions}>
              <button
                className={styles.dialogCancelBtn}
                onClick={() => { setLogoutDialogOpen(false); setLogoutError(null) }}
                disabled={logoutLoading}
              >
                キャンセル
              </button>
              <button
                className={styles.dialogDestructiveBtn}
                onClick={handleLogout}
                disabled={isOffline || logoutLoading}
              >
                {logoutLoading ? 'ログアウト中…' : isOffline ? '接続が必要です' : 'ログアウト'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete account confirmation dialog ── */}
      {deleteDialogOpen && (
        <div className={styles.dialogOverlay} role="dialog" aria-modal="true" aria-label="アカウント削除確認">
          <div className={styles.dialog}>
            <h2 className={styles.dialogTitle}>アカウントを削除しますか？</h2>
            <p className={styles.dialogBody}>
              この操作は取り消せません。すべてのデータが削除されます。
            </p>
            <p className={styles.dialogBodyNote}>
              アカウント削除には管理者への連絡が必要です。
            </p>
            <label className={styles.dialogBody} htmlFor="delete-confirm-input">
              確認のため「削除」と入力してください
            </label>
            <input
              id="delete-confirm-input"
              type="text"
              className={styles.deleteConfirmInput}
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="削除"
              aria-label="削除確認テキスト入力"
            />
            <div className={styles.dialogActions}>
              <button className={styles.dialogCancelBtn} onClick={() => { setDeleteDialogOpen(false); setDeleteConfirmText('') }}>
                キャンセル
              </button>
              <button
                className={styles.dialogDestructiveBtn}
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== '削除' || isOffline}
                aria-disabled={deleteConfirmText !== '削除' || isOffline}
              >
                削除（管理者へ連絡）
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
