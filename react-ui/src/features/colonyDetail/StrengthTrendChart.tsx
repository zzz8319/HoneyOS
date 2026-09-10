import type { StrengthPoint } from './mockData'
import styles from './StrengthTrendChart.module.css'

interface Props {
  history: StrengthPoint[]
}

const W = 300
const H = 130
const PAD = { top: 18, right: 12, bottom: 28, left: 26 }
const GW = W - PAD.left - PAD.right
const GH = H - PAD.top - PAD.bottom
const WARN_LINE = 60

function xPos(i: number, total: number) {
  return PAD.left + (total === 1 ? GW / 2 : (i / (total - 1)) * GW)
}
function yPos(v: number) {
  return PAD.top + GH - (v / 100) * GH
}

function shortDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function StrengthTrendChart({ history }: Props) {
  const n = history.length
  if (n === 0) return null

  const pts = history.map((p, i) => `${xPos(i, n)},${yPos(p.score)}`).join(' ')
  const warnY = yPos(WARN_LINE)

  return (
    <div className={styles.wrap}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} aria-hidden>
        {/* Y-axis grid: 0 / 60 / 100 */}
        {[0, 60, 100].map(v => (
          <g key={v}>
            <line
              x1={PAD.left} y1={yPos(v)} x2={PAD.left + GW} y2={yPos(v)}
              stroke="var(--color-border)" strokeWidth={0.8}
            />
            <text x={PAD.left - 4} y={yPos(v) + 4} textAnchor="end"
              fontSize={9} fill="var(--color-text-secondary)">{v}</text>
          </g>
        ))}

        {/* Warning line */}
        <line
          x1={PAD.left} y1={warnY} x2={PAD.left + GW} y2={warnY}
          stroke="#DC2626" strokeWidth={1.3} strokeDasharray="4 3"
        />
        {/* Warning label: right side, above the line */}
        <text x={PAD.left + GW} y={warnY - 4} textAnchor="end"
          fontSize={8} fill="#DC2626" fontWeight="600">要注意ライン（60）</text>

        {/* Score line */}
        <polyline points={pts} fill="none" stroke="var(--color-primary)"
          strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {/* Points + X-axis labels */}
        {history.map((pt, i) => (
          <g key={pt.date}>
            <text x={xPos(i, n)} y={H - 4} textAnchor="middle"
              fontSize={9} fill="var(--color-text-secondary)">{shortDate(pt.date)}</text>
            <circle
              cx={xPos(i, n)} cy={yPos(pt.score)} r={3.5}
              fill="var(--color-primary)" stroke="white" strokeWidth={1.5}
            />
          </g>
        ))}
      </svg>
    </div>
  )
}
