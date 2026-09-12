import { useState } from 'react'
import { DashboardScreen } from './features/dashboard'
import type { DashboardViewState } from './features/dashboard'
import { ColonySummaryScreen } from './features/colonyList'
import type { ColonyListViewState } from './features/colonyList'
import { ColonyDetailScreen } from './features/colonyDetail'
import type { ColonyDetailViewState } from './features/colonyDetail'
import { InspectionStartScreen } from './features/inspectionStart'
import type { InspectionStartViewState } from './features/inspectionStart'
import type { TabId } from './components'
import styles from './App.module.css'

type ViewState = DashboardViewState | ColonyListViewState | ColonyDetailViewState | InspectionStartViewState

const STATES: { id: ViewState; label: string }[] = [
  { id: 'normal',  label: '通常' },
  { id: 'empty',   label: '空' },
  { id: 'loading', label: '読込' },
  { id: 'error',   label: 'エラー' },
  { id: 'offline', label: 'オフライン' },
]

const VALID_STATES: ViewState[] = ['normal', 'empty', 'loading', 'error', 'offline']
const VALID_TABS: TabId[] = ['home', 'farms', 'work', 'analytics', 'settings']

const IS_DEV = import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get('devbar') !== '0'

function readParam<T extends string>(key: string, valid: T[], fallback: T): T {
  const p = new URLSearchParams(window.location.search).get(key)
  return (valid.includes(p as T) ? p : fallback) as T
}

const VALID_SCREENS = ['home', 'farms', 'colony-detail', 'inspection-start'] as const
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

  const dashState    = viewState as DashboardViewState
  const colonyState  = viewState as ColonyListViewState
  const detailState  = viewState as ColonyDetailViewState
  const inspState    = viewState as InspectionStartViewState

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

      {screen === 'inspection-start' ? (
        <InspectionStartScreen
          viewState={inspState}
          initialColonyId={selectedColonyId ?? undefined}
          onClose={() => {
            if (selectedColonyId) { setScreen('colony-detail') }
            else { setScreen('home'); setActiveTab('home') }
          }}
          onStart={() => alert('SCR-012へ遷移（未実装）')}
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
