import { ClipboardCheck } from 'lucide-react'
import { AppHeader, BottomNav, EmptyState, ErrorBanner } from '../../components'
import type { TabId } from '../../components'
import { AlertBanner } from './AlertBanner'
import { WeatherCard } from './WeatherCard'
import { ColonySummaryCard } from './ColonySummaryCard'
import { WeeklyStatsCard } from './WeeklyStatsCard'
import { mockDashboard } from './mockData'
import styles from './DashboardScreen.module.css'

export type DashboardViewState = 'normal' | 'empty' | 'loading' | 'error' | 'offline'

interface DashboardScreenProps {
  viewState?: DashboardViewState
  activeTab?: TabId
  onTabChange?: (tab: TabId) => void
  onStartInspection?: () => void
  onNotifClick?: () => void
  onAlertColonies?: () => void
  onMethodClick?: () => void
}

export function DashboardScreen({
  viewState = 'normal',
  activeTab = 'home',
  onTabChange,
  onStartInspection,
  onNotifClick,
  onAlertColonies,
  onMethodClick,
}: DashboardScreenProps) {
  const { farmName, alertColonyCount, weather, colonies, weekly } = mockDashboard

  return (
    <div className="app-shell">
      <AppHeader
        farmName={farmName}
        notifCount={0}
        onNotifClick={onNotifClick}
      />

      {viewState === 'error' && (
        <ErrorBanner
          message="データの取得に失敗しました。再度お試しください。"
          severity="critical"
        />
      )}
      {viewState === 'offline' && (
        <ErrorBanner
          message="オフラインです。最後に取得したデータを表示しています。"
          severity="minor"
        />
      )}

      {(viewState === 'normal' || viewState === 'offline') && (
        <AlertBanner
          colonyCount={alertColonyCount}
          onTap={onAlertColonies}
        />
      )}

      <main className={styles.content} aria-label="ダッシュボード">
        {viewState === 'loading' && (
          <div className={styles.loadingWrap} aria-busy aria-label="読み込み中">
            <div className={styles.skeleton} style={{ height: 160 }} />
            <div className={styles.skeleton} style={{ height: 200 }} />
            <div className={styles.skeleton} style={{ height: 130 }} />
          </div>
        )}

        {viewState === 'empty' && (
          <EmptyState
            emoji="🐝"
            title="蜂群がまだありません"
            description="最初の蜂群を追加して内検記録を始めましょう。"
            actionLabel="＋ 蜂群を追加"
            onAction={() => {}}
          />
        )}

        {(viewState === 'normal' || viewState === 'offline') && (
          <>
            <section aria-label="内検コンディション">
              <WeatherCard data={weather} />
            </section>
            <section aria-label="蜂群の強さ">
              <ColonySummaryCard data={colonies} onMethodClick={onMethodClick} />
            </section>
            <section aria-label="今週の統計">
              <WeeklyStatsCard data={weekly} />
            </section>
          </>
        )}

        {viewState === 'error' && (
          <EmptyState
            emoji="⚠️"
            title="データを読み込めません"
            description="ネットワーク接続を確認してから再試行してください。"
            actionLabel="再読み込み"
            onAction={() => window.location.reload()}
          />
        )}
      </main>

      {viewState !== 'empty' && (
        <button
          className={styles.fab}
          aria-label="内検を始める"
          onClick={onStartInspection}
        >
          <ClipboardCheck size={20} aria-hidden />
          内検を始める
        </button>
      )}

      <BottomNav activeTab={activeTab} onTabChange={onTabChange ?? (() => {})} />
    </div>
  )
}
