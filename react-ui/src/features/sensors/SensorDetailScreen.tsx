import { useState, useMemo, useCallback } from 'react'
import { ChevronLeft, RefreshCw, SlidersHorizontal, Info, AlertTriangle, WifiOff, MoreVertical, Clock } from 'lucide-react'
// onNavigateToNotifications prop is retained for future use but not exposed in the UI per spec
import type {
  SensorMetric, SensorKind, SensorDetailViewState,
  SensorDetailColony, SensorNavigateToGraphPayload,
} from './sensorTypes'
import {
  NORMAL_METRICS, ALL_NORMAL_METRICS, HIGH_TEMP_METRICS,
  LONG_CONTENT_METRICS, PARTIAL_ERROR_METRICS, STALE_METRICS,
  COLONY_A03, COLONY_LONG,
} from './sensorFixtures'
import { SensorMetricCard } from './SensorMetricCard'
import { SensorFilterSheet } from './SensorFilterSheet'
import { SensorSetupSheet } from './SensorSetupSheet'
import styles from './SensorDetailScreen.module.css'

const ALL_KINDS: SensorKind[] = ['temperature', 'humidity', 'weight', 'sound', 'vibration']

interface Props {
  viewState?: SensorDetailViewState
  onBack: () => void
  onNavigateToGraph?: (payload: SensorNavigateToGraphPayload) => void
  returnTo?: string
}

function buildMetrics(vs: SensorDetailViewState): SensorMetric[] | null {
  if (vs === 'loading') return null
  if (vs === 'error') return null
  if (vs === 'offline-no-cache') return null
  if (vs === 'high-temperature') return HIGH_TEMP_METRICS
  if (vs === 'all-normal') return ALL_NORMAL_METRICS
  if (vs === 'partial-error') return PARTIAL_ERROR_METRICS
  if (vs === 'stale-data') return STALE_METRICS
  if (vs === 'long-content') return LONG_CONTENT_METRICS
  return NORMAL_METRICS
}

function buildColony(vs: SensorDetailViewState): SensorDetailColony {
  if (vs === 'long-content') return COLONY_LONG
  return COLONY_A03
}

function buildLastUpdate(vs: SensorDetailViewState): string {
  if (vs === 'stale-data')      return '2024年6月29日 8:15'
  if (vs === 'offline-cached')  return '9:40（キャッシュ）'
  if (vs === 'long-content')    return '2024年7月1日 14:32:08 JST'
  return '9:40'
}

export function SensorDetailScreen({
  viewState = 'normal',
  onBack,
  onNavigateToGraph,
  returnTo = 'sensor-detail',
}: Props) {
  const isLoading   = viewState === 'loading'
  const isError     = viewState === 'error'
  const isOffline   = viewState === 'offline-cached' || viewState === 'offline-no-cache'
  const hasNoCache  = viewState === 'offline-no-cache'
  const isStale     = viewState === 'stale-data'
  const isRefreshing = viewState === 'refreshing'

  const colony      = buildColony(viewState)
  const lastUpdate  = buildLastUpdate(viewState)

  const [metrics, setMetrics] = useState<SensorMetric[] | null>(() => buildMetrics(viewState))
  const [filterOpen, setFilterOpen]   = useState(viewState === 'filter-open')
  const [setupOpen, setSetupOpen]     = useState(false)
  const [refreshing, setRefreshing]   = useState(isRefreshing)
  const [retried, setRetried]         = useState(false)
  const [liveMsg, setLiveMsg]         = useState('')
  const [activeFilter, setActiveFilter] = useState<Set<SensorKind>>(new Set(ALL_KINDS))

  const filteredMetrics = useMemo(() => {
    if (!metrics) return []
    return metrics.filter(m => activeFilter.has(m.kind))
  }, [metrics, activeFilter])

  const handleRefresh = useCallback(() => {
    if (refreshing) return
    setRefreshing(true)
    setLiveMsg('センサーデータを更新中です')
    setTimeout(() => {
      setRefreshing(false)
      setMetrics(buildMetrics('normal'))
      setLiveMsg('センサーデータを更新しました')
    }, 1500)
  }, [refreshing])

  function handleFilterApply(sel: Set<SensorKind>) {
    setActiveFilter(sel)
    setFilterOpen(false)
  }

  function handleCardClick(e: React.MouseEvent<HTMLDivElement>) {
    const btn = (e.target as Element).closest('[data-action]') as HTMLButtonElement | null
    if (!btn) return
    const action = btn.dataset['action']
    if (action === 'show-setup') setSetupOpen(true)
    if (action === 'retry-metric') {
      // partial error: simulate re-fetch of failed metric
      const kind = btn.dataset['kind'] as SensorKind
      setMetrics(prev => prev
        ? prev.map(m => m.kind === kind ? { ...m, value: 42.6, status: 'normal', statusLabel: undefined } : m)
        : prev
      )
    }
  }

  return (
    <div className={styles.screen}>
      {/* ── ヘッダー ── */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="戻る">
          <ChevronLeft size={24} aria-hidden />
        </button>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>センサー</h1>
          <p className={styles.subtitle} title={`${colony.name}・${colony.apiaryName}`}>
            {colony.name}・{colony.apiaryName}
          </p>
        </div>
        <button className={styles.moreBtn} aria-label="メニュー">
          <MoreVertical size={20} aria-hidden />
        </button>
      </header>

      {/* ── 更新状態行 ── */}
      <div className={styles.statusRow}>
        <div className={styles.statusLeft}>
          <Clock size={14} aria-hidden className={styles.clockIcon} />
          <span className={styles.lastUpdate}>最終更新 {lastUpdate}</span>
          {!isOffline && !isStale && (
            <>
              <span className={styles.onlineDot} aria-hidden />
              <span className={styles.onlineLabel}>オンライン</span>
            </>
          )}
          {isStale && (
            <span className={styles.staleLabel}>古いデータ</span>
          )}
        </div>
        <div className={styles.statusRight}>
          <button
            className={styles.refreshBtn}
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label={refreshing ? '更新中' : 'センサーデータを更新'}
            aria-busy={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? styles.spinning : ''} aria-hidden />
          </button>
          <button
            className={styles.filterBtn}
            onClick={() => setFilterOpen(true)}
            aria-label="センサーを絞り込む"
          >
            <SlidersHorizontal size={16} aria-hidden />
          </button>
        </div>
      </div>

      {/* ── オフラインバナー ── */}
      {isOffline && (
        <div className={styles.banner} role="alert">
          <WifiOff size={15} aria-hidden />
          <span>
            {hasNoCache
              ? 'オフラインです。センサーデータを取得できません。'
              : 'オフラインです。最終取得データを表示しています。'}
          </span>
        </div>
      )}

      {/* ── 古いデータバナー ── */}
      {isStale && !isOffline && (
        <div className={`${styles.banner} ${styles.bannerWarn}`} role="alert">
          <AlertTriangle size={15} aria-hidden />
          <span>表示中のデータは古い可能性があります。更新ボタンで最新データを取得してください。</span>
        </div>
      )}

      {/* ── スクリーンリーダー通知 ── */}
      <span role="status" aria-live="polite" className={styles.srOnly}>{liveMsg}</span>

      {/* ── 本文 ── */}
      {isLoading ? (
        renderSkeleton()
      ) : (isError && !retried) ? (
        <div className={styles.body}>
          <div className={styles.errorState}>
            <AlertTriangle size={32} aria-hidden className={styles.errorIcon} />
            <p className={styles.errorMsg}>センサーデータの取得に失敗しました。</p>
            <button className={styles.retryFullBtn} onClick={() => {
              setRetried(true)
              setMetrics(buildMetrics('normal'))
            }}>
              再読み込み
            </button>
          </div>
        </div>
      ) : hasNoCache ? (
        <div className={styles.body}>
          <div className={styles.errorState}>
            <WifiOff size={32} aria-hidden className={styles.errorIcon} />
            <p className={styles.errorMsg}>オフラインのためセンサーデータを表示できません。</p>
            <p className={styles.errorHint}>接続が回復したら更新ボタンを押してください。</p>
          </div>
        </div>
      ) : (
        <div className={styles.body}>
          <div className={styles.cardList} onClick={handleCardClick as React.MouseEventHandler<HTMLDivElement>}>
            {filteredMetrics.map(m => (
              <SensorMetricCard
                key={m.id}
                metric={m}
                onNavigateToGraph={onNavigateToGraph}
                returnTo={returnTo}
              />
            ))}
            {filteredMetrics.length === 0 && (
              <p className={styles.emptyFilter}>選択されたセンサーがありません。絞り込みを変更してください。</p>
            )}
          </div>

          {/* ── 下部案内 ── */}
          <div className={styles.infoBanner} role="note">
            <Info size={15} aria-hidden />
            <span>異常値は通知センターにも届きます</span>
          </div>
        </div>
      )}

      {/* ── Filter Sheet ── */}
      {filterOpen && (
        <SensorFilterSheet
          selected={activeFilter}
          onApply={handleFilterApply}
          onCancel={() => setFilterOpen(false)}
        />
      )}

      {/* ── Setup Sheet ── */}
      {setupOpen && (
        <SensorSetupSheet onClose={() => setSetupOpen(false)} />
      )}
    </div>
  )
}

function renderSkeleton() {
  return (
    <div className={styles.skeletonList} aria-busy="true" aria-label="センサーデータを読み込み中">
      {[...Array(5)].map((_, i) => (
        <div key={i} className={styles.skeletonCard}>
          <div className={styles.skeletonIcon} />
          <div className={styles.skeletonContent}>
            <div className={styles.skeletonLine} style={{ width: '35%', height: 11 }} />
            <div className={styles.skeletonLine} style={{ width: '60%', height: 26 }} />
            <div className={styles.skeletonLine} style={{ width: '50%', height: 12 }} />
          </div>
          <div className={styles.skeletonRight}>
            <div className={styles.skeletonBadge} />
            <div className={styles.skeletonSpark} />
          </div>
          <div className={styles.skeletonChevron} />
        </div>
      ))}
    </div>
  )
}
