import type { WeeklyStats } from './mockData'
import styles from './WeeklyStatsCard.module.css'

interface MiniBarChartProps {
  values: number[]
}

function MiniBarChart({ values }: MiniBarChartProps) {
  const max = Math.max(...values, 0.01)
  const days = ['月', '火', '水', '木', '金', '土', '日']
  return (
    <div className={styles.chart} aria-hidden>
      {values.map((v, i) => (
        <div key={i} className={styles.chartCol}>
          <div
            className={styles.chartBar}
            style={{ height: `${Math.round((v / max) * 100)}%` }}
          />
          <span className={styles.chartLabel}>{days[i]}</span>
        </div>
      ))}
    </div>
  )
}

function diffLabel(diff: number, unit: string) {
  const sign = diff >= 0 ? '+' : ''
  return `${sign}${diff}${unit}`
}

interface WeeklyStatsCardProps {
  data: WeeklyStats
}

export function WeeklyStatsCard({ data }: WeeklyStatsCardProps) {
  const { honeyKg, honeyPrevDiffKg, workCount, workPrevDiff, honeyHistory } = data
  const honeyPositive = honeyPrevDiffKg >= 0
  const workPositive = workPrevDiff >= 0
  return (
    <div className={styles.card}>
      <p className={styles.heading}>今週の統計</p>
      <div className={styles.statRow}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>採蜜量</span>
          <span className={styles.statValue}>{honeyKg.toFixed(1)} kg</span>
          <span
            className={honeyPositive ? styles.diffUp : styles.diffDown}
          >
            {diffLabel(honeyPrevDiffKg, ' kg')}
          </span>
        </div>
        <div className={styles.statDivider} aria-hidden />
        <div className={styles.statItem}>
          <span className={styles.statLabel}>作業件数</span>
          <span className={styles.statValue}>{workCount} 件</span>
          <span
            className={workPositive ? styles.diffUp : styles.diffDown}
          >
            {diffLabel(workPrevDiff, ' 件')}
          </span>
        </div>
      </div>
      <MiniBarChart values={honeyHistory} />
      <p className={styles.caption}>採蜜量 (直近7日、kg)</p>
    </div>
  )
}
