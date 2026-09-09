import { useState } from 'react'
import { DashboardScreen } from './features/dashboard'
import type { DashboardViewState } from './features/dashboard'
import type { TabId } from './components'
import styles from './App.module.css'

const VIEW_STATES: { id: DashboardViewState; label: string }[] = [
  { id: 'normal',  label: '通常' },
  { id: 'empty',   label: '空' },
  { id: 'loading', label: '読込' },
  { id: 'error',   label: 'エラー' },
  { id: 'offline', label: 'オフライン' },
]

const IS_DEV = import.meta.env.DEV

function readStateParam(): DashboardViewState {
  const p = new URLSearchParams(window.location.search).get('state')
  const valid: DashboardViewState[] = ['normal', 'empty', 'loading', 'error', 'offline']
  return (valid.includes(p as DashboardViewState) ? p : 'normal') as DashboardViewState
}

export default function App() {
  const [viewState, setViewState] = useState<DashboardViewState>(readStateParam)
  const [activeTab, setActiveTab] = useState<TabId>('home')

  return (
    <>
      {IS_DEV && (
        <div className={styles.devBar} role="toolbar" aria-label="表示状態切り替え（開発用）">
          {VIEW_STATES.map(({ id, label }) => (
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

      <DashboardScreen
        viewState={viewState}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onStartInspection={() => alert('内検を始める → SCR-011（未実装）')}
        onNotifClick={() => alert('通知 → SCR-007（未実装）')}
        onAlertColonies={() => alert('要注意蜂群 → SCR-008（未実装）')}
      />
    </>
  )
}
