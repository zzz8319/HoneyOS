import { useState } from 'react'
import {
  MoreVertical, ChevronDown, Calendar, ChevronRight, X, Plus,
  ClipboardList, AlertCircle, WifiOff, RefreshCw,
} from 'lucide-react'
import { BottomNav } from '../../components'
import type { TabId } from '../../components'
import { TrendLineChart } from './TrendLineChart'
import { RadarChart } from './RadarChart'
import {
  TREND_DATA, DEFAULT_COLONY_IDS, METRIC_LABELS, PERIOD_LABELS,
  SERIES_COLORS, filterByPeriod,
} from './mockData'
import type { ColonyTrendViewState, Metric, Period, CompareMode, YearMode } from './mockData'
import styles from './ColonyTrendScreen.module.css'

interface ColonyTrendScreenProps {
  viewState:  ColonyTrendViewState
  activeTab:  TabId
  onTabChange: (tab: TabId) => void
  onColonyDetail: (colonyId: string) => void
  onInspectionHistory: (colonyId: string) => void
}

export function ColonyTrendScreen({
  viewState, activeTab, onTabChange, onColonyDetail, onInspectionHistory,
}: ColonyTrendScreenProps) {

  // ── Local state ──────────────────────────────────────────────────────────
  const [compareMode, setCompareMode] = useState<CompareMode>('individual')
  const [metric,      setMetric]      = useState<Metric>('strength')
  const [period,      setPeriod]      = useState<Period>('3m')
  const [yearMode,    setYearMode]    = useState<YearMode>('current')
  const [metricOpen,  setMetricOpen]  = useState(false)
  const [pickerOpen,  setPickerOpen]  = useState(false)

  // Selected colony IDs (with assigned colors)
  const [selectedIds, setSelectedIds] = useState<string[]>([...DEFAULT_COLONY_IDS])
  // Active colony for detail card (default: A-03)
  const [activeDetailId, setActiveDetailId] = useState<string>('a3')

  // Derive series from selected IDs
  const allSeries = TREND_DATA.series
  const selectedSeries = selectedIds
    .map((id, i) => {
      const s = allSeries.find(s => s.colonyId === id)
      if (!s) return null
      return { ...s, color: SERIES_COLORS[i % SERIES_COLORS.length] }
    })
    .filter(Boolean) as typeof allSeries

  // Active detail series
  const detailSeries = selectedSeries.find(s => s.colonyId === activeDetailId)
    ?? selectedSeries[0]

  // Period range
  const periodMax = '2026-09-20'
  const periodMin = period === 'all' ? '2026-01-01'
    : period === '1y'  ? '2025-09-20'
    : '2026-06-20'

  // Filter points by period
  function filteredSeries() {
    return selectedSeries.map(s => ({
      ...s,
      points: Object.fromEntries(
        (Object.entries(s.points) as [Metric, typeof s.points.strength][]).map(
          ([k, v]) => [k, filterByPeriod(v, period)]
        )
      ) as typeof s.points,
    }))
  }

  const chartSeries = filteredSeries()
  const prevSeries  = yearMode === 'compare' ? filteredSeries().map(s => ({
    ...s,
    points: Object.fromEntries(
      (Object.entries(s.prevYearPoints ?? s.points) as [Metric, typeof s.points.strength][]).map(
        ([k, v]) => [k, v]
      )
    ) as typeof s.points,
  })) : undefined

  // Average series
  const avgSeries = [
    {
      colonyId: 'avg',
      name: '全体平均',
      color: '#6B7280',
      points: TREND_DATA.average.points,
      radar: { bee: 55, brood: 52, honey: 48, queen: 66, latestDate: '2026年9月20日' },
    },
  ]

  // Colonies available to add (not yet selected)
  const addableColonies = TREND_DATA.availableColonies.filter(
    c => !selectedIds.includes(c.id)
  )

  function removeColony(id: string) {
    setSelectedIds(prev => {
      const next = prev.filter(x => x !== id)
      if (activeDetailId === id && next.length) setActiveDetailId(next[0])
      return next
    })
  }

  function addColony(id: string) {
    if (selectedIds.includes(id)) return
    setSelectedIds(prev => [...prev, id])
    setPickerOpen(false)
  }

  const displaySeries = compareMode === 'average' ? avgSeries : chartSeries
  const displayPrev   = compareMode === 'average' ? undefined : prevSeries

  // ── Render states ────────────────────────────────────────────────────────
  if (viewState === 'loading') return <LoadingScreen activeTab={activeTab} onTabChange={onTabChange} />
  if (viewState === 'error')   return <ErrorScreen   activeTab={activeTab} onTabChange={onTabChange} />
  if (viewState === 'offline') return <OfflineScreen  activeTab={activeTab} onTabChange={onTabChange} />
  if (viewState === 'empty')   return <EmptyTrendScreen activeTab={activeTab} onTabChange={onTabChange} />

  // ── Normal state ─────────────────────────────────────────────────────────
  return (
    <div className={styles.screen}>
      {/* 1. Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>蜂群トレンド</h1>
        <button className={styles.headerBtn} aria-label="メニューを開く">
          <MoreVertical size={20} aria-hidden />
        </button>
      </header>

      {/* Scrollable content */}
      <main className={styles.main}>

        {/* 2. Compare mode segment */}
        <div className={styles.segGroup} role="tablist" aria-label="比較方法">
          {(['individual', 'average'] as CompareMode[]).map(m => (
            <button
              key={m}
              role="tab"
              aria-selected={compareMode === m}
              className={`${styles.segBtn} ${compareMode === m ? styles.segActive : ''}`}
              onClick={() => setCompareMode(m)}
            >
              {m === 'individual' ? '個別群比較' : '全体平均'}
            </button>
          ))}
        </div>

        {/* 3. Metric + period filters */}
        <div className={styles.filterRow}>
          {/* Metric selector */}
          <div className={styles.metricWrap}>
            <button
              className={styles.metricBtn}
              aria-haspopup="listbox"
              aria-expanded={metricOpen}
              aria-label={`指標選択: ${METRIC_LABELS[metric]}`}
              onClick={() => setMetricOpen(o => !o)}
            >
              <span>{METRIC_LABELS[metric]}</span>
              <ChevronDown size={14} aria-hidden />
            </button>
            {metricOpen && (
              <ul className={styles.metricDropdown} role="listbox" aria-label="指標を選択">
                {(Object.entries(METRIC_LABELS) as [Metric, string][]).map(([k, label]) => (
                  <li key={k} role="option" aria-selected={metric === k}>
                    <button
                      className={`${styles.metricOpt} ${metric === k ? styles.metricOptActive : ''}`}
                      onClick={() => { setMetric(k); setMetricOpen(false) }}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Period buttons */}
          {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([p, label]) => (
            <button
              key={p}
              aria-pressed={period === p}
              className={`${styles.periodBtn} ${period === p ? styles.periodActive : ''}`}
              onClick={() => setPeriod(p)}
            >
              {label}
            </button>
          ))}

          {/* Calendar icon */}
          <button className={styles.calBtn} aria-label="カレンダーで期間を指定">
            <Calendar size={16} aria-hidden />
          </button>
        </div>

        {/* 4. Colony chips */}
        {compareMode === 'individual' && (
          <div className={styles.chipsRow} role="list" aria-label="比較対象の蜂群">
            {selectedIds.map((id, i) => {
              const meta = TREND_DATA.availableColonies.find(c => c.id === id)
              const color = SERIES_COLORS[i % SERIES_COLORS.length]
              return (
                <div
                  key={id}
                  role="listitem"
                  className={`${styles.chip} ${activeDetailId === id ? styles.chipActive : ''}`}
                  onClick={() => setActiveDetailId(id)}
                >
                  <span className={styles.chipDot} style={{ background: color }} aria-hidden />
                  <span className={styles.chipLabel}>{meta?.name ?? id}</span>
                  <button
                    className={styles.chipRemove}
                    aria-label={`${meta?.name ?? id}を削除`}
                    onClick={(e) => { e.stopPropagation(); removeColony(id) }}
                  >
                    <X size={11} aria-hidden />
                  </button>
                </div>
              )
            })}
            {addableColonies.length > 0 && (
              <button
                className={styles.chipAdd}
                aria-label="比較する蜂群を追加"
                onClick={() => setPickerOpen(o => !o)}
              >
                <Plus size={12} aria-hidden />
                <span>群を追加</span>
              </button>
            )}
          </div>
        )}

        {/* Colony picker modal */}
        {pickerOpen && (
          <div className={styles.pickerOverlay} role="dialog" aria-label="蜂群を選択" aria-modal="true">
            <div className={styles.pickerSheet} data-testid="colony-picker">
              <div className={styles.pickerHeader}>
                <span className={styles.pickerTitle}>蜂群を追加</span>
                <button className={styles.pickerClose} aria-label="閉じる" onClick={() => setPickerOpen(false)}>
                  <X size={18} aria-hidden />
                </button>
              </div>
              <ul className={styles.pickerList} role="list">
                {addableColonies.map(c => (
                  <li key={c.id}>
                    <button className={styles.pickerItem} onClick={() => addColony(c.id)}>
                      <span className={styles.pickerName}>{c.name}</span>
                      <span className={styles.pickerApiary}>{c.apiaryName}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* 5. Line chart card */}
        <div className={styles.card} data-testid="trend-chart-card">
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>{METRIC_LABELS[metric]}の推移</span>
            {/* Legend */}
            <div className={styles.legend} aria-label="凡例">
              {displaySeries.map(s => (
                <span key={s.colonyId} className={styles.legendItem}>
                  <span className={styles.legendLine} style={{ background: s.color }} aria-hidden />
                  <span>{s.name}</span>
                </span>
              ))}
              {yearMode === 'compare' && displaySeries.map(s => (
                <span key={`prev-${s.colonyId}`} className={styles.legendItem}>
                  <span className={`${styles.legendLine} ${styles.legendDash}`}
                    style={{ background: s.color }} aria-hidden />
                  <span className={styles.legendSmall}>{s.name}（前年）</span>
                </span>
              ))}
              <span className={styles.legendItem}>
                <svg width={20} height={10} aria-hidden>
                  <line x1={0} y1={5} x2={20} y2={5} stroke="#EF4444"
                    strokeWidth={1.5} strokeDasharray="4,2" />
                </svg>
                <span>注意基準（{TREND_DATA.alertThreshold}）</span>
              </span>
            </div>
          </div>

          <TrendLineChart
            series={displaySeries as Parameters<typeof TrendLineChart>[0]['series']}
            prevSeries={displayPrev as Parameters<typeof TrendLineChart>[0]['prevSeries']}
            metric={metric}
            metricLabel={METRIC_LABELS[metric]}
            alertThreshold={TREND_DATA.alertThreshold}
            minDate={periodMin}
            maxDate={periodMax}
          />

          {/* 6. Year comparison segment */}
          <div className={`${styles.segGroup} ${styles.segSmall}`} role="tablist" aria-label="比較対象年">
            {(['current', 'compare'] as YearMode[]).map(m => (
              <button
                key={m}
                role="tab"
                aria-selected={yearMode === m}
                className={`${styles.segBtn} ${styles.segBtnSm} ${yearMode === m ? styles.segActive : ''}`}
                onClick={() => setYearMode(m)}
              >
                {m === 'current' ? '今年' : '去年と比較'}
              </button>
            ))}
          </div>
        </div>

        {/* 7. Detail radar card */}
        {compareMode === 'individual' && detailSeries && (
          <button
            className={`${styles.card} ${styles.detailCard}`}
            onClick={() => onColonyDetail(detailSeries.colonyId)}
            aria-label={`${detailSeries.name}の詳細を見る`}
          >
            <div className={styles.cardHeader}>
              <div>
                <span className={styles.cardTitle}>{detailSeries.name} の内訳</span>
                <span className={styles.cardSub}>（最新：{detailSeries.radar.latestDate}）</span>
              </div>
              <ChevronRight size={18} className={styles.chevron} aria-hidden />
            </div>

            <div className={styles.radarWrap} data-testid="radar-chart">
              <div className={styles.radarLegend}>
                <span className={styles.legendDotWrap}>
                  <span className={styles.legendDot} style={{ background: detailSeries.color }} aria-hidden />
                  <span>{detailSeries.name}</span>
                </span>
              </div>
              <RadarChart data={detailSeries.radar} color={detailSeries.color} />
            </div>
          </button>
        )}

        {/* 8. Inspection history link */}
        <button
          className={styles.historyBtn}
          onClick={() => onInspectionHistory(detailSeries?.colonyId ?? selectedIds[0])}
          data-testid="inspection-history-btn"
        >
          <ClipboardList size={18} className={styles.historyIcon} aria-hidden />
          <span className={styles.historyLabel}>内検履歴を見る</span>
          <ChevronRight size={16} aria-hidden />
        </button>

      </main>

      {/* 9. BottomNav */}
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  )
}

// ── Sub-screens ─────────────────────────────────────────────────────────────
function Shell({ children }: { children: React.ReactNode }) {
  return <div className={styles.screen}>{children}</div>
}
function LoadingScreen({ activeTab, onTabChange }: { activeTab: TabId; onTabChange: (t: TabId) => void }) {
  return (
    <Shell>
      <header className={styles.header}>
        <h1 className={styles.title}>蜂群トレンド</h1>
      </header>
      <main className={styles.main} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div className={styles.spinner} role="status" aria-live="polite" aria-label="読み込み中" />
        <p className={styles.loadingText}>蜂群トレンドを読み込み中…</p>
      </main>
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </Shell>
  )
}

function ErrorScreen({ activeTab, onTabChange }: { activeTab: TabId; onTabChange: (t: TabId) => void }) {
  return (
    <Shell>
      <header className={styles.header}>
        <h1 className={styles.title}>蜂群トレンド</h1>
      </header>
      <main className={styles.stateMain}>
        <AlertCircle size={40} color="var(--color-danger)" aria-hidden />
        <h2 className={styles.stateTitle}>蜂群トレンドを取得できませんでした</h2>
        <p className={styles.stateDesc}>ネットワーク接続を確認してから再度お試しください。</p>
        <button className={styles.primaryBtn} onClick={() => window.location.reload()}>
          <RefreshCw size={15} aria-hidden /> 再試行
        </button>
        <button className={styles.subBtn} onClick={() => history.back()}>戻る</button>
      </main>
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </Shell>
  )
}

function OfflineScreen({ activeTab, onTabChange }: { activeTab: TabId; onTabChange: (t: TabId) => void }) {
  // In a real app, check for cached data here
  const hasCachedData = false
  return (
    <Shell>
      <header className={styles.header}>
        <h1 className={styles.title}>蜂群トレンド</h1>
      </header>
      <main className={styles.stateMain}>
        <WifiOff size={40} color="var(--color-text-secondary)" aria-hidden />
        {hasCachedData ? (
          <p className={styles.offlineBanner}>オフライン — 保存済みのトレンドを表示しています</p>
        ) : (
          <>
            <h2 className={styles.stateTitle}>保存済みのトレンドがありません</h2>
            <p className={styles.stateDesc}>オンライン時に蜂群トレンドを表示しておくと、オフラインでも確認できます。</p>
            <button className={styles.subBtn} onClick={() => history.back()}>戻る</button>
          </>
        )}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </Shell>
  )
}

function EmptyTrendScreen({ activeTab, onTabChange }: { activeTab: TabId; onTabChange: (t: TabId) => void }) {
  return (
    <Shell>
      <header className={styles.header}>
        <h1 className={styles.title}>蜂群トレンド</h1>
      </header>
      <main className={styles.stateMain}>
        <h2 className={styles.stateTitle}>トレンドデータがありません</h2>
        <p className={styles.stateDesc}>比較できる蜂群の記録がありません。</p>
        <button className={styles.primaryBtn}>内検記録を追加</button>
      </main>
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </Shell>
  )
}
