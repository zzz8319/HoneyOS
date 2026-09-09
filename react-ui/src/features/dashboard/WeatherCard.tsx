import type { WeatherData } from './mockData'
import styles from './WeatherCard.module.css'

const TIME_LABELS = ['0時', '6時', '12時', '18時', '24時']

interface SparklineProps {
  values: number[]
}

function Sparkline({ values }: SparklineProps) {
  if (values.length < 2) return null
  const W = 200
  const H = 48
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W
    const y = H - 8 - ((v - min) / range) * (H - 16)
    return [x, y] as [number, number]
  })

  const pathD = pts
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ')

  // 塗りつぶし用パス
  const fillD =
    pathD +
    ` L${W},${H} L0,${H} Z`

  // ラベル位置（0, 6, 12, 18, 24h）= インデックス 0, 6, 12, 18, 24
  const labelIdxs = [0, 6, 12, 18, 24]

  return (
    <div className={styles.sparkWrap}>
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden
        className={styles.sparkSvg}
      >
        <path d={fillD} fill="var(--color-primary)" fillOpacity="0.12" />
        <path
          d={pathD}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className={styles.sparkLabels} aria-hidden>
        {labelIdxs.map((idx, i) => (
          <span
            key={idx}
            className={styles.sparkLabel}
            style={{ left: `${(idx / (values.length - 1)) * 100}%` }}
          >
            {TIME_LABELS[i]}
          </span>
        ))}
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
      <div className={styles.header}>
        <span className={styles.title}>内検コンディション</span>
        <span className={styles.fetchTime}>今日 {fetchedAt} 時点</span>
      </div>

      <div className={styles.row}>
        <div className={styles.tempBlock}>
          <span className={styles.weatherIcon} aria-hidden>
            {inspectable ? '☀️' : '🌧️'}
          </span>
          <span className={styles.tempValue}>{tempC.toFixed(1)}</span>
          <span className={styles.tempUnit}>°C</span>
        </div>

        <div className={styles.metaBlock}>
          <div className={styles.metaItem}>
            <span className={styles.metaIcon} aria-hidden>💧</span>
            <span className={styles.metaLabel}>湿度</span>
            <span className={styles.metaValue}>{humidity}%</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaIcon} aria-hidden>💨</span>
            <span className={styles.metaLabel}>風速</span>
            <span className={styles.metaValue}>{windMs.toFixed(1)} m/s</span>
          </div>
        </div>
      </div>

      <Sparkline values={tempHistory} />

      <div className={styles.inspBadgeWrap}>
        <span
          className={inspectable ? styles.inspOk : styles.inspNg}
          role="status"
          aria-label={inspectable ? '内検に適しています' : `内検不可: ${inspectReason ?? ''}`}
        >
          {inspectable ? '✓ 内検に適しています' : `✕ ${inspectReason ?? '内検不可'}`}
        </span>
      </div>
    </div>
  )
}
