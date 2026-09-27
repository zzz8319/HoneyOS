import type { RadarData } from './mockData'

// 4 axes: top=蜂量, right=育児量, bottom=貯蜜量, left=女王
const AXES = [
  { key: 'bee'   as const, label: '蜂量',  angle: -90 },  // top
  { key: 'brood' as const, label: '育児量', angle:  0  },  // right
  { key: 'honey' as const, label: '貯蜜量', angle:  90 },  // bottom
  { key: 'queen' as const, label: '女王',  angle: 180  },  // left
]
const CX = 110
const CY = 110
const MAX_R = 76
const SCALES = [25, 50, 75, 100]

function polar(angleDeg: number, r: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)]
}

interface RadarChartProps {
  data:  RadarData
  color: string
}

export function RadarChart({ data, color }: RadarChartProps) {
  // Polygon points for this series
  const pts = AXES.map(a => {
    const v = data[a.key]
    const r = (v / 100) * MAX_R
    return polar(a.angle, r)
  })
  const polygon = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const hex = color
  const fillOpacity = 0.18

  // label offsets from center
  function labelPos(angleDeg: number): [number, number] {
    const [x, y] = polar(angleDeg, MAX_R + 18)
    return [x, y]
  }

  return (
    <svg
      viewBox={`0 0 220 220`}
      width="100%"
      height="100%"
      style={{ display: 'block', maxWidth: 220, margin: '0 auto' }}
      aria-label="蜂群内訳レーダーチャート"
    >
      {/* Grid circles */}
      {SCALES.map(s => (
        <circle
          key={s}
          cx={CX} cy={CY}
          r={(s / 100) * MAX_R}
          fill="none"
          stroke="#EAECEF"
          strokeWidth={0.75}
        />
      ))}

      {/* Scale labels (innermost and outermost) */}
      {[25, 50, 75, 100].map(s => (
        <text key={`sl-${s}`} x={CX + 3} y={CY - (s / 100) * MAX_R + 4}
          fontSize={7} fill="#9BA3AB">{s}</text>
      ))}

      {/* Axis lines */}
      {AXES.map(a => {
        const [x, y] = polar(a.angle, MAX_R)
        return (
          <line key={a.key}
            x1={CX} y1={CY} x2={x.toFixed(1)} y2={y.toFixed(1)}
            stroke="#EAECEF" strokeWidth={0.75} />
        )
      })}

      {/* Data polygon */}
      <polygon
        points={polygon}
        fill={hex}
        fillOpacity={fillOpacity}
        stroke={hex}
        strokeWidth={2}
      />

      {/* Data point dots */}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={4}
          fill={hex} stroke="#fff" strokeWidth={1.5} />
      ))}

      {/* Axis labels */}
      {AXES.map(a => {
        const [lx, ly] = labelPos(a.angle)
        return (
          <text
            key={`lbl-${a.key}`}
            x={lx.toFixed(1)}
            y={ly.toFixed(1)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fontWeight="500"
            fill="#17212B"
          >
            {a.label}
          </text>
        )
      })}
    </svg>
  )
}
