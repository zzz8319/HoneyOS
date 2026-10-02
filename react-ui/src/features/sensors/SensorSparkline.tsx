import type { SensorHistoryPoint } from './sensorTypes'

interface Props {
  data: SensorHistoryPoint[]
  color: string
  bgColor: string
  ariaLabel: string
  width?: number
  height?: number
}

export function SensorSparkline({ data, color, bgColor, ariaLabel, width = 72, height = 32 }: Props) {
  if (data.length === 0) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
        <rect width={width} height={height} rx={4} fill={bgColor} />
      </svg>
    )
  }

  const values = data.map(d => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const pad = 4
  const pw = width - pad * 2
  const ph = height - pad * 2

  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1 || 1)) * pw
    const y = pad + (1 - (v - min) / range) * ph
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const d = `M ${pts.join(' L ')}`

  const areaBottom = height - pad
  const areaD = `M ${pts[0]} L ${pts.join(' L ')} L ${(pad + pw).toFixed(1)},${areaBottom} L ${pad},${areaBottom} Z`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-label={ariaLabel}
      role="img"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <rect width={width} height={height} rx={4} fill={bgColor} />
      <path d={areaD} fill={color} fillOpacity={0.18} />
      <path d={d} stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Mark last point */}
      {pts.length > 0 && (() => {
        const last = pts[pts.length - 1].split(',')
        return <circle cx={last[0]} cy={last[1]} r={2.5} fill={color} />
      })()}
    </svg>
  )
}
