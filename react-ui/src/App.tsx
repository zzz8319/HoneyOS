import { useState } from 'react'
import { DashboardScreen } from './features/dashboard'
import type { DashboardViewState } from './features/dashboard'
import { ColonySummaryScreen } from './features/colonyList'
import type { ColonyListViewState } from './features/colonyList'
import type { TabId } from './components'
import styles from './App.module.css'

type ViewState = DashboardViewState | ColonyListViewState

const STATES: { id: ViewState; label: string }[] = [
  { id: 'normal',  label: '通常' },
  { id: 'empty',   label: '空' },
  { id: 'loading', label: '読込' },
  { id: 'error',   label: 'エラー' },
  { id: 'offline', label: 'オフライン' },
]

const IS_DEV = import.meta.env.DEV

function readStateParam<T extends string>(valid: T[]): T {
  const p = new URLSearchParams(window.location.search).get('state')
  return (valid.includes(p as T) ? p : valid[0]) as T
}

const VALID_STATES: ViewState[] = ['normal', 'empty', 'loading', 'error', 'offline']

export default function App() {
  const [viewState, setViewState] = useState<ViewState>(() => readStateParam(VALID_STATES))
  const [activeTab, setActiveTab] = useState<TabId>('home')

  const dashState = viewState as DashboardViewState
  const colonyState = viewState as ColonyListViewState

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

      {activeTab === 'home' && (
        <DashboardScreen
          viewState={dashState}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onStartInspection={() => alert('内検を始める → SCR-011（未実装）')}
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
          onColonyClick={(id) => alert(`蜂群詳細 → SCR-009 colonyId: ${id}（未実装）`)}
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
  )
}
