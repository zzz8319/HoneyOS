import { CheckCircle2, XCircle } from 'lucide-react'
import type { WeatherData } from './mockData'
import styles from './WeatherCard.module.css'

const X_LABELS = ['0時', '6時', '12時', '18時', '24時']
const X_IDXS   = [0, 6, 12, 18, 24]

interface SparklineProps {
  values: number[]
}

function Sparkline({ values }: SparklineProps) {
  if (values.length < 2) return null
  const W = 260
  const H = 52
  const PAD_T = 6
  const PAD_B = 4
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const toY = (v: number) =>
    PAD_T + ((max - v) / range) * (H - PAD_T - PAD_B)
  const toX = (i: number) => (i / (values.length - 1)) * W

  const pts = values.map((v, i) => [toX(i), toY(v)] as [number, number])
  const linePath = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const fillPath = linePath + ` L${W},${H} L0,${H} Z`

  const yLabels = [
    Math.round(max / 5) * 5,
    Math.round((max + min) / 2 / 5) * 5,
    Math.round(min / 5) * 5,
  ]

  return (
    <div className={styles.sparkRoot}>
      {/* Y軸 */}
      <div className={styles.yAxis} aria-hidden>
        {yLabels.map(v => (
          <span key={v} className={styles.yLabel}>{v}</span>
        ))}
      </div>

      <div className={styles.sparkBody}>
        <p className={styles.sparkTitle}>過去24時間の気温（℃）</p>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className={styles.sparkSvg}
          aria-hidden
        >
          <defs>
            <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={fillPath} fill="url(#sparkFill)" />
          <path
            d={linePath}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* 折れ線上のドット */}
          {X_IDXS.map(idx => (
            <circle
              key={idx}
              cx={toX(idx).toFixed(1)}
              cy={toY(values[idx]).toFixed(1)}
              r="3"
              fill="var(--color-primary)"
            />
          ))}
        </svg>

        {/* X軸ラベル */}
        <div className={styles.xAxis} aria-hidden>
          {X_IDXS.map((idx, i) => (
            <span
              key={idx}
              className={styles.xLabel}
              style={{ left: `${(idx / (values.length - 1)) * 100}%` }}
            >
              {X_LABELS[i]}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

interface WeatherCardProps {
  data: WeatherData
}

export function WeatherCard({ data }: WeatherCardProps) {
  const { tempC, humidity, windMs, tempHistory, inspectable, inspectReason, fetchedAt } = data
  return (
    <div className={styles.card}>
      {/* ヘッダー行 */}
      <div className={styles.header}>
        <span className={styles.cardTitle}>内検コンディション</span>
        <span className={styles.fetchTime}>今日 {fetchedAt} 時点</span>
      </div>

      {/* 気温 + メタ情報 */}
      <div className={styles.tempRow}>
        <div className={styles.tempBlock}>
          <span className={styles.weatherEmoji} aria-hidden>☀️</span>
          <span className={styles.tempVal}>{tempC.toFixed(1)}</span>
          <span className={styles.tempUnit}>°C</span>
        </div>
        <div className={styles.metaBlock}>
          <div className={styles.metaItem}>
            <span className={styles.metaEmoji} aria-hidden>💧</span>
            <span className={styles.metaKey}>湿度</span>
            <span className={styles.metaVal}>{humidity}%</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaEmoji} aria-hidden>💨</span>
            <span className={styles.metaKey}>風速</span>
            <span className={styles.metaVal}>{windMs.toFixed(1)} m/s</span>
          </div>
        </div>

        {/* 内検可否バッジ（カタログ：グラフ右上に重なる位置） */}
        <div
          className={inspectable ? styles.inspOk : styles.inspNg}
          role="status"
        >
          {inspectable
            ? <><CheckCircle2 size={13} aria-hidden /> 内検に適しています</>
            : <><XCircle size={13} aria-hidden /> {inspectReason ?? '内検不可'}</>
          }
        </div>
      </div>

      {/* スパークライン */}
      <Sparkline values={tempHistory} />
    </div>
  )
}
