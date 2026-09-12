import type { InspectionPoint } from './mockData'
import styles from './CompositionTrendChart.module.css'

interface Props {
  inspections: InspectionPoint[]
  onPointClick?: (insp: InspectionPoint) => void
  activeId?: string | null
}

const LINES = [
  { key: 'bee'   as keyof InspectionPoint, color: '#16A34A' },
  { key: 'brood' as keyof InspectionPoint, color: '#EAB308' },
  { key: 'honey' as keyof InspectionPoint, color: '#E39A16' },
]

const W = 300
const H = 96
const PAD = { top: 6, right: 8, bottom: 20, left: 22 }
const GW = W - PAD.left - PAD.right
const GH = H - PAD.top - PAD.bottom

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

export function CompositionTrendChart({ inspections, onPointClick, activeId }: Props) {
  const n = inspections.length
  if (n === 0) return null

  return (
    <div className={styles.wrap}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} aria-hidden>
        {/* Y-axis grid: 0 / 50 / 100 */}
        {[0, 50, 100].map(v => (
          <g key={v}>
            <line
              x1={PAD.left} y1={yPos(v)} x2={PAD.left + GW} y2={yPos(v)}
              stroke="var(--color-border)" strokeWidth={0.8}
            />
            <text x={PAD.left - 4} y={yPos(v) + 3.5} textAnchor="end"
              fontSize={8.5} fill="var(--color-text-secondary)">{v}</text>
          </g>
        ))}

        {/* Lines */}
        {LINES.map(({ key, color }) => {
          const pts = inspections.map((p, i) => `${xPos(i, n)},${yPos(p[key] as number)}`).join(' ')
          return (
            <polyline key={key} points={pts} fill="none" stroke={color}
              strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          )
        })}

        {/* Data points + X-axis labels */}
        {inspections.map((insp, i) => (
          <g key={insp.id}>
            <text x={xPos(i, n)} y={H - 4} textAnchor="middle"
              fontSize={8.5} fill="var(--color-text-secondary)">{shortDate(insp.date)}</text>
            {LINES.map(({ key, color }) => {
              const isActive = activeId === insp.id
              return (
                <circle
                  key={key}
                  cx={xPos(i, n)} cy={yPos(insp[key] as number)}
                  r={isActive ? 5 : 3}
                  fill={color} stroke="white" strokeWidth={isActive ? 2 : 1.5}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onPointClick?.(insp)}
                />
              )
            })}
          </g>
        ))}
      </svg>
    </div>
  )
}
