import { useState, useEffect } from 'react'
import { DashboardScreen } from './features/dashboard'
import type { DashboardViewState } from './features/dashboard'
import { ColonySummaryScreen } from './features/colonyList'
import type { ColonyListViewState } from './features/colonyList'
import { ColonyDetailScreen } from './features/colonyDetail'
import type { ColonyDetailViewState } from './features/colonyDetail'
import { InspectionStartScreen } from './features/inspectionStart'
import type { InspectionStartViewState } from './features/inspectionStart'
import { InspectionRecordScreen } from './features/inspectionRecord'
import type { RecordViewState } from './features/inspectionRecord'
import { FrameViewerScreen } from './features/frameViewer'
import type { ViewerViewState } from './features/frameViewer'
import type { InspectionRecord } from './features/frameViewer/types'
import { AddStageScreen } from './features/addStage'
import { ApiaryMapScreen } from './features/apiaryMap'
import type { ApiaryMapViewState } from './features/apiaryMap'
import { InspectionCompleteScreen } from './features/inspectionComplete'
import type { CompleteViewState, InspectionCompleteData } from './features/inspectionComplete'
import { CameraImagesScreen } from './features/cameraImages'
import type { CameraViewState } from './features/cameraImages'
import { AiAnalysisScreen } from './features/aiAnalysis'
import type { AiAnalysisViewState } from './features/aiAnalysis'
import { AiDiagnosisScreen } from './features/aiDiagnosis'
import type { DiagnosisViewState } from './features/aiDiagnosis'
import { RecommendedWorkScreen } from './features/recommendedWork'
import type { RecommendedWorkState } from './features/recommendedWork'
import { WorkListScreen } from './features/workList'
import type { WorkListViewState } from './features/workList'
import { TaskCreateScreen } from './features/taskCreate'
import type { TaskCreateViewState } from './features/taskCreate'
import { WorkRecordScreen } from './features/workRecord'
import type { WorkRecordViewState } from './features/workRecord'
import { WorkHistoryScreen } from './features/workHistory'
import type { WorkHistoryViewState } from './features/workHistory'
import { ReportScreen } from './features/report'
import type { ReportViewState } from './features/report'
import { ColonyTrendScreen } from './features/colonyTrend'
import type { ColonyTrendViewState } from './features/colonyTrend'
import { ColonyComparisonScreen } from './features/colonyComparison'
import type { ColonyComparisonViewState } from './features/colonyComparison'
import { ColonyCreateScreen } from './features/colonyCreate'
import type { ColonyCreateViewState } from './features/colonyCreate'
import { ApiaryCreateScreen } from './features/apiaryCreate'
import type { ApiaryCreateViewState } from './features/apiaryCreate'
import { PasswordResetScreen } from './features/passwordReset'
import type { PasswordResetViewState } from './features/passwordReset'
import { LoginScreen } from './features/login'
import type { LoginViewState } from './features/login'
import { SignupScreen } from './features/signup'
import type { SignupViewState } from './features/signup'
import { OnboardingStep1Screen, OnboardingStep2Screen, OnboardingStep3Screen } from './features/onboarding'
import type { OnboardingStep1ViewState, OnboardingStep2ViewState, OnboardingStep3ViewState } from './features/onboarding'
import { NotificationCenterScreen } from './features/notifications'
import type { NotificationCenterViewState, NotificationItem } from './features/notifications'
import { SensorDetailScreen, SensorGraphScreen } from './features/sensors'
import type { SensorDetailViewState, SensorGraphViewState, GraphColony } from './features/sensors'
import { SettingsScreen } from './features/settings'
import type { SettingsViewState } from './features/settings'
import type { TabId } from './components'
import type { InspectionSession } from './features/inspectionRecord'
import { getDB } from './lib/db'
import { getCachedDefaultInspectionMode } from './lib/inspectionMode'
import styles from './App.module.css'

type ViewState = DashboardViewState | ColonyListViewState | ColonyDetailViewState | InspectionStartViewState | RecordViewState | ViewerViewState | ApiaryMapViewState | CompleteViewState | CameraViewState | AiAnalysisViewState | DiagnosisViewState | RecommendedWorkState | WorkListViewState | TaskCreateViewState | WorkRecordViewState | WorkHistoryViewState | ReportViewState | ColonyTrendViewState | ColonyComparisonViewState | ColonyCreateViewState | ApiaryCreateViewState | PasswordResetViewState | LoginViewState | SignupViewState | OnboardingStep1ViewState | OnboardingStep2ViewState | OnboardingStep3ViewState | NotificationCenterViewState | SensorDetailViewState | SensorGraphViewState | SettingsViewState

const STATES: { id: ViewState; label: string }[] = [
  { id: 'normal',  label: '通常' },
  { id: 'empty',   label: '空' },
  { id: 'loading', label: '読込' },
  { id: 'error',   label: 'エラー' },
  { id: 'offline', label: 'オフライン' },
]

const VALID_STATES: ViewState[] = ['normal', 'selected', 'empty', 'loading', 'error', 'offline', 'multi-stage', 'unsaved', 'saved', 'draft-restore', 'save-error', 'frame-selected', 'deselected', 'other-stage', 'history', 'other-apiary', 'nectar', 'alert', 'no-results', 'no-location', 'healthy', 'first-inspection', 'ai-analyzed', 'reminder-off', 'missing-record', 'none-selected', 'inspection-tab', 'auto-capture-tab', 'upload-error', 'camera-permission-denied', 'context-missing', 'no-images', 'max-images', 'targets-empty', 'loading-inspection', 'data-missing', 'request-pending', 'request-error', 'saving', 'offline-no-cache', 'multi-selected', 'creating-tasks', 'calendar-view', 'completed-expanded', 'overdue-filtered', 'updating-completion', 'normal-ai', 'normal-manual', 'validation-error', 'submitting', 'submit-error', 'colony-picker', 'date-picker', 'discard-dialog', 'normal-linked-top', 'normal-linked-bottom', 'normal-new', 'saving-draft', 'save-error', 'photo-upload-error', 'photo-added', 'discard-confirm', 'colony-selector', 'time-picker', 'filtered-feeding', 'filtered-apiary', 'filtered-colony', 'filtered-period', 'search-results', 'filter-menu', 'search-open', 'no-apiary', 'apiary-load-error', 'geolocation-denied', 'map-error', 'filled', 'sent', 'resend-cooldown', 'send-error', 'new-password', 'password-validation-error', 'password-updating', 'password-updated', 'password-visible', 'auth-error', 'remember-me-off', 'signup-error', 'confirmation-sent', 'location-selected', 'quantity-adjusted', 'colony-names-expanded', 'no-colony', 'unread-filter', 'inspection-filter', 'ai-filter', 'sensor-filter', 'all-read', 'long-content', 'offline-cached', 'high-temperature', 'all-normal', 'filter-open', 'refreshing', 'partial-error', 'stale-data',
  'normal-day', 'tooltip-active', 'metric-selector-open', 'week', 'month', 'custom-range', 'partial-data',
  'profile-edit', 'profile-saving', 'profile-error', 'notifications-disabled', 'unsynced-data', 'sync-error', 'logout-confirm', 'delete-confirm']
const VALID_TABS: TabId[] = ['home', 'farms', 'work', 'analytics', 'settings']

const IS_DEV = import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get('devbar') !== '0'

function readParam<T extends string>(key: string, valid: T[], fallback: T): T {
  const p = new URLSearchParams(window.location.search).get(key)
  return (valid.includes(p as T) ? p : fallback) as T
}

const VALID_SCREENS = ['home', 'farms', 'colony-detail', 'inspection-start', 'inspection-record', 'frame-viewer', 'add-stage', 'apiary-map', 'inspection-complete', 'camera-images', 'ai-analysis', 'ai-diagnosis', 'recommended-work', 'work', 'task-create', 'work-record', 'work-history', 'report', 'colony-trend', 'colony-comparison', 'colony-create', 'apiary-create', 'password-reset', 'login', 'signup', 'onboarding-1', 'onboarding-2', 'onboarding-3', 'notification-center', 'sensor-detail', 'sensor-graph', 'settings'] as const
type Screen = typeof VALID_SCREENS[number]

export default function App() {
  const [viewState, setViewState] = useState<ViewState>(() =>
    readParam('state', VALID_STATES, 'normal'),
  )
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    readParam('tab', VALID_TABS, 'home'),
  )
  const [screen, setScreen] = useState<Screen>(() =>
    readParam('screen', [...VALID_SCREENS], 'home'),
  )
  const [selectedColonyId, setSelectedColonyId] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get('colonyId'),
  )
  const [previousInspectionMode, setPreviousInspectionMode] = useState<'frame' | 'ratio' | undefined>(undefined)
  const [inspectionSession, setInspectionSession] = useState<InspectionSession | null>(null)
  const [inspectionTemperature, setInspectionTemperature] = useState<number>(0)
  const [completedInspData, setCompletedInspData] = useState<InspectionCompleteData | null>(null)
  const [addStageRecord, setAddStageRecord] = useState<InspectionRecord | null>(null)
  const [previousScreen, setPreviousScreen] = useState<Screen>('home')

  function navigateTo(next: Screen) {
    setPreviousScreen(screen)
    setScreen(next)
  }

  const taskCreateState = viewState as TaskCreateViewState
  const workRecordState = viewState as WorkRecordViewState
  const workListState = viewState as WorkListViewState
  const aiState       = viewState as AiAnalysisViewState
  const diagState     = viewState as DiagnosisViewState
  const recWorkState  = viewState as RecommendedWorkState
  const cameraState   = viewState as CameraViewState
  const dashState     = viewState as DashboardViewState
  const colonyState   = viewState as ColonyListViewState
  const detailState   = viewState as ColonyDetailViewState
  const inspState     = viewState as InspectionStartViewState
  const recordState   = viewState as RecordViewState
  const viewerState   = viewState as ViewerViewState
  const mapState      = viewState as ApiaryMapViewState
  const completeState    = viewState as CompleteViewState
  const workHistoryState = viewState as WorkHistoryViewState
  const reportState      = viewState as ReportViewState
  const trendState       = viewState as ColonyTrendViewState
  const compState        = viewState as ColonyComparisonViewState
  const createState      = viewState as ColonyCreateViewState
  const apiaryCreateState   = viewState as ApiaryCreateViewState
  const passwordResetState  = viewState as PasswordResetViewState
  const loginState          = viewState as LoginViewState
  const signupState         = viewState as SignupViewState
  const onboarding1State    = viewState as OnboardingStep1ViewState
  const onboarding2State    = viewState as OnboardingStep2ViewState
  const onboarding3State    = viewState as OnboardingStep3ViewState
  const notifState          = viewState as NotificationCenterViewState
  const sensorState         = viewState as SensorDetailViewState
  const sensorGraphState    = viewState as SensorGraphViewState
  const settingsState       = viewState as SettingsViewState
  const [sensorGraphColony, setSensorGraphColony] = useState<GraphColony | null>(null)
  // default_inspection_mode from user preferences — passed to InspectionRecordScreen as initialMode.
  // Priority: URL param (dev/test) → session-validated cache → DB fetch → 'frame'.
  // null = not yet resolved; SCR-012 only mounts after resolution (Approach A).
  //
  // Two-path resolution:
  //   Online path  : getSession() → validate same-user cache → getUserPreferences() → set mode
  //   Offline path : getDB() returns null → use any available cache (best-effort) → 'frame'
  const [defaultInspectionMode, setDefaultInspectionMode] = useState<'frame' | 'ratio' | null>(() => {
    const urlOverride = new URLSearchParams(window.location.search).get('initialMode')
    if (urlOverride === 'frame' || urlOverride === 'ratio') return urlOverride
    return null  // always resolve via async effect for correctness
  })

  useEffect(() => {
    if (defaultInspectionMode !== null) return
    let cancelled = false
    const toMode = (m: string | null | undefined): 'frame' | 'ratio' =>
      m === 'frame' || m === 'ratio' ? m : 'frame'

    async function resolve() {
      const db = getDB()

      if (!db) {
        // Offline / HoneyDB not loaded: use any same-user cache as best-effort, else 'frame'
        const raw = localStorage.getItem('honeyos_user_prefs')
        let cached: string | null = null
        try {
          if (raw) {
            const p = JSON.parse(raw) as { default_inspection_mode?: string }
            cached = p.default_inspection_mode ?? null
          }
        } catch { /* ignore */ }
        if (!cancelled) setDefaultInspectionMode(toMode(cached))
        return
      }

      try {
        // Get current session to validate the same-user cache
        const session = await db.getSession()
        const userId = session.user?.id ?? null
        // getCachedDefaultInspectionMode validates honeyos_prefs_user_id === userId
        const fromCache = getCachedDefaultInspectionMode(userId)
        if (fromCache !== null) {
          if (!cancelled) setDefaultInspectionMode(fromCache)
          return
        }
        // No valid same-user cache: fetch from DB
        const prefs = await db.getUserPreferences()
        if (!cancelled) setDefaultInspectionMode(toMode(prefs.default_inspection_mode))
      } catch {
        if (!cancelled) setDefaultInspectionMode('frame')
      }
    }

    resolve()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 起動時セッション確認: URLパラメータで画面指定がない場合のみ実行
  // ログイン済み → 'home'、未ログイン → 'login'
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('screen')) return  // 開発用URL paramがある場合はスキップ
    const db = getDB()
    if (!db) return  // HoneyDB未ロードの場合はスキップ（開発環境）
    db.getSession().then(session => {
      if (!session || !session.user) {
        setScreen('login')
      }
    }).catch(() => { /* セッション確認失敗は無視 */ })
  }, [])

  function handleNotifNavigate(target: NotificationItem['navigateTo'], colonyId?: string) {
    if (target === 'inspection-start') {
      if (colonyId) setSelectedColonyId(colonyId)
      setScreen('inspection-start')
    } else if (target === 'ai-diagnosis') {
      setScreen('ai-diagnosis')
    } else if (target === 'colony-detail') {
      if (colonyId) setSelectedColonyId(colonyId)
      setScreen('colony-detail')
    }
    // system notifications stay on notification-center; null target stays too
  }

  return (
    <>
      {IS_DEV && (
        <div className={styles.devBar} role="toolbar" aria-label="表示状態切り替え（開発用）">
          {STATES.map(({ id, label }) => (
            <button
              key={id}
              className={viewState === id ? styles.devBtnActive : styles.devBtn}
              onClick={() => setViewState(id)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {screen === 'sensor-graph' ? (
        <SensorGraphScreen
          viewState={sensorGraphState}
          colony={sensorGraphColony ?? undefined}
          onBack={() => setScreen(previousScreen)}
        />
      ) : screen === 'sensor-detail' ? (
        <SensorDetailScreen
          viewState={sensorState}
          onBack={() => setScreen(previousScreen)}
          onNavigateToGraph={(payload) => {
            setSensorGraphColony({ id: payload.colonyId, name: '', apiaryName: '' })
            navigateTo('sensor-graph')
          }}
        />
      ) : screen === 'notification-center' ? (
        <NotificationCenterScreen
          viewState={notifState}
          onBack={() => setScreen(previousScreen)}
          onNavigate={handleNotifNavigate}
        />
      ) : screen === 'onboarding-3' ? (
        <OnboardingStep3Screen
          viewState={onboarding3State}
          onBack={() => setScreen('onboarding-2')}
          onStartInspection={() => { setSelectedColonyId(null); setScreen('inspection-start') }}
          onDashboard={() => { setScreen('home'); setActiveTab('home') }}
          onAddApiary={() => navigateTo('apiary-create')}
          onAddColony={() => navigateTo('colony-create')}
        />
      ) : screen === 'onboarding-2' ? (
        <OnboardingStep2Screen
          viewState={onboarding2State}
          onBack={() => setScreen('onboarding-1')}
          onNext={() => setScreen('onboarding-3')}
          onSkip={() => setScreen('onboarding-3')}
        />
      ) : screen === 'onboarding-1' ? (
        <OnboardingStep1Screen
          viewState={onboarding1State}
          onBack={() => setScreen('signup')}
          onNext={() => setScreen('onboarding-2')}
          onSkip={() => setScreen('home')}
        />
      ) : screen === 'signup' ? (
        <SignupScreen
          viewState={signupState}
          onBack={() => setScreen('login')}
          onLogin={() => setScreen('login')}
        />
      ) : screen === 'login' ? (
        <LoginScreen
          viewState={loginState}
          onSuccess={() => setScreen('home')}
          onForgotPassword={() => setScreen('password-reset')}
          onRegister={() => setScreen('signup')}
        />
      ) : screen === 'password-reset' ? (
        <PasswordResetScreen
          viewState={passwordResetState}
          onBack={() => setScreen(previousScreen)}
          onSuccess={() => setScreen('home')}
        />
      ) : screen === 'apiary-create' ? (
        <ApiaryCreateScreen
          viewState={apiaryCreateState}
          onBack={() => setScreen(previousScreen)}
          onSuccess={() => {
            setScreen(previousScreen)
          }}
        />
      ) : screen === 'colony-create' ? (
        <ColonyCreateScreen
          viewState={createState}
          onBack={() => setScreen(previousScreen)}
          onSuccess={(id) => { setSelectedColonyId(id); setScreen('colony-detail') }}
          onAddApiary={() => navigateTo('apiary-create')}
        />
      ) : screen === 'colony-comparison' ? (
        <ColonyComparisonScreen
          viewState={compState}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onColonyDetail={(id) => { setSelectedColonyId(id); setScreen('colony-detail') }}
        />
      ) : screen === 'colony-trend' ? (
        <ColonyTrendScreen
          viewState={trendState}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onColonyDetail={(id) => { setSelectedColonyId(id); setScreen('colony-detail') }}
          onInspectionHistory={(id) => { setSelectedColonyId(id); setScreen('colony-detail') }}
          onColonyComparison={() => setScreen('colony-comparison')}
          onCreateColony={() => navigateTo('colony-create')}
        />
      ) : screen === 'report' ? (
        <ReportScreen
          viewState={reportState}
          onBack={() => setScreen(previousScreen)}
          onViewHistory={() => navigateTo('work-history')}
          onTabChange={setActiveTab}
        />
      ) : screen === 'work-history' ? (
        <WorkHistoryScreen
          viewState={workHistoryState}
          onBack={() => setScreen(previousScreen)}
          onAddRecord={() => navigateTo('work-record')}
          onRecordTap={() => navigateTo('work-record')}
          onAnalyze={() => navigateTo('report')}
          onTabChange={setActiveTab}
        />
      ) : screen === 'work-record' ? (
        <WorkRecordScreen
          viewState={workRecordState}
          onBack={() => setScreen('work')}
          onSuccess={() => setScreen('work')}
        />
      ) : screen === 'task-create' ? (
        <TaskCreateScreen
          viewState={taskCreateState}
          onBack={() => setScreen('work')}
          onSuccess={() => setScreen('work')}
        />
      ) : screen === 'work' ? (
        <WorkListScreen
          viewState={workListState}
          onTabChange={setActiveTab}
          onAddTask={() => { setScreen('task-create'); setViewState('normal-manual') }}
        />
      ) : screen === 'recommended-work' ? (
        <RecommendedWorkScreen
          viewState={recWorkState}
          onBack={() => setScreen('ai-diagnosis')}
          onAddToTask={() => navigateTo('task-create')}
          onRecord={() => navigateTo('work-record')}
          onCreateTasks={() => navigateTo('task-create')}
        />
      ) : screen === 'ai-diagnosis' ? (
        <AiDiagnosisScreen
          viewState={diagState}
          onBack={() => setScreen('ai-analysis')}
          onViewRecommendations={() => setScreen('recommended-work')}
          onReanalyze={() => setScreen('ai-analysis')}
          onReturnToRecord={() => setScreen('inspection-record')}
        />
      ) : screen === 'ai-analysis' ? (
        <AiAnalysisScreen
          viewState={aiState}
          onBack={() => setScreen('camera-images')}
          onAnalysisComplete={() => setScreen('ai-diagnosis')}
        />
      ) : screen === 'camera-images' ? (
        <CameraImagesScreen
          viewState={cameraState}
          onBack={() => setScreen('inspection-record')}
          onAnalyze={() => setScreen('ai-analysis')}
        />
      ) : screen === 'inspection-complete' ? (
        <InspectionCompleteScreen
          viewState={completeState}
          data={completedInspData ?? undefined}
          onNextColony={() => { setSelectedColonyId(null); setScreen('inspection-start') }}
          onAddNote={() => navigateTo('work-record')}
          onDashboard={() => { setScreen('home'); setActiveTab('home') }}
          onEdit={() => setScreen('inspection-record')}
          onAiAnalyze={() => navigateTo('ai-analysis')}
        />
      ) : screen === 'apiary-map' ? (
        <ApiaryMapScreen
          viewState={mapState}
          onBack={() => { setScreen('home'); setActiveTab('farms') }}
          onViewColonyList={() => { setScreen('home'); setActiveTab('farms') }}
        />
      ) : screen === 'add-stage' && addStageRecord ? (
        <AddStageScreen
          record={addStageRecord}
          onBack={() => setScreen('frame-viewer')}
          onSave={() => setScreen('frame-viewer')}
        />
      ) : screen === 'frame-viewer' ? (
        <FrameViewerScreen
          viewState={viewerState}
          onBack={() => setScreen('inspection-record')}
          onEdit={() => setScreen('inspection-record')}
          onAddStage={(record) => { setAddStageRecord(record); setScreen('add-stage') }}
        />
      ) : screen === 'inspection-record' && defaultInspectionMode !== null ? (
        <InspectionRecordScreen
          viewState={recordState}
          session={inspectionSession ?? undefined}
          previousMode={previousInspectionMode}
          initialMode={defaultInspectionMode}
          onBack={() => setScreen('inspection-start')}
          onReselect={() => setScreen('inspection-start')}
          onSave={async ({ stages, queenStatus, observations: _obs, effectiveMode }) => {
            const db = window.HoneyDB
            type Frame = { bee: number; brood: number; honey: number }
            const frames = stages.flatMap(s =>
              (s.frames as Array<Frame | null>).filter((f): f is Frame => f !== null)
            )
            const now = new Date()
            const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

            if (db?.saveInspRecord && inspectionSession) {
              try {
                await db.saveInspRecord({
                  colony: inspectionSession.colonyId,
                  date: inspectionSession.inspDate,
                  time,
                  weather: inspectionSession.weather,
                  frames,
                  count_mode: effectiveMode,
                  queen_status: queenStatus,
                  queen_present: queenStatus !== null,
                  bees_total: frames.reduce((s, f) => s + f.bee, 0),
                  temperature: inspectionTemperature,
                })
              } catch {
                // fall through; screen can show error state
              }
            }

            // Build completion summary for SCR-015
            if (inspectionSession) {
              const filled = frames.filter(f => f.bee + f.brood + f.honey > 0)
              const n = filled.length || 1
              const avgBee   = Math.round(filled.reduce((s, f) => s + f.bee, 0) / n)
              const avgBrood = Math.round(filled.reduce((s, f) => s + f.brood, 0) / n)
              const avgHoney = Math.round(filled.reduce((s, f) => s + f.honey, 0) / n)
              const score    = Math.round(avgBee * 0.6 + avgBrood * 0.4)
              const totalFrames = stages.reduce((s, st) => s + (st.frames as unknown[]).length, 0)
              // Suggest next inspection 14 days out
              const d = new Date(inspectionSession.inspDate)
              const next = new Date(d.getTime() + 14 * 86400000)
              const DOW = ['日', '月', '火', '水', '木', '金', '土']
              const suggestedDate = `${next.getFullYear()}年${next.getMonth()+1}月${next.getDate()}日（${DOW[next.getDay()]}）`
              const inspDateFormatted = (() => {
                const dd = new Date(inspectionSession.inspDate)
                return isNaN(dd.getTime()) ? inspectionSession.inspDate
                  : `${dd.getFullYear()}年${dd.getMonth()+1}月${dd.getDate()}日（${DOW[dd.getDay()]}）`
              })()
              setCompletedInspData({
                inspectionId: `insp-${inspectionSession.inspDate}-${inspectionSession.colonyId}`,
                colonyId: inspectionSession.colonyId,
                colonyLabel: inspectionSession.colonyLabel,
                apiaryName: inspectionSession.apiaryName,
                inspDate: inspDateFormatted,
                weather: inspectionSession.weather,
                tempCelsius: inspectionTemperature,
                queenStatus: (queenStatus as 'laying' | 'unconfirmed' | 'concern') ?? 'unconfirmed',
                estimatedBeeCount: filled.length * Math.round(avgBee * 3),
                strengthScore: score,
                stageSummary: { stageCount: stages.length, totalFrames, recordedFrames: filled.length },
                previousInspDate: null,
                comparison: [
                  { key: 'bee',      label: '蜂量',   current: avgBee,   previous: null, unit: '%' },
                  { key: 'brood',    label: '育児量', current: avgBrood, previous: null, unit: '%' },
                  { key: 'honey',    label: '貯蜜量', current: avgHoney, previous: null, unit: '%' },
                  { key: 'strength', label: '簡易強さ', current: score,  previous: null, unit: '' },
                ],
                aiDiagnosis: null,
                nextInspection: { daysBefore: 1, suggestedDate, userDate: null },
              })
            }
            setScreen('inspection-complete')
          }}
        />
      ) : screen === 'inspection-record' ? (
        <div aria-busy="true" aria-label="設定を読み込み中" data-testid="pref-loading" />
      ) : screen === 'inspection-start' ? (
        <InspectionStartScreen
          viewState={inspState}
          initialColonyId={selectedColonyId ?? undefined}
          onClose={() => {
            if (selectedColonyId) { setScreen('colony-detail') }
            else { setScreen('home'); setActiveTab('home') }
          }}
          onStart={({ colonyId, colonyLabel, apiaryName, statusLabel, inspDate, weather, temperature, previousMode }) => {
            setPreviousInspectionMode(previousMode)
            setInspectionSession({ colonyId, colonyLabel, apiaryName, statusLabel, inspDate, weather })
            setInspectionTemperature(temperature)
            setSelectedColonyId(colonyId)
            setScreen('inspection-record')
          }}
        />
      ) : screen === 'settings' ? (
        <SettingsScreen
          viewState={settingsState}
          activeTab="settings"
          onTabChange={(tab) => {
            setActiveTab(tab)
            if (tab !== 'settings') setScreen('home')
          }}
          onColonyCreate={() => navigateTo('colony-create')}
          onApiaryCreate={() => navigateTo('apiary-create')}
          onPasswordReset={() => navigateTo('password-reset')}
          onLogout={() => setScreen('login')}
        />
      ) : screen === 'colony-detail' ? (
        <ColonyDetailScreen
          colonyId={selectedColonyId ?? undefined}
          viewState={detailState}
          onBack={() => { setScreen('home'); setActiveTab('farms') }}
          onStartInspection={(id) => { setSelectedColonyId(id); setScreen('inspection-start') }}
          onSensorDetail={(id) => { setSelectedColonyId(id); navigateTo('sensor-detail') }}
          onFrameViewer={(id) => { setSelectedColonyId(id); navigateTo('frame-viewer') }}
          onInspectionHistory={(id) => { setSelectedColonyId(id); navigateTo('frame-viewer') }}
          onWorkHistory={(id) => { setSelectedColonyId(id); navigateTo('work-history') }}
          onCameraImages={(id) => { setSelectedColonyId(id); navigateTo('camera-images') }}
          onAiDiagnosis={(id) => { setSelectedColonyId(id); navigateTo('ai-diagnosis') }}
        />
      ) : (
        <>
          {activeTab === 'home' && (
            <DashboardScreen
              viewState={dashState}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onStartInspection={() => { setSelectedColonyId(null); setScreen('inspection-start') }}
              onNotifClick={() => navigateTo('notification-center')}
              onAlertColonies={() => {
                setActiveTab('farms')
                setViewState('normal')
              }}
            />
          )}

          {activeTab === 'farms' && (
            <ColonySummaryScreen
              viewState={colonyState}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onNotifClick={() => navigateTo('notification-center')}
              onColonyClick={(id) => { setSelectedColonyId(id); setScreen('colony-detail') }}
              onAddColony={() => { navigateTo('colony-create') }}
            />
          )}

          {activeTab === 'analytics' && (
            <ReportScreen
              viewState={reportState}
              onBack={() => setActiveTab('home')}
              onViewHistory={() => setScreen('work-history')}
              onTabChange={setActiveTab}
            />
          )}

          {activeTab === 'work' && (
            <WorkListScreen
              viewState={workListState}
              onTabChange={setActiveTab}
              onAddTask={() => { navigateTo('task-create'); setViewState('normal-manual') }}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsScreen
              viewState={settingsState}
              activeTab={activeTab}
              onTabChange={(tab) => {
                setActiveTab(tab)
                if (tab !== 'settings') setScreen('home')
              }}
              onColonyCreate={() => navigateTo('colony-create')}
              onApiaryCreate={() => navigateTo('apiary-create')}
              onPasswordReset={() => navigateTo('password-reset')}
              onLogout={() => setScreen('login')}
            />
          )}
        </>
      )}
    </>
  )
}
