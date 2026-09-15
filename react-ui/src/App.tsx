import { useState } from 'react'
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
import type { CompleteViewState } from './features/inspectionComplete'
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
import type { TabId } from './components'
import styles from './App.module.css'

type ViewState = DashboardViewState | ColonyListViewState | ColonyDetailViewState | InspectionStartViewState | RecordViewState | ViewerViewState | ApiaryMapViewState | CompleteViewState | CameraViewState | AiAnalysisViewState | DiagnosisViewState | RecommendedWorkState | WorkListViewState | TaskCreateViewState | WorkRecordViewState

const STATES: { id: ViewState; label: string }[] = [
  { id: 'normal',  label: '通常' },
  { id: 'empty',   label: '空' },
  { id: 'loading', label: '読込' },
  { id: 'error',   label: 'エラー' },
  { id: 'offline', label: 'オフライン' },
]

const VALID_STATES: ViewState[] = ['normal', 'selected', 'empty', 'loading', 'error', 'offline', 'multi-stage', 'unsaved', 'saved', 'draft-restore', 'save-error', 'frame-selected', 'deselected', 'other-stage', 'history', 'other-apiary', 'nectar', 'alert', 'no-results', 'no-location', 'healthy', 'first-inspection', 'ai-analyzed', 'reminder-off', 'missing-record', 'none-selected', 'inspection-tab', 'auto-capture-tab', 'upload-error', 'camera-permission-denied', 'context-missing', 'no-images', 'max-images', 'targets-empty', 'loading-inspection', 'data-missing', 'request-pending', 'request-error', 'saving', 'offline-no-cache', 'multi-selected', 'creating-tasks', 'calendar-view', 'completed-expanded', 'overdue-filtered', 'updating-completion', 'normal-ai', 'normal-manual', 'validation-error', 'submitting', 'submit-error', 'colony-picker', 'date-picker', 'discard-dialog', 'normal-linked-top', 'normal-linked-bottom', 'normal-new', 'saving-draft', 'save-error', 'photo-upload-error', 'photo-added', 'discard-confirm', 'colony-selector', 'time-picker']
const VALID_TABS: TabId[] = ['home', 'farms', 'work', 'analytics', 'settings']

const IS_DEV = import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get('devbar') !== '0'

function readParam<T extends string>(key: string, valid: T[], fallback: T): T {
  const p = new URLSearchParams(window.location.search).get(key)
  return (valid.includes(p as T) ? p : fallback) as T
}

const VALID_SCREENS = ['home', 'farms', 'colony-detail', 'inspection-start', 'inspection-record', 'frame-viewer', 'add-stage', 'apiary-map', 'inspection-complete', 'camera-images', 'ai-analysis', 'ai-diagnosis', 'recommended-work', 'work', 'task-create', 'work-record'] as const
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
  const [addStageRecord, setAddStageRecord] = useState<InspectionRecord | null>(null)

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
  const completeState = viewState as CompleteViewState

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

      {screen === 'work-record' ? (
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
          onAddToTask={(id) => alert(`タスクに追加: ${id} → SCR-025（未実装）`)}
          onRecord={(id) => alert(`作業記録: ${id} → SCR-026（未実装）`)}
          onCreateTasks={(ids) => alert(`タスク作成: ${ids.join(', ')} → SCR-025（未実装）`)}
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
          onNextColony={() => { setSelectedColonyId(null); setScreen('inspection-start') }}
          onAddNote={() => alert('作業記録追加 → SCR-026（未実装）')}
          onDashboard={() => { setScreen('home'); setActiveTab('home') }}
          onEdit={() => setScreen('inspection-record')}
          onAiAnalyze={() => alert('AI解析 → SCR-014（未実装）')}
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
      ) : screen === 'inspection-record' ? (
        <InspectionRecordScreen
          viewState={recordState}
          onBack={() => setScreen('inspection-start')}
          onReselect={() => setScreen('inspection-start')}
          onSave={() => setScreen('inspection-complete')}
        />
      ) : screen === 'inspection-start' ? (
        <InspectionStartScreen
          viewState={inspState}
          initialColonyId={selectedColonyId ?? undefined}
          onClose={() => {
            if (selectedColonyId) { setScreen('colony-detail') }
            else { setScreen('home'); setActiveTab('home') }
          }}
          onStart={() => { setScreen('inspection-record') }}
        />
      ) : screen === 'colony-detail' ? (
        <ColonyDetailScreen
          colonyId={selectedColonyId ?? undefined}
          viewState={detailState}
          initialPopover={new URLSearchParams(window.location.search).get('popover') === '1'}
          onBack={() => { setScreen('home'); setActiveTab('farms') }}
          onStartInspection={(id) => { setSelectedColonyId(id); setScreen('inspection-start') }}
        />
      ) : (
        <>
          {activeTab === 'home' && (
            <DashboardScreen
              viewState={dashState}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onStartInspection={() => { setSelectedColonyId(null); setScreen('inspection-start') }}
              onNotifClick={() => alert('通知 → SCR-007（未実装）')}
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
              onNotifClick={() => alert('通知 → SCR-007（未実装）')}
              onColonyClick={(id) => { setSelectedColonyId(id); setScreen('colony-detail') }}
            />
          )}

          {(activeTab === 'work' || activeTab === 'analytics' || activeTab === 'settings') && (
            <DashboardScreen
              viewState="empty"
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          )}
        </>
      )}
    </>
  )
}
