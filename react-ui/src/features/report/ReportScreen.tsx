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

function IconBack() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
  )
}

function IconMore() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
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
      <path d="M10 2l3 5H7L10 2z" fill="#E39A16" opacity="0.8"/>
      <rect x="6" y="7" width="8" height="10" rx="2" fill="#E39A16" opacity="0.6"/>
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

function IconDownload() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2v8M5 7l3 3 3-3M2 12h12"/>
    </svg>
  )
}

// ── Harvest bar chart (SVG) ──────────────────────────────────────────────────

function HarvestChart({
  data,
  selectedMonth,
}: {
  data: { month: number; kg: number }[]
  selectedMonth: number
}) {
  const W = 340
  const H = 120
  const PAD_L = 28
  const PAD_R = 8
  const PAD_T = 8
  const PAD_B = 20
  const chartW = W - PAD_L - PAD_R
  const chartH = H - PAD_T - PAD_B
  const barW = Math.floor(chartW / 12) - 2
  const maxKg = Math.max(...data.map(d => d.kg), 1)
  const MONTHS = ['1','2','3','4','5','6','7','8','9','10','11','12']

  return (
    <div className={styles.svgWrap}>
      <svg viewBox={`0 0 ${W} ${H}`} aria-label="月別収穫量">
        {/* grid lines */}
        {[0, 0.5, 1].map(f => {
          const y = PAD_T + chartH * (1 - f)
          const kg = Math.round(maxKg * f)
          return (
            <g key={f}>
              <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="#E3E5E8" strokeWidth="0.5"/>
              <text x={PAD_L - 2} y={y + 4} fontSize="8" textAnchor="end" fill="#66707A">{kg}</text>
            </g>
          )
        })}
        {/* bars */}
        {data.map((d, i) => {
          const barH = d.kg === 0 ? 0 : Math.max(2, (d.kg / maxKg) * chartH)
          const x = PAD_L + i * (chartW / 12) + (chartW / 12 - barW) / 2
          const y = PAD_T + chartH - barH
          const active = d.month === selectedMonth
          return (
            <g key={d.month}>
              <rect
                x={x} y={y} width={barW} height={barH}
                rx="2"
                fill={active ? '#E39A16' : '#FDE68A'}
              />
              <text x={x + barW / 2} y={H - 6} fontSize="8" textAnchor="middle" fill="#66707A">
                {MONTHS[i]}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Strength line chart (SVG) ──────────────────────────────────────────────

function StrengthChart({ data }: { data: { month: number; avgScore: number | null }[] }) {
  const W = 340
  const H = 120
  const PAD_L = 28
  const PAD_R = 8
  const PAD_T = 8
  const PAD_B = 20
  const chartW = W - PAD_L - PAD_R
  const chartH = H - PAD_T - PAD_B
  const MONTHS = ['1','2','3','4','5','6','7','8','9','10','11','12']
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
      <svg viewBox={`0 0 ${W} ${H}`} aria-label="群勢スコア推移">
        {/* grid lines */}
        {[0, 50, 100].map(v => {
          const y = PAD_T + chartH - (v / 100) * chartH
          return (
            <g key={v}>
              <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="#E3E5E8" strokeWidth="0.5"/>
              <text x={PAD_L - 2} y={y + 4} fontSize="8" textAnchor="end" fill="#66707A">{v}</text>
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
            <circle key={p.month} cx={x} cy={y} r="3" fill="#E39A16" stroke="#FFFFFF" strokeWidth="1.5"/>
          )
        })}
        {/* month labels */}
        {MONTHS.map((m, i) => {
          const x = PAD_L + (i / 11) * chartW
          return (
            <text key={m} x={x} y={H - 6} fontSize="8" textAnchor="middle" fill="#66707A">{m}</text>
          )
        })}
      </svg>
    </div>
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
  const today = new Date(2026, 8, 1) // Sep 2026 (month is 0-indexed)
  const [mode, setMode] = useState<ReportPeriodMode>('monthly')
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [aggUnit, setAggUnit] = useState<ReportAggUnit>('overall')
  const [apiaryId, setApiaryId] = useState<string | null>(null)
  const selectId = useId()

  // Period nav limits
  const MIN_YEAR = 2024
  const MAX_YEAR = today.getFullYear()
  const MIN_MONTH = 1
  const MAX_MONTH = mode === 'monthly' && year === today.getFullYear()
    ? today.getMonth() + 1
    : 12

  const canPrevMonth = month > MIN_MONTH || year > MIN_YEAR
  const canNextMonth = month < MAX_MONTH || (year < MAX_YEAR)
  const canPrevYear = year > MIN_YEAR
  const canNextYear = year < MAX_YEAR

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

  const periodLabel = mode === 'monthly'
    ? `${year}年${month}月`
    : `${year}年`

  // Aggregated data
  const { kpi, breakdown, monthlyHarvest, monthlyStrength } = useMemo(() => {
    const apId = aggUnit === 'apiary' ? apiaryId : null
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

    const strengthForYear = mode === 'monthly'
      ? baseStrength.filter(e => e.month === month)
      : baseStrength
    const monthlyHarvest = calcMonthlyHarvest(baseRecords, year)
    const monthlyStrength = calcMonthlyStrength(
      mode === 'monthly' ? baseStrength : baseStrength
    )

    return { kpi, breakdown, monthlyHarvest, monthlyStrength, strengthForYear }
  }, [mode, year, month, aggUnit, apiaryId])

  // ── Loading state ──────────────────────────────────────────────────────────
  if (viewState === 'loading') {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <button className={styles.headerBtn} onClick={onBack} aria-label="戻る">
            <IconBack/>
          </button>
          <h1 className={styles.headerTitle}>レポート</h1>
          <button className={styles.headerBtn} aria-label="メニュー">
            <IconMore/>
          </button>
        </header>
        <div className={styles.loadingBody}>
          <div className={styles.spinner} role="status" aria-label="読み込み中"/>
          <p className={styles.loadingText}>レポートを生成中...</p>
        </div>
        <div className={styles.navSpacer}/>
        <BottomNav activeTab="analytics" onTabChange={onTabChange ?? noop}/>
      </div>
    )
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (viewState === 'error') {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <button className={styles.headerBtn} onClick={onBack} aria-label="戻る">
            <IconBack/>
          </button>
          <h1 className={styles.headerTitle}>レポート</h1>
          <button className={styles.headerBtn} aria-label="メニュー">
            <IconMore/>
          </button>
        </header>
        <div className={styles.stateBody}>
          <p className={styles.stateTitle}>データを取得できません</p>
          <p className={styles.stateText}>ネットワーク接続を確認してから、もう一度お試しください。</p>
          <div className={styles.stateActions}>
            <button className={styles.primaryBtn}>再読み込み</button>
            <button className={styles.outlineBtn} onClick={onBack}>戻る</button>
          </div>
        </div>
        <div className={styles.navSpacer}/>
        <BottomNav activeTab="analytics" onTabChange={onTabChange ?? noop}/>
      </div>
    )
  }

  // ── Offline-no-cache state ─────────────────────────────────────────────────
  if (viewState === 'offline-no-cache') {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <button className={styles.headerBtn} onClick={onBack} aria-label="戻る">
            <IconBack/>
          </button>
          <h1 className={styles.headerTitle}>レポート</h1>
          <button className={styles.headerBtn} aria-label="メニュー">
            <IconMore/>
          </button>
        </header>
        <div className={styles.stateBody}>
          <p className={styles.stateTitle}>オフラインです</p>
          <p className={styles.stateText}>レポートを表示するにはインターネット接続が必要です。キャッシュデータがありません。</p>
          <div className={styles.stateActions}>
            <button className={styles.primaryBtn}>接続後に再試行</button>
            <button className={styles.outlineBtn} onClick={onBack}>戻る</button>
          </div>
        </div>
        <div className={styles.navSpacer}/>
        <BottomNav activeTab="analytics" onTabChange={onTabChange ?? noop}/>
      </div>
    )
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (viewState === 'empty') {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <button className={styles.headerBtn} onClick={onBack} aria-label="戻る">
            <IconBack/>
          </button>
          <h1 className={styles.headerTitle}>レポート</h1>
          <button className={styles.headerBtn} aria-label="メニュー">
            <IconMore/>
          </button>
        </header>
        <div className={styles.stateBody}>
          <p className={styles.stateTitle}>この期間のデータがありません</p>
          <p className={styles.stateText}>作業記録を追加すると、レポートが表示されます。</p>
          <div className={styles.stateActions}>
            <button className={styles.primaryBtn}>作業を記録する</button>
            <button className={styles.outlineBtn} onClick={onBack}>戻る</button>
          </div>
        </div>
        <div className={styles.navSpacer}/>
        <BottomNav activeTab="analytics" onTabChange={onTabChange ?? noop}/>
      </div>
    )
  }

  // ── Normal / Offline states ────────────────────────────────────────────────
  const isOffline = viewState === 'offline'

  // KPI formatting helpers
  function fmtChange(v: number | null, unit = '%'): string {
    if (v == null) return '—'
    return `${v >= 0 ? '+' : ''}${v}${unit}`
  }

  const bdTotal = breakdown.harvest + breakdown.feeding + breakdown.treatment + breakdown.other

  return (
    <div className={styles.screen}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.headerBtn} onClick={onBack} aria-label="戻る">
          <IconBack/>
        </button>
        <h1 className={styles.headerTitle}>レポート</h1>
        <button className={styles.headerBtn} aria-label="メニュー">
          <IconMore/>
        </button>
      </header>

      {/* Offline banner */}
      {isOffline && (
        <div className={styles.offlineBanner} role="alert">
          オフライン — キャッシュデータを表示中
        </div>
      )}

      {/* Scrollable body */}
      <div className={styles.body}>

        {/* Segment control */}
        <div className={styles.segmentWrap}>
          <div className={styles.segment} role="group" aria-label="集計期間">
            <button
              className={`${styles.segBtn} ${mode === 'monthly' ? styles.segBtnActive : ''}`}
              onClick={() => setMode('monthly')}
              aria-pressed={mode === 'monthly'}
            >
              月次
            </button>
            <button
              className={`${styles.segBtn} ${mode === 'yearly' ? styles.segBtnActive : ''}`}
              onClick={() => setMode('yearly')}
              aria-pressed={mode === 'yearly'}
            >
              年次
            </button>
          </div>
        </div>

        {/* Period nav */}
        <div className={styles.periodNav}>
          <button
            className={styles.chevronBtn}
            onClick={prevPeriod}
            disabled={mode === 'monthly' ? !canPrevMonth : !canPrevYear}
            aria-label="前の期間"
          >
            <IconChevronLeft/>
          </button>
          <span className={styles.periodLabel}>{periodLabel}</span>
          <button
            className={styles.chevronBtn}
            onClick={nextPeriod}
            disabled={mode === 'monthly' ? !canNextMonth : !canNextYear}
            aria-label="次の期間"
          >
            <IconChevronRight/>
          </button>
        </div>

        {/* Filter bar */}
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
          {aggUnit === 'apiary' && (
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
          )}
        </div>

        {/* KPI grid */}
        <div className={styles.kpiGrid}>
          {/* Harvest */}
          <div className={styles.kpiCard}>
            <span className={styles.kpiIcon}><IconHoney/></span>
            <span className={styles.kpiLabel}>収穫量</span>
            <span className={styles.kpiValue}>
              {kpi.harvestKg.toFixed(1)}<span className={styles.kpiUnit}> kg</span>
            </span>
            {kpi.harvestKgPrevChange != null && (
              <span className={`${styles.kpiChange} ${kpi.harvestKgPrevChange < 0 ? styles.kpiChangeMinus : ''}`}>
                {fmtChange(kpi.harvestKgPrevChange)}
              </span>
            )}
          </div>

          {/* Work count */}
          <div className={styles.kpiCard}>
            <span className={styles.kpiIcon}><IconClipboard/></span>
            <span className={styles.kpiLabel}>作業件数</span>
            <span className={styles.kpiValue}>
              {kpi.workCount}<span className={styles.kpiUnit}> 件</span>
            </span>
          </div>

          {/* Inspection rate */}
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

          {/* AI alerts */}
          <div className={styles.kpiCard}>
            <span className={styles.kpiIcon}><IconAlert/></span>
            <span className={styles.kpiLabel}>AI異常検知</span>
            <span className={styles.kpiValue}>
              {kpi.aiAlertCount}<span className={styles.kpiUnit}> 件</span>
            </span>
          </div>
        </div>

        {/* Harvest chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>月別収穫量</h2>
            <span className={styles.chartBadge}>{year}年</span>
          </div>
          <div className={styles.chartLegend}>
            <span className={styles.legendItem}>
              <span className={styles.legendLine}/>
              収穫量 (kg)
            </span>
          </div>
          <HarvestChart data={monthlyHarvest} selectedMonth={mode === 'monthly' ? month : -1}/>
        </div>

        {/* Strength chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>群勢スコア推移</h2>
            <span className={styles.chartBadge}>{year}年</span>
          </div>
          <div className={styles.chartLegend}>
            <span className={styles.legendItem}>
              <span className={styles.legendLine}/>
              平均群勢
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendLineDashed}/>
              警告閾値 (60)
            </span>
          </div>
          <StrengthChart data={monthlyStrength}/>
        </div>

        {/* Work breakdown */}
        {bdTotal > 0 && (
          <div className={styles.breakdownCard}>
            <h2 className={styles.breakdownTitle}>作業内訳</h2>
            {[
              { key: 'harvest', label: '採蜜', count: breakdown.harvest },
              { key: 'feeding', label: '給餌', count: breakdown.feeding },
              { key: 'treatment', label: '処置', count: breakdown.treatment },
              { key: 'other', label: 'その他', count: breakdown.other },
            ].map(({ key, label, count }) => (
              <div key={key} className={styles.breakdownRow}>
                <span className={styles.breakdownLabel}>{label}</span>
                <span className={styles.breakdownCount}>{count}</span>
                <div className={styles.breakdownBarWrap}>
                  <div
                    className={styles.breakdownBar}
                    style={{ width: bdTotal > 0 ? `${(count / bdTotal) * 100}%` : '0%' }}
                    role="progressbar"
                    aria-valuenow={count}
                    aria-valuemax={bdTotal}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom actions */}
        <div className={styles.bottomActions}>
          <button className={styles.historyBtn} onClick={onViewHistory}>
            <IconHistory/>
            履歴を見る
          </button>
          <button className={styles.exportBtn} disabled aria-label="PDFエクスポート（準備中）">
            <IconDownload/>
            PDF
          </button>
          <button className={styles.exportBtn} disabled aria-label="CSVエクスポート（準備中）">
            <IconDownload/>
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
