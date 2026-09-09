import type { WeeklyStats } from './mockData'
import styles from './WeeklyStatsCard.module.css'

interface MiniBarChartProps {
  data: { label: string; kg: number }[]
}

function MiniBarChart({ data }: MiniBarChartProps) {
  const max = Math.max(...data.map(d => d.kg), 0.01)
  return (
    <div className={styles.chart} aria-hidden>
      {data.map(({ label, kg }) => (
        <div key={label} className={styles.chartCol}>
          <div
            className={styles.chartBar}
            style={{ height: `${Math.round((kg / max) * 100)}%` }}
          />
          <span className={styles.chartLabel}>{label}</span>
        </div>
      ))}
    </div>
  )
}

interface WeeklyStatsCardProps {
  data: WeeklyStats
}

export function WeeklyStatsCard({ data }: WeeklyStatsCardProps) {
  const { period, honeyKg, honeyPrevPct, workCount, workPrevDiff, honeyHistory } = data
  const honeyUp = honeyPrevPct >= 0
  const workUp = workPrevDiff >= 0
  return (
    <div className={styles.card}>
      <p className={styles.heading}>
        今週{' '}
        <span className={styles.period}>{period}</span>
      </p>
      <div className={styles.body}>
        <div className={styles.statBlock}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>採蜜</span>
            <div className={styles.statRow}>
              <span className={styles.statValue}>{honeyKg.toFixed(1)}</span>
              <span className={styles.statUnit}>kg</span>
              <span className={honeyUp ? styles.diffUp : styles.diffDown}>
                {honeyUp ? '↑' : '↓'} {Math.abs(honeyPrevPct)}%
              </span>
            </div>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>作業</span>
            <div className={styles.statRow}>
              <span className={styles.statValue}>{workCount}</span>
              <span className={styles.statUnit}>件</span>
              {workPrevDiff !== 0 && (
                <span className={workUp ? styles.diffUp : styles.diffDown}>
                  {workUp ? '+' : ''}{workPrevDiff}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.chartBlock}>
          <p className={styles.chartTitle}>直近4週間の採蜜量（kg）</p>
          <MiniBarChart data={honeyHistory} />
        </div>
      </div>
    </div>
  )
}
