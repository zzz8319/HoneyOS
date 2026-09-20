import { useState } from 'react'
import type { TrendPoint, ColonySeries } from './mockData'
import styles from './TrendLineChart.module.css'

// ── SVG coordinate space ───────────────────────────────────────────────────
const W = 340
const H = 200
const ML = 36  // left margin (Y labels)
const MR = 12  // right
const MT = 16  // top
const MB = 32  // bottom (X labels)
const PW = W - ML - MR  // plot width  = 292
const PH = H - MT - MB  // plot height = 152

function yAt(v: number): number {
  return MT + PH - (v / 100) * PH
}

function xAt(date: string, minMs: number, maxMs: number): number {
  const t = new Date(date).getTime()
  return ML + ((t - minMs) / (maxMs - minMs)) * PW
}

// ── Month label positions ─────────────────────────────────────────────────
function monthLabels(minMs: number, maxMs: number): { label: string; x: number }[] {
  const labels: { label: string; x: number }[] = []
  const end = new Date(maxMs)
  // Start at the first day of the month that contains minMs (may be before minMs)
  const d = new Date(minMs)
  let cur = new Date(d.getFullYear(), d.getMonth(), 1)
  while (cur <= end) {
    const ms = cur.getTime()
    // Position the label at max(month start, domain start) so partial months
    // still show at the left edge rather than being clipped
    const posMs = Math.max(ms, minMs)
    labels.push({
      label: `${cur.getMonth() + 1}月`,
      x: xAt(new Date(posMs).toISOString().slice(0, 10), minMs, maxMs),
    })
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
  }
  return labels
}

// ── Polyline from points ──────────────────────────────────────────────────
function toPath(pts: TrendPoint[], minMs: number, maxMs: number): string {
  return pts
    .map((p, i) => {
      const x = xAt(p.date, minMs, maxMs)
      const y = yAt(p.value)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

// ── Props ─────────────────────────────────────────────────────────────────
export interface SelectedPoint {
  seriesName: string
  seriesColor: string
  date: string
  metricLabel: string
  value: number
  svgX: number
  svgY: number
}

interface TrendLineChartProps {
  series:    ColonySeries[]
  prevSeries?: ColonySeries[]  // for year-compare mode
  metric:    keyof ColonySeries['points']
  metricLabel: string
  metricShortLabel: string
  alertThreshold: number
  minDate: string
  maxDate: string
}

export function TrendLineChart({
  series, prevSeries, metric, metricLabel, metricShortLabel, alertThreshold, minDate, maxDate,
}: TrendLineChartProps) {
  const [selected, setSelected] = useState<SelectedPoint | null>(null)
  const minMs = new Date(minDate).getTime()
  const maxMs = new Date(maxDate).getTime()
  const mLabels = monthLabels(minMs, maxMs)
  const alertY  = yAt(alertThreshold)

  function handlePoint(s: ColonySeries, p: TrendPoint, prev = false) {
    const sx = xAt(p.date, minMs, maxMs)
    const sy = yAt(p.value)
    const d  = new Date(p.date)
    setSelected({
      seriesName:  prev ? `${s.name}（前年）` : s.name,
      seriesColor: prev ? `${s.color}88` : s.color,
      date:        `${d.getMonth() + 1}/${d.getDate()}`,
      metricLabel,
      value:       p.value,
      svgX:        sx,
      svgY:        sy,
    })
  }

  function dismiss(e: React.MouseEvent) {
    if ((e.target as SVGElement).tagName !== 'circle') setSelected(null)
  }

  // Tooltip placement: keep within [ML, W-MR-110]
  function tipX(sx: number): number {
    return Math.min(Math.max(sx - 55, ML), W - MR - 110)
  }
  function tipY(sy: number): number {
    return sy > MT + 60 ? sy - 72 : sy + 12
  }

  const renderSeries = (s: ColonySeries, prev: boolean) => {
    const pts = prev
      ? (s.prevYearPoints ?? s.points)[metric] ?? []
      : s.points[metric] ?? []
    if (!pts.length) return null
    const color  = prev ? `${s.color}88` : s.color
    const dash   = prev ? '5,3' : undefined
    const radius = prev ? 3 : 4
    return (
      <g key={`${s.colonyId}-${prev ? 'prev' : 'cur'}`}>
        <path
          d={toPath(pts, minMs, maxMs)}
          fill="none"
          stroke={color}
          strokeWidth={prev ? 1.5 : 2}
          strokeDasharray={dash}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {pts.map((p) => {
          const cx = xAt(p.date, minMs, maxMs)
          const cy = yAt(p.value)
          const isSel = selected?.svgX === cx && selected?.svgY === cy
          return (
            <circle
              key={`${p.date}-${prev}`}
              cx={cx}
              cy={cy}
              r={isSel ? radius + 2 : radius}
              fill={color}
              stroke="#fff"
              strokeWidth={1.5}
              style={{ cursor: 'pointer' }}
              role="button"
              aria-label={`${prev ? s.name + '（前年）' : s.name} ${p.date} ${metricLabel} ${p.value}`}
              tabIndex={0}
              onClick={() => handlePoint(s, p, prev)}
              onKeyDown={(e) => { if (e.key === 'Enter') handlePoint(s, p, prev) }}
            />
          )
        })}
      </g>
    )
  }

  return (
    <div className={styles.wrap} onClick={dismiss} role="presentation">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        style={{ display: 'block', overflow: 'visible' }}
        aria-label={`${metricLabel}の推移グラフ`}
      >
        {/* Y grid lines + labels */}
        {[0, 20, 40, 60, 80, 100].map(v => {
          const y = yAt(v)
          return (
            <g key={v}>
              <line x1={ML} x2={ML + PW} y1={y} y2={y}
                stroke={v === 0 ? '#C8CACF' : '#EAECEF'} strokeWidth={v === 0 ? 1 : 0.75} />
              <text x={ML - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#66707A">
                {v}
              </text>
            </g>
          )
        })}

        {/* Alert threshold dashed line */}
        <line
          x1={ML} x2={ML + PW} y1={alertY} y2={alertY}
          stroke="#EF4444" strokeWidth={1.5} strokeDasharray="5,3"
        />

        {/* X axis month labels */}
        {mLabels.map(({ label, x }, i) => (
          <text key={`${i}-${label}`} x={x} y={H - 6} textAnchor="middle" fontSize={10} fill="#66707A">
            {label}
          </text>
        ))}

        {/* Selected vertical guide */}
        {selected && (
          <line
            x1={selected.svgX} x2={selected.svgX}
            y1={MT} y2={MT + PH}
            stroke="#17212B" strokeWidth={1} strokeDasharray="3,3" opacity={0.5}
          />
        )}

        {/* Series lines + points */}
        {series.map(s => renderSeries(s, false))}
        {prevSeries && prevSeries.map(s => renderSeries(s, true))}

        {/* Tooltip */}
        {selected && (
          <g transform={`translate(${tipX(selected.svgX)},${tipY(selected.svgY)})`}>
            <rect rx={6} ry={6} width={110} height={58} fill="white"
              stroke="#E3E5E8" strokeWidth={1}
              filter="drop-shadow(0 2px 6px rgba(0,0,0,.12))" />
            <circle cx={14} cy={14} r={4} fill={selected.seriesColor} />
            <text x={22} y={18} fontSize={10} fontWeight="600" fill="#17212B">
              {selected.seriesName}
            </text>
            <text x={8} y={33} fontSize={10} fill="#66707A">
              {selected.date}
            </text>
            <text x={8} y={47} fontSize={10} fill="#66707A">
              {metricShortLabel}
            </text>
            <text x={80} y={47} fontSize={12} fontWeight="700" fill="#17212B" textAnchor="end">
              {selected.value}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
