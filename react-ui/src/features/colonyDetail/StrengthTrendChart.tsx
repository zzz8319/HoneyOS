import type { InspectionPoint } from './mockData'
import styles from './StrengthTrendChart.module.css'

interface Props {
  inspections: InspectionPoint[]
}

const W = 300
const H = 120
const PAD = { top: 10, right: 10, bottom: 32, left: 28 }
const GW = W - PAD.left - PAD.right
const GH = H - PAD.top - PAD.bottom
const WARN_LINE = 60

function x(i: number, total: number) {
  return PAD.left + (total === 1 ? GW / 2 : (i / (total - 1)) * GW)
}
function y(v: number) {
  return PAD.top + GH - (v / 100) * GH
}

function shortDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function StrengthTrendChart({ inspections }: Props) {
  const n = inspections.length
  if (n === 0) return null

  const pts = inspections.map((p, i) => `${x(i, n)},${y(p.strengthScore)}`).join(' ')
  const warnY = y(WARN_LINE)

  return (
    <div className={styles.wrap}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} aria-hidden>
        {/* Y-axis grid lines */}
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            <line
              x1={PAD.left} y1={y(v)} x2={PAD.left + GW} y2={y(v)}
              stroke="var(--color-border)" strokeWidth={0.8}
            />
            <text x={PAD.left - 4} y={y(v) + 4} textAnchor="end"
              fontSize={9} fill="var(--color-text-secondary)">{v}</text>
          </g>
        ))}

        {/* Warning line */}
        <line
          x1={PAD.left} y1={warnY} x2={PAD.left + GW} y2={warnY}
          stroke="#DC2626" strokeWidth={1.2} strokeDasharray="4 3"
        />
        <text x={PAD.left + GW} y={warnY - 3} textAnchor="end"
          fontSize={8} fill="#DC2626">要注意ライン（60）</text>

        {/* Score line */}
        <polyline points={pts} fill="none" stroke="var(--color-primary)"
          strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {/* Points + X labels */}
        {inspections.map((insp, i) => (
          <g key={insp.id}>
            <text x={x(i, n)} y={H - 4} textAnchor="middle"
              fontSize={9} fill="var(--color-text-secondary)">{shortDate(insp.date)}</text>
            <circle
              cx={x(i, n)} cy={y(insp.strengthScore)} r={3.5}
              fill="var(--color-primary)" stroke="white" strokeWidth={1.5}
            />
          </g>
        ))}
      </svg>
    </div>
  )
}
