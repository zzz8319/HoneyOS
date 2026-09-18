import { useState, useMemo, useId } from 'react'
import type { ReportViewState, ReportPeriodMode, ReportAggUnit } from './types'
import {
  REPORT_APIARIES,
  REPORT_COLONIES,
  REPORT_RECORDS,
  STRENGTH_ENTRIES,
} from './mockData'
import {
  filterByMonth,
  filterByYear,
  filterByApiary,
  filterStrengthByApiary,
  buildKPI,
  calcWorkBreakdown,
  calcMonthlyHarvest,
  calcMonthlyStrength,
} from './aggregations'
import { BottomNav } from '../../components'
import styles from './ReportScreen.module.css'

// ── Icons (inline SVG) ──────────────────────────────────────────────────────

function IconMore() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
    </svg>
  )
}

function IconChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4l-6 6 6 6"/>
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 4l6 6-6 6"/>
    </svg>
  )
}

function IconSelectChevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 5l4 4 4-4"/>
    </svg>
  )
}

function IconHoney() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="5" y="8" width="4" height="9" rx="1" fill="#E39A16" opacity="0.6"/>
      <rect x="11" y="4" width="4" height="13" rx="1" fill="#E39A16" opacity="0.85"/>
    </svg>
  )
}

function IconClipboard() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#66707A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="4" width="12" height="14" rx="2"/>
      <path d="M7 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/>
      <path d="M7 9h6M7 12h4"/>
    </svg>
  )
}

function IconBarChart() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#66707A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="10" width="3" height="7" rx="1"/>
      <rect x="8.5" y="6" width="3" height="11" rx="1"/>
      <rect x="14" y="3" width="3" height="14" rx="1"/>
    </svg>
  )
}

function IconAlert() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 3L2 16h16L10 3z"/>
      <path d="M10 9v4M10 14.5v.5"/>
    </svg>
  )
}

function IconHistory() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 8a7 7 0 1 0 7-7A7 7 0 0 0 2 4"/>
      <path d="M1 1v3h3"/>
      <path d="M8 5v3l2 2"/>
    </svg>
  )
}

function IconFilePdf() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6L9 2z"/>
      <path d="M9 2v4h4"/>
      <path d="M5 9h1.5a1 1 0 0 1 0 2H5V9zM9 9h1c.6 0 1 .4 1 1s-.4 1-1 1"/>
    </svg>
  )
}

function IconFileCsv() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6L9 2z"/>
      <path d="M9 2v4h4"/>
      <path d="M5 10c0-.6.4-1 1-1h.5M11 9l-.5 2.5L9.5 9 9 11.5"/>
    </svg>
  )
}

// ── MONTH_LABELS ─────────────────────────────────────────────────────────────

const MONTH_LABELS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

// ── Harvest bar chart (SVG) ──────────────────────────────────────────────────

function HarvestChart({
  data,
  selectedMonth,
}: {
  data: { month: number; kg: number }[]
  selectedMonth: number
}) {
  const W = 340
  const H = 140
  const PAD_L = 30
  const PAD_R = 6
  const PAD_T = 16
  const PAD_B = 24
  const chartW = W - PAD_L - PAD_R
  const chartH = H - PAD_T - PAD_B
  const maxKg = Math.max(...data.map(d => d.kg), 10)
  // Only render months that exist in data (trim trailing zeros for monthly fixture)
  const nonZeroMonths = data.filter(d => d.kg > 0)
  const lastMonth = nonZeroMonths.length > 0 ? nonZeroMonths[nonZeroMonths.length - 1].month : 12
  const visibleData = data.slice(0, lastMonth)
  const numBars = visibleData.length
  const barGroupW = chartW / numBars
  const barW = Math.max(4, Math.floor(barGroupW * 0.55))
  // Y-axis grid: 0, half, max rounded to nice number
  const gridTop = Math.ceil(maxKg / 10) * 10
  const gridMid = Math.round(gridTop / 2)

  return (
    <div className={styles.svgWrap}>
      <svg viewBox={`0 0 ${W} ${H}`} aria-label="採蜜量の推移">
        {/* grid lines */}
        {[0, gridMid, gridTop].map(v => {
          const y = PAD_T + chartH - (v / gridTop) * chartH
          return (
            <g key={v}>
              <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="#E3E5E8" strokeWidth="0.75"/>
              <text x={PAD_L - 3} y={y + 4} fontSize="8" textAnchor="end" fill="#9CA3AF">{v}</text>
            </g>
          )
        })}
        {/* baseline */}
        <line x1={PAD_L} x2={W - PAD_R} y1={PAD_T + chartH} y2={PAD_T + chartH} stroke="#E3E5E8" strokeWidth="0.75"/>
        {/* bars */}
        {visibleData.map((d, i) => {
          const barH = d.kg === 0 ? 0 : Math.max(2, (d.kg / gridTop) * chartH)
          const x = PAD_L + i * barGroupW + (barGroupW - barW) / 2
          const y = PAD_T + chartH - barH
          const active = d.month === selectedMonth
          return (
            <g key={d.month}>
              <rect
                x={x} y={y} width={barW} height={barH}
                rx="2"
                fill={active ? '#E39A16' : '#FDE68A'}
              />
              {/* value label on active bar */}
              {active && d.kg > 0 && (
                <text x={x + barW / 2} y={y - 3} fontSize="9" textAnchor="middle" fill="#E39A16" fontWeight="600">
                  {d.kg.toFixed(1)}
                </text>
              )}
              <text x={x + barW / 2} y={H - 5} fontSize="8" textAnchor="middle" fill="#9CA3AF">
                {MONTH_LABELS[i]}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Strength line chart (SVG) ──────────────────────────────────────────────

function StrengthChart({
  data,
  avgLabel,
}: {
  data: { month: number; avgScore: number | null }[]
  avgLabel: string
}) {
  const W = 340
  const H = 140
  const PAD_L = 30
  const PAD_R = 6
  const PAD_T = 8
  const PAD_B = 24
  const chartW = W - PAD_L - PAD_R
  const chartH = H - PAD_T - PAD_B
  const THRESHOLD = 60

  const toXY = (m: number, score: number) => ({
    x: PAD_L + ((m - 1) / 11) * chartW,
    y: PAD_T + chartH - (score / 100) * chartH,
  })

  const points = data.filter(d => d.avgScore != null) as { month: number; avgScore: number }[]

  let pathD = ''
  points.forEach((p, i) => {
    const { x, y } = toXY(p.month, p.avgScore)
    pathD += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`
  })

  const thresholdY = PAD_T + chartH - (THRESHOLD / 100) * chartH

  return (
    <div className={styles.svgWrap}>
      <svg viewBox={`0 0 ${W} ${H}`} aria-label="強さスコア推移">
        {/* grid lines */}
        {[0, 50, 100].map(v => {
          const y = PAD_T + chartH - (v / 100) * chartH
          return (
            <g key={v}>
              <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="#E3E5E8" strokeWidth="0.75"/>
              <text x={PAD_L - 3} y={y + 4} fontSize="8" textAnchor="end" fill="#9CA3AF">{v}</text>
            </g>
          )
        })}
        {/* threshold line */}
        <line
          x1={PAD_L} x2={W - PAD_R} y1={thresholdY} y2={thresholdY}
          stroke="#DC2626" strokeWidth="1" strokeDasharray="4 2"
        />
        {/* score line */}
        {pathD && (
          <path d={pathD} fill="none" stroke="#E39A16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        )}
        {/* dots */}
        {points.map(p => {
          const { x, y } = toXY(p.month, p.avgScore)
          return (
            <circle key={p.month} cx={x} cy={y} r="3.5" fill="#E39A16" stroke="#FFFFFF" strokeWidth="1.5"/>
          )
        })}
        {/* month labels */}
        {MONTH_LABELS.map((m, i) => {
          const x = PAD_L + (i / 11) * chartW
          return (
            <text key={m} x={x} y={H - 5} fontSize="8" textAnchor="middle" fill="#9CA3AF">{m}</text>
          )
        })}
        {/* avg label top-right */}
        {avgLabel && (
          <text x={W - PAD_R} y={PAD_T + 10} fontSize="9" textAnchor="end" fill="#E39A16" fontWeight="600">
            {avgLabel}
          </text>
        )}
      </svg>
    </div>
  )
}

// ── Shared header component ──────────────────────────────────────────────────

function ReportHeader() {
  return (
    <header className={styles.header}>
      <h1 className={styles.headerTitle}>レポート</h1>
      <button className={styles.headerBtn} aria-label="メニュー">
        <IconMore/>
      </button>
    </header>
  )
}

// ── Props ────────────────────────────────────────────────────────────────────

export interface ReportScreenProps {
  viewState?: ReportViewState
  onBack?: () => void
  onViewHistory?: () => void
  onTabChange?: (tab: import('../../components').TabId) => void
}

// ── Component ────────────────────────────────────────────────────────────────

export function ReportScreen({
  viewState = 'normal',
  onBack,
  onViewHistory,
  onTabChange,
}: ReportScreenProps) {
  const noop = () => {}
  const today = new Date(2026, 8, 1) // Sep 2026
  const [mode, setMode] = useState<ReportPeriodMode>('monthly')
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [aggUnit, setAggUnit] = useState<ReportAggUnit>('overall')
  const [apiaryId, setApiaryId] = useState<string | null>(null)
  const selectId = useId()

  const MIN_YEAR = 2024
  const MAX_YEAR = today.getFullYear()
  const MAX_MONTH = mode === 'monthly' && year === today.getFullYear()
    ? today.getMonth() + 1
    : 12

  const canPrev = mode === 'monthly'
    ? (month > 1 || year > MIN_YEAR)
    : year > MIN_YEAR
  const canNext = mode === 'monthly'
    ? (month < MAX_MONTH || year < MAX_YEAR)
    : year < MAX_YEAR

  function prevPeriod() {
    if (mode === 'monthly') {
      if (month > 1) setMonth(m => m - 1)
      else if (year > MIN_YEAR) { setYear(y => y - 1); setMonth(12) }
    } else {
      if (year > MIN_YEAR) setYear(y => y - 1)
    }
  }

  function nextPeriod() {
    if (mode === 'monthly') {
      if (month < MAX_MONTH) setMonth(m => m + 1)
      else if (year < MAX_YEAR) { setYear(y => y + 1); setMonth(1) }
    } else {
      if (year < MAX_YEAR) setYear(y => y + 1)
    }
  }

  const periodLabel = mode === 'monthly' ? `${year}年${month}月` : `${year}年`

  // apiaryId applies regardless of aggUnit
  const { kpi, breakdown, monthlyHarvest, monthlyStrength } = useMemo(() => {
    const apId = apiaryId
    const baseRecords = filterByApiary(REPORT_RECORDS, apId)
    const baseStrength = filterStrengthByApiary(STRENGTH_ENTRIES, apId)

    const current = mode === 'monthly'
      ? filterByMonth(baseRecords, year, month)
      : filterByYear(baseRecords, year)

    const prev: typeof current | null = (() => {
      if (mode === 'monthly') {
        const pm = month === 1 ? 12 : month - 1
        const py = month === 1 ? year - 1 : year
        return filterByMonth(baseRecords, py, pm)
      }
      return year > MIN_YEAR ? filterByYear(baseRecords, year - 1) : null
    })()

    const activeColonies = apId
      ? REPORT_COLONIES.filter(c => c.apiaryId === apId)
      : REPORT_COLONIES

    const kpi = buildKPI(current, prev, activeColonies)
    const breakdown = calcWorkBreakdown(current)
    const monthlyHarvest = calcMonthlyHarvest(baseRecords, year)
    const monthlyStrength = calcMonthlyStrength(baseStrength)

    return { kpi, breakdown, monthlyHarvest, monthlyStrength }
  }, [mode, year, month, apiaryId])

  // KPI change formatter: ↑/↓ style
  function fmtChange(v: number | null, unit = '%'): string {
    if (v == null) return '—'
    const arrow = v >= 0 ? '↑' : '↓'
    return `${arrow} ${Math.abs(v)}${unit}`
  }

  const bdMax = Math.max(breakdown.harvest, breakdown.feeding, breakdown.treatment, breakdown.other, 1)

  // Average strength score for badge
  const strengthPoints = monthlyStrength.filter(d => d.avgScore != null) as { month: number; avgScore: number }[]
  const avgStrength = strengthPoints.length > 0
    ? Math.round(strengthPoints.reduce((s, p) => s + p.avgScore, 0) / strengthPoints.length)
    : null

  // ── Loading state ────────────────────────────────────────────────────────
  if (viewState === 'loading') {
    return (
      <div className={styles.screen}>
        <ReportHeader/>
        <div className={styles.loadingBody} aria-live="polite">
          <div className={styles.spinner} role="status" aria-label="読み込み中"/>
          <p className={styles.loadingText}>レポートを読み込み中…</p>
        </div>
        <div className={styles.navSpacer}/>
        <BottomNav activeTab="analytics" onTabChange={onTabChange ?? noop}/>
      </div>
    )
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (viewState === 'error') {
    return (
      <div className={styles.screen}>
        <ReportHeader/>
        <div className={styles.stateBody}>
          <p className={styles.stateTitle}>レポートを取得できませんでした</p>
          <p className={styles.stateText}>ネットワーク接続を確認してから再度お試しください。</p>
          <div className={styles.stateActions}>
            <button className={styles.primaryBtn}>再試行</button>
            <button className={styles.outlineBtn} onClick={onBack}>戻る</button>
          </div>
        </div>
        <div className={styles.navSpacer}/>
        <BottomNav activeTab="analytics" onTabChange={onTabChange ?? noop}/>
      </div>
    )
  }

  // ── Offline-no-cache state ───────────────────────────────────────────────
  if (viewState === 'offline-no-cache') {
    return (
      <div className={styles.screen}>
        <ReportHeader/>
        <div className={styles.stateBody}>
          <p className={styles.stateTitle}>保存済みのレポートがありません</p>
          <p className={styles.stateText}>オンライン時にレポートを表示しておくと、オフラインでも確認できます。</p>
          <div className={styles.stateActions}>
            <button className={styles.outlineBtn} onClick={onBack}>戻る</button>
          </div>
        </div>
        <div className={styles.navSpacer}/>
        <BottomNav activeTab="analytics" onTabChange={onTabChange ?? noop}/>
      </div>
    )
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (viewState === 'empty') {
    return (
      <div className={styles.screen}>
        <ReportHeader/>
        <div className={styles.stateBody}>
          <p className={styles.stateTitle}>レポートデータがありません</p>
          <p className={styles.stateText}>選択した期間の作業記録がありません。</p>
          <div className={styles.stateActions}>
            <button className={styles.primaryBtn}>作業記録を追加</button>
          </div>
        </div>
        <div className={styles.navSpacer}/>
        <BottomNav activeTab="analytics" onTabChange={onTabChange ?? noop}/>
      </div>
    )
  }

  // ── Normal / Offline states ──────────────────────────────────────────────
  const isOffline = viewState === 'offline'

  return (
    <div className={styles.screen}>
      <ReportHeader/>

      {/* Offline banner */}
      {isOffline && (
        <div className={styles.offlineBanner} role="alert">
          オフライン — 保存済みのレポートを表示しています
        </div>
      )}

      <div className={styles.body}>

        {/* Segment control */}
        <div className={styles.segmentWrap}>
          <div className={styles.segment} role="group" aria-label="集計期間">
            <button
              className={`${styles.segBtn} ${mode === 'monthly' ? styles.segBtnActive : ''}`}
              onClick={() => setMode('monthly')}
              aria-pressed={mode === 'monthly'}
            >月次</button>
            <button
              className={`${styles.segBtn} ${mode === 'yearly' ? styles.segBtnActive : ''}`}
              onClick={() => setMode('yearly')}
              aria-pressed={mode === 'yearly'}
            >年次</button>
          </div>
        </div>

        {/* Period nav */}
        <div className={styles.periodNav}>
          <button
            className={styles.chevronBtn}
            onClick={prevPeriod}
            disabled={!canPrev}
            aria-label="前の期間"
          >
            <IconChevronLeft/>
          </button>
          <span className={styles.periodLabel}>{periodLabel}</span>
          <button
            className={styles.chevronBtn}
            onClick={nextPeriod}
            disabled={!canNext}
            aria-label="次の期間"
          >
            <IconChevronRight/>
          </button>
        </div>

        {/* Filter bar — apiary select always visible */}
        <div className={styles.filterBar}>
          {(['overall', 'apiary', 'colony'] as ReportAggUnit[]).map(u => (
            <button
              key={u}
              className={`${styles.aggTab} ${aggUnit === u ? styles.aggTabActive : ''}`}
              onClick={() => setAggUnit(u)}
              aria-pressed={aggUnit === u}
            >
              {u === 'overall' ? '全体' : u === 'apiary' ? '養蜂場別' : '蜂群別'}
            </button>
          ))}
          <div className={styles.apiarySelectWrap}>
            <select
              id={selectId}
              className={styles.apiarySelect}
              value={apiaryId ?? ''}
              onChange={e => setApiaryId(e.target.value || null)}
              aria-label="養蜂場を選択"
            >
              <option value="">全養蜂場</option>
              {REPORT_APIARIES.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <IconSelectChevron/>
          </div>
        </div>

        {/* KPI grid */}
        <div className={styles.kpiGrid}>
          {/* 採蜜量 */}
          <div className={styles.kpiCard}>
            <span className={styles.kpiIcon}><IconHoney/></span>
            <span className={styles.kpiLabel}>採蜜量</span>
            <span className={styles.kpiValue}>
              {kpi.harvestKg.toFixed(1)}<span className={styles.kpiUnit}> kg</span>
            </span>
            {kpi.harvestKgPrevChange != null && (
              <span className={`${styles.kpiChange} ${kpi.harvestKgPrevChange < 0 ? styles.kpiChangeMinus : ''}`}>
                {fmtChange(kpi.harvestKgPrevChange)}
              </span>
            )}
          </div>

          {/* 作業 */}
          <div className={styles.kpiCard}>
            <span className={styles.kpiIcon}><IconClipboard/></span>
            <span className={styles.kpiLabel}>作業</span>
            <span className={styles.kpiValue}>
              {kpi.workCount}<span className={styles.kpiUnit}> 件</span>
            </span>
          </div>

          {/* 内検実施率 */}
          <div className={styles.kpiCard}>
            <span className={styles.kpiIcon}><IconBarChart/></span>
            <span className={styles.kpiLabel}>内検実施率</span>
            <span className={styles.kpiValue}>
              {kpi.inspectionRate != null ? kpi.inspectionRate : '—'}
              {kpi.inspectionRate != null && <span className={styles.kpiUnit}> %</span>}
            </span>
            {kpi.inspectionRatePrevChange != null && (
              <span className={`${styles.kpiChange} ${kpi.inspectionRatePrevChange < 0 ? styles.kpiChangeMinus : ''}`}>
                {fmtChange(kpi.inspectionRatePrevChange, 'pt')}
              </span>
            )}
          </div>

          {/* AI異常 */}
          <div className={styles.kpiCard}>
            <span className={styles.kpiIcon}><IconAlert/></span>
            <span className={styles.kpiLabel}>AI異常</span>
            <span className={styles.kpiValue}>
              {kpi.aiAlertCount}<span className={styles.kpiUnit}> 件</span>
            </span>
          </div>
        </div>

        {/* 採蜜量グラフ */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>採蜜量の推移</h2>
            <span className={styles.chartBadge}>{year}年</span>
          </div>
          <div className={styles.chartLegend}>
            <span className={styles.legendItem}>
              <span className={styles.legendLine}/>
              採蜜量（kg）
            </span>
          </div>
          <HarvestChart
            data={monthlyHarvest}
            selectedMonth={mode === 'monthly' ? month : -1}
          />
        </div>

        {/* 強さスコアグラフ */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>強さスコア推移</h2>
            <span className={styles.chartBadge}>{year}年</span>
          </div>
          <div className={styles.chartLegend}>
            <span className={styles.legendItem}>
              <span className={styles.legendLine}/>
              平均
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendLineDashed}/>
              注意基準（60）
            </span>
          </div>
          <StrengthChart
            data={monthlyStrength}
            avgLabel={avgStrength != null ? `平均 ${avgStrength}` : ''}
          />
        </div>

        {/* 作業内訳 — 常時表示 */}
        <div className={styles.breakdownCard}>
          <h2 className={styles.breakdownTitle}>作業内訳</h2>
          {[
            { key: 'harvest',   label: '採蜜',   count: breakdown.harvest },
            { key: 'feeding',   label: '給餌',   count: breakdown.feeding },
            { key: 'treatment', label: '治療',   count: breakdown.treatment },
            { key: 'other',     label: 'その他', count: breakdown.other },
          ].map(({ key, label, count }) => (
            <div key={key} className={styles.breakdownRow}>
              <span className={styles.breakdownLabel}>{label}</span>
              <span className={styles.breakdownCount}>{count}件</span>
              <div className={styles.breakdownBarWrap}>
                <div
                  className={styles.breakdownBar}
                  style={{ width: `${(count / bdMax) * 100}%` }}
                  role="progressbar"
                  aria-valuenow={count}
                  aria-valuemax={bdMax}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 最下部操作 */}
        <div className={styles.bottomActions}>
          <button className={styles.historyBtn} onClick={onViewHistory}>
            <IconHistory/>
            履歴を見る ›
          </button>
          <button className={styles.exportBtn} disabled aria-label="PDFエクスポート（未実装）">
            <IconFilePdf/>
            PDF
          </button>
          <button className={styles.exportBtn} disabled aria-label="CSVエクスポート（未実装）">
            <IconFileCsv/>
            CSV
          </button>
          <span className={styles.versionBadge}>v2.0</span>
        </div>

        <div className={styles.navSpacer}/>
      </div>

      <BottomNav activeTab="analytics" onTabChange={onTabChange ?? noop}/>
    </div>
  )
}
