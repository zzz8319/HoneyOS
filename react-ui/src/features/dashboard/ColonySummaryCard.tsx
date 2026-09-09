import type { ColonySummary } from './mockData'
import styles from './ColonySummaryCard.module.css'

const WARN_LINE = 60

interface BarProps {
  score: number
  status: 'good' | 'warn' | 'danger'
  name: string
}

function ScoreBar({ score, status, name }: BarProps) {
  const cls =
    status === 'good' ? styles.barGood
    : status === 'warn' ? styles.barWarn
    : styles.barDanger
  return (
    <div className={styles.barRow} aria-label={`${name} スコア${score}`}>
      <span className={styles.barName}>{name}</span>
      <div className={styles.barTrack}>
        <div className={cls} style={{ width: `${score}%` }} />
        <div className={styles.warnLine} style={{ left: `${WARN_LINE}%` }} aria-hidden />
      </div>
      <span className={styles.barScore} style={{ color: `var(--color-${status === 'good' ? 'ok' : status})` }}>
        {score}
      </span>
    </div>
  )
}

interface ColonySummaryCardProps {
  data: ColonySummary
}

export function ColonySummaryCard({ data }: ColonySummaryCardProps) {
  const { total, good, warn, danger, colonies } = data
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>蜂群サマリー</span>
        <span className={styles.beta}>β</span>
        <span className={styles.total}>{total}群</span>
      </div>

      <div className={styles.counts}>
        <div className={styles.countItem}>
          <span className={styles.countDot} data-status="good" aria-hidden />
          <span className={styles.countLabel}>良好</span>
          <span className={styles.countNum} style={{ color: 'var(--color-ok)' }}>{good}</span>
        </div>
        <div className={styles.countItem}>
          <span className={styles.countDot} data-status="warn" aria-hidden />
          <span className={styles.countLabel}>注意</span>
          <span className={styles.countNum} style={{ color: 'var(--color-warn)' }}>{warn}</span>
        </div>
        <div className={styles.countItem}>
          <span className={styles.countDot} data-status="danger" aria-hidden />
          <span className={styles.countLabel}>危険</span>
          <span className={styles.countNum} style={{ color: 'var(--color-danger)' }}>{danger}</span>
        </div>
      </div>

      <div className={styles.bars} role="list" aria-label="蜂群スコア一覧">
        {colonies.map(c => (
          <ScoreBar key={c.id} score={c.score} status={c.status} name={c.name} />
        ))}
      </div>
      <p className={styles.note}>
        スコアは合成指標です（β版）。注意ライン: {WARN_LINE}
      </p>
    </div>
  )
}
