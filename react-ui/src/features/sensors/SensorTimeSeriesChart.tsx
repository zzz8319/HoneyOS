import { useState, useRef, useId } from 'react'
import type { SensorSeriesPoint } from './sensorGraphTypes'
import styles from './SensorTimeSeriesChart.module.css'

interface Props {
  data: SensorSeriesPoint[]
  comparisonData?: SensorSeriesPoint[]
  color: string
  colorSoft: string
  compColor?: string
  unit: string
  threshold?: { min?: number; max?: number }
  periodMode: 'day' | 'week' | 'month' | 'custom'
  initialSelectedIndex?: number | null
  onSelectIndex?: (i: number | null) => void
  ariaLabel?: string
  showComparison?: boolean
}

function formatXLabel(measuredAt: string, mode: Props['periodMode']): string {
  const d = new Date(measuredAt)
  if (mode === 'day') return `${d.getHours()}時`
  const m = d.getMonth() + 1
  const day = d.getDate()
  if (mode === 'week') {
    const days = ['日', '月', '火', '水', '木', '金', '土']
    return `${m}/${day}(${days[d.getDay()]})`
  }
  return `${m}/${day}`
}

import { calcStats } from './sensorChartUtils'

const CHART_H = 200
const PAD_TOP = 16
const PAD_BTM = 32
const PAD_L = 44
const PAD_R = 12

export function SensorTimeSeriesChart({
  data,
  comparisonData,
  color,
  colorSoft,
  compColor = '#9CA3AF',
  unit,
  threshold,
  periodMode,
  initialSelectedIndex = null,
  onSelectIndex,
  ariaLabel,
  showComparison = false,
}: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(initialSelectedIndex)
  const [tooltipFlip, setTooltipFlip] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const titleId = useId()
  const descId = useId()

  // sync external selectedIndex prop into local state
  const prevInitialRef = useRef(initialSelectedIndex)
  if (prevInitialRef.current !== initialSelectedIndex) {
    prevInitialRef.current = initialSelectedIndex
    setSelectedIdx(initialSelectedIndex)
  }

  const validVals = data.map(p => p.value).filter((v): v is number => v !== null)
  const stats = calcStats(data)

  if (data.length === 0) return null

  // Y range
  const rawMin = validVals.length ? Math.min(...validVals) : 0
  const rawMax = validVals.length ? Math.max(...validVals) : 10
  const thr = threshold?.max ?? threshold?.min
  const allVals = thr !== undefined ? [...validVals, thr] : validVals
  const compVals = (comparisonData ?? []).map(p => p.value).filter((v): v is number => v !== null)
  const allCombined = [...allVals, ...compVals]
  const yMin = Math.floor((Math.min(...(allCombined.length ? allCombined : [rawMin])) - 2) / 5) * 5
  const yMax = Math.ceil((Math.max(...(allCombined.length ? allCombined : [rawMax])) + 2) / 5) * 5
  const yRange = yMax - yMin || 10

  // Compute fixed X tick positions based on period
  function getXTicks(): number[] {
    if (periodMode === 'day') return [0, 6, 12, 18, 23]
    const n = data.length
    if (n <= 7) return data.map((_, i) => i)
    const step = Math.floor(n / 6)
    const ticks: number[] = []
    for (let i = 0; i < n; i += step) ticks.push(i)
    if (ticks[ticks.length - 1] !== n - 1) ticks.push(n - 1)
    return ticks
  }
  const xTicks = getXTicks()

  const n = data.length
  const svgW = 360 // logical width (scales with viewBox)
  const plotW = svgW - PAD_L - PAD_R
  const plotH = CHART_H - PAD_TOP - PAD_BTM

  function xPct(i: number): number {
    return PAD_L + (i / Math.max(n - 1, 1)) * plotW
  }
  function yPct(v: number): number {
    return PAD_TOP + (1 - (v - yMin) / yRange) * plotH
  }

  // Build path for series
  function buildPath(pts: (SensorSeriesPoint | null)[], fallbackData: SensorSeriesPoint[]): string {
    // pts aligned to fallbackData length
    let d = ''
    let prevNull = true
    for (let i = 0; i < fallbackData.length; i++) {
      const p = pts[i] ?? null
      if (p === null || p.value === null) { prevNull = true; continue }
      const x = xPct(i)
      const y = yPct(p.value)
      if (prevNull) { d += `M${x},${y}`; prevNull = false }
      else d += `L${x},${y}`
    }
    return d
  }

  function buildArea(pts: SensorSeriesPoint[]): string {
    const segments: string[] = []
    let seg: number[] = []
    for (let i = 0; i <= pts.length; i++) {
      const p = i < pts.length ? pts[i] : null
      if (p && p.value !== null) {
        seg.push(i)
      } else {
        if (seg.length >= 2) {
          const first = seg[0]
          const last = seg[seg.length - 1]
          let d = `M${xPct(first)},${yPct(pts[first].value!)} `
          for (const j of seg) d += `L${xPct(j)},${yPct(pts[j].value!)} `
          d += `L${xPct(last)},${CHART_H - PAD_BTM} L${xPct(first)},${CHART_H - PAD_BTM} Z`
          segments.push(d)
        }
        seg = []
      }
    }
    return segments.join(' ')
  }

  // Y axis ticks
  const yTickStep = yRange <= 10 ? 1 : yRange <= 20 ? 5 : 10
  const yTicks: number[] = []
  for (let v = Math.ceil(yMin / yTickStep) * yTickStep; v <= yMax; v += yTickStep) yTicks.push(v)

  const selPt = selectedIdx !== null ? data[selectedIdx] : null

  function handleSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width * svgW
    let closest = 0
    let minDist = Infinity
    for (let i = 0; i < n; i++) {
      const dx = Math.abs(xPct(i) - relX)
      if (dx < minDist) { minDist = dx; closest = i }
    }
    const newIdx = closest === selectedIdx ? null : closest
    setSelectedIdx(newIdx)
    onSelectIndex?.(newIdx)
    // flip tooltip if near right edge
    setTooltipFlip(xPct(closest) > svgW * 0.65)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (selectedIdx === null) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const idx = e.key === 'ArrowRight' ? 0 : n - 1
        setSelectedIdx(idx); onSelectIndex?.(idx)
      }
      return
    }
    if (e.key === 'ArrowRight' && selectedIdx < n - 1) {
      setSelectedIdx(selectedIdx + 1); onSelectIndex?.(selectedIdx + 1)
    } else if (e.key === 'ArrowLeft' && selectedIdx > 0) {
      setSelectedIdx(selectedIdx - 1); onSelectIndex?.(selectedIdx - 1)
    } else if (e.key === 'Escape') {
      setSelectedIdx(null); onSelectIndex?.(null)
    }
  }

  const currentPath  = buildPath(data, data)
  const currentArea  = buildArea(data)
  const compPath     = comparisonData ? buildPath(comparisonData, data) : ''
  const compArea     = comparisonData ? buildArea(comparisonData.map((p, i) => ({ ...p, measuredAt: data[i]?.measuredAt ?? p.measuredAt }))) : ''

  const thresholdY = threshold?.max !== undefined ? yPct(threshold.max) : null
  const thresholdMinY = threshold?.min !== undefined ? yPct(threshold.min) : null

  const tooltipX = selPt && selectedIdx !== null ? xPct(selectedIdx) : 0
  const tooltipY = selPt?.value !== null && selPt?.value !== undefined && selectedIdx !== null ? yPct(selPt.value) : 0
  const TOOLTIP_W = 70
  const tooltipLeft = tooltipFlip ? tooltipX - TOOLTIP_W - 8 : tooltipX + 8

  function formatVal(v: number | null): string {
    if (v === null) return '—'
    if (unit === 'kg' || unit === '℃' || unit === '%') return v.toFixed(1)
    return String(v)
  }
  function formatTime(iso: string): string {
    const d = new Date(iso)
    if (periodMode === 'day') {
      return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
    }
    const m = d.getMonth() + 1
    const day = d.getDate()
    return `${m}/${day}`
  }

  // Hidden data table for a11y
  const tableRows = data.slice(0, 24).map((p, i) => (
    <tr key={i}>
      <td>{formatTime(p.measuredAt)}</td>
      <td>{p.value !== null ? `${formatVal(p.value)}${unit}` : '欠損'}</td>
    </tr>
  ))

  return (
    <div className={styles.wrap}>
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>最小</span>
          <span className={styles.statValue}>{stats.min !== null ? `${formatVal(stats.min)}${unit}` : '—'}</span>
        </div>
        <div className={styles.statDivider} aria-hidden />
        <div className={styles.statItem}>
          <span className={styles.statLabel}>最大</span>
          <span className={styles.statValue}>{stats.max !== null ? `${formatVal(stats.max)}${unit}` : '—'}</span>
        </div>
        <div className={styles.statDivider} aria-hidden />
        <div className={styles.statItem}>
          <span className={styles.statLabel}>平均</span>
          <span className={styles.statValue}>{stats.avg !== null ? `${formatVal(stats.avg)}${unit}` : '—'}</span>
        </div>
      </div>

      <div className={styles.chartWrap}>
        <svg
          ref={svgRef}
          className={styles.svg}
          viewBox={`0 0 ${svgW} ${CHART_H}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-labelledby={`${titleId} ${descId}`}
          tabIndex={0}
          onClick={handleSvgClick}
          onKeyDown={handleKeyDown}
          aria-label={ariaLabel ?? 'センサーグラフ'}
        >
          <title id={titleId}>{ariaLabel ?? 'センサーグラフ'}</title>
          <desc id={descId}>
            {stats.min !== null
              ? `最小${formatVal(stats.min)}${unit}、最大${formatVal(stats.max)}${unit}、平均${formatVal(stats.avg)}${unit}`
              : 'データがありません'}
          </desc>

          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colorSoft || color} stopOpacity="0.9" />
              <stop offset="100%" stopColor={colorSoft || color} stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="compAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={compColor} stopOpacity="0.10" />
              <stop offset="100%" stopColor={compColor} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Y grid lines */}
          {yTicks.map(v => (
            <line key={v} x1={PAD_L} x2={svgW - PAD_R} y1={yPct(v)} y2={yPct(v)}
              stroke="#E3E5E8" strokeWidth="0.5" />
          ))}

          {/* Y axis labels */}
          {yTicks.map(v => (
            <text key={v} x={PAD_L - 4} y={yPct(v) + 4}
              textAnchor="end" fontSize="9" fill="#66707A">{v}</text>
          ))}

          {/* X axis labels */}
          {xTicks.map((i, tickIdx) => {
            if (i >= data.length) return null
            const label = periodMode === 'day'
              ? `${new Date(data[i].measuredAt).getHours()}時`
              : formatXLabel(data[i].measuredAt, periodMode)
            const isFirst = tickIdx === 0
            const isLast = tickIdx === xTicks.length - 1
            return (
              <text key={i} x={xPct(i)} y={CHART_H - PAD_BTM + 14}
                textAnchor={isFirst ? 'start' : isLast ? 'end' : 'middle'}
                fontSize="9" fill="#66707A">{label}</text>
            )
          })}

          {/* Threshold max line */}
          {thresholdY !== null && (
            <g>
              <line x1={PAD_L} x2={svgW - PAD_R} y1={thresholdY} y2={thresholdY}
                stroke="#DC2626" strokeWidth="1" strokeDasharray="4 3" />
              <text x={PAD_L - 2} y={thresholdY - 3}
                textAnchor="end" fontSize="8" fill="#DC2626">{threshold!.max}{unit}</text>
            </g>
          )}
          {thresholdMinY !== null && (
            <g>
              <line x1={PAD_L} x2={svgW - PAD_R} y1={thresholdMinY} y2={thresholdMinY}
                stroke="#2563EB" strokeWidth="1" strokeDasharray="4 3" />
              <text x={PAD_L - 2} y={thresholdMinY - 3}
                textAnchor="end" fontSize="8" fill="#2563EB">{threshold!.min}{unit}</text>
            </g>
          )}

          {/* Comparison area + line */}
          {showComparison && compPath && (
            <>
              <path d={compArea} fill="url(#compAreaFill)" />
              <path d={compPath} fill="none" stroke={compColor} strokeWidth="1.5"
                strokeDasharray="5 3" />
            </>
          )}

          {/* Current area + line */}
          {currentArea && <path d={currentArea} fill="url(#areaFill)" />}
          {currentPath && (
            <path d={currentPath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Selected vertical line */}
          {selectedIdx !== null && selPt && (
            <line x1={xPct(selectedIdx)} x2={xPct(selectedIdx)}
              y1={PAD_TOP} y2={CHART_H - PAD_BTM}
              stroke="#DC2626" strokeWidth="1" strokeDasharray="3 2" />
          )}

          {/* Data points (dots) */}
          {data.map((p, i) => {
            if (p.value === null) return null
            const isSelected = i === selectedIdx
            const isThresholdExceeded = threshold?.max !== undefined && p.value > threshold.max
            const dotColor = isThresholdExceeded ? '#DC2626' : color
            const timeKey = new Date(p.measuredAt).toTimeString().slice(0,5).replace(':', '')
            return (
              <circle key={i}
                cx={xPct(i)} cy={yPct(p.value)}
                r={isSelected ? 5 : 2.5}
                fill={isSelected ? '#DC2626' : dotColor}
                stroke={isSelected ? '#fff' : 'none'}
                strokeWidth={isSelected ? 1.5 : 0}
                data-testid={`chart-point-${i}`}
                data-time={timeKey}
                data-value={p.value}
              />
            )
          })}

          {/* Tooltip */}
          {selectedIdx !== null && selPt && selPt.value !== null && (
            <g transform={`translate(${tooltipLeft}, ${Math.max(PAD_TOP, tooltipY - 28)})`}>
              <rect width={TOOLTIP_W} height={34} rx="5" fill="#17212B" opacity="0.9" />
              <text x={TOOLTIP_W / 2} y={13} textAnchor="middle" fontSize="9" fill="#fff">
                {formatTime(selPt.measuredAt)}
              </text>
              <text x={TOOLTIP_W / 2} y={26} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">
                {formatVal(selPt.value)}{unit}
              </text>
            </g>
          )}
        </svg>

        {/* Selected point aria-live */}
        <span role="status" aria-live="polite" className={styles.srOnly}>
          {selectedIdx !== null && selPt
            ? `${formatTime(selPt.measuredAt)} ${selPt.value !== null ? formatVal(selPt.value) + unit : '欠損'}`
            : ''}
        </span>
      </div>

      {/* Hidden accessible table */}
      <details className={styles.tableDetails}>
        <summary className={styles.tableSummary}>データ一覧（テキスト形式）</summary>
        <table className={styles.dataTable}>
          <thead><tr><th>時刻</th><th>値</th></tr></thead>
          <tbody>{tableRows}</tbody>
        </table>
      </details>
    </div>
  )
}

