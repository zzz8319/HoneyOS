import type { WeatherData } from './mockData'
import styles from './WeatherCard.module.css'

interface SparklineProps {
  values: number[]
  width?: number
  height?: number
}

function Sparkline({ values, width = 80, height = 28 }: SparklineProps) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      className={styles.sparkline}
    >
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface WeatherCardProps {
  data: WeatherData
}

export function WeatherCard({ data }: WeatherCardProps) {
  const { tempC, humidity, windMs, tempHistory, inspectable, inspectReason } = data
  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <div className={styles.tempBlock}>
          <span className={styles.tempValue}>{tempC.toFixed(1)}</span>
          <span className={styles.tempUnit}>°C</span>
          <Sparkline values={tempHistory} />
        </div>
        <div className={styles.metaBlock}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>湿度</span>
            <span className={styles.metaValue}>{humidity}%</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>風速</span>
            <span className={styles.metaValue}>{windMs.toFixed(1)} m/s</span>
          </div>
        </div>
        <div className={styles.inspBlock}>
          <span
            className={inspectable ? styles.inspOk : styles.inspNg}
            aria-label={inspectable ? '内検可' : `内検不可: ${inspectReason ?? ''}`}
          >
            {inspectable ? '内検◎' : '内検✕'}
          </span>
          {!inspectable && inspectReason && (
            <span className={styles.inspReason}>{inspectReason}</span>
          )}
        </div>
      </div>
      <p className={styles.caption}>過去24時間の気温推移</p>
    </div>
  )
}
