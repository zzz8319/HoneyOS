import type { InspectionPoint } from './mockData'
import styles from './CompositionTrendChart.module.css'

interface Props {
  inspections: InspectionPoint[]
  onPointClick?: (insp: InspectionPoint) => void
  activeId?: string | null
}

const LINES = [
  { key: 'bee'   as keyof InspectionPoint, label: '蜂',   color: '#16A34A' },
  { key: 'brood' as keyof InspectionPoint, label: '育児', color: '#EAB308' },
  { key: 'honey' as keyof InspectionPoint, label: '貯蜜', color: '#E39A16' },
]

const W = 300
const H = 140
const PAD = { top: 10, right: 10, bottom: 32, left: 28 }
const GW = W - PAD.left - PAD.right
const GH = H - PAD.top - PAD.bottom

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

export function CompositionTrendChart({ inspections, onPointClick, activeId }: Props) {
  const n = inspections.length
  if (n === 0) return null

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

        {/* Lines */}
        {LINES.map(({ key, color }) => {
          const pts = inspections.map((p, i) => `${x(i, n)},${y(p[key] as number)}`).join(' ')
          return <polyline key={key} points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
        })}

        {/* Data points + X labels */}
        {inspections.map((insp, i) => (
          <g key={insp.id}>
            <text x={x(i, n)} y={H - 4} textAnchor="middle"
              fontSize={9} fill="var(--color-text-secondary)">{shortDate(insp.date)}</text>
            {LINES.map(({ key, color }) => (
              <circle
                key={key}
                cx={x(i, n)} cy={y(insp[key] as number)} r={activeId === insp.id ? 5 : 3.5}
                fill={color} stroke="white" strokeWidth={1.5}
                style={{ cursor: 'pointer' }}
                onClick={() => onPointClick?.(insp)}
              />
            ))}
          </g>
        ))}
      </svg>
    </div>
  )
}
