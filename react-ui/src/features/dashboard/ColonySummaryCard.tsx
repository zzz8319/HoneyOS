import type { ColonySummary, ColonySummaryItem } from './mockData'
import styles from './ColonySummaryCard.module.css'

const WARN_LINE = 60

interface BarProps {
  item: ColonySummaryItem
}

function ScoreBar({ item }: BarProps) {
  const { score, status, name, delta } = item
  const barCls =
    status === 'good' ? styles.barGood
    : status === 'warn' ? styles.barWarn
    : styles.barDanger
  const deltaPositive = delta >= 0
  const sign = delta > 0 ? '+' : ''

  return (
    <div className={styles.barCol} aria-label={`${name} スコア${score} 前回比${sign}${delta}`}>
      <div className={styles.barTrackWrap}>
        <div className={styles.barTrack}>
          <div className={barCls} style={{ height: `${score}%` }} />
          <div
            className={styles.warnLine}
            style={{ bottom: `${WARN_LINE}%` }}
            aria-hidden
          />
        </div>
      </div>
      <span className={styles.barName}>{name}</span>
      <span className={deltaPositive ? styles.deltaUp : styles.deltaDown}>
        {sign}{delta}
      </span>
    </div>
  )
}

interface ColonySummaryCardProps {
  data: ColonySummary
  onMethodClick?: () => void
}

export function ColonySummaryCard({ data, onMethodClick }: ColonySummaryCardProps) {
  const { total, average, good, warn, danger, colonies } = data
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>蜂群の強さ</span>
        <span className={styles.beta}>簡易指標 β</span>
        <button className={styles.methodLink} onClick={onMethodClick}>
          算出方法 ›
        </button>
      </div>

      <div className={styles.avgRow}>
        <span className={styles.avgLabel}>平均</span>
        <span className={styles.avgValue}>{average}</span>
        <div className={styles.countPills}>
          <span className={styles.countItem}>
            <span className={styles.dot} data-status="good" aria-hidden />
            良好 {good}
          </span>
          <span className={styles.countItem}>
            <span className={styles.dot} data-status="warn" aria-hidden />
            注意 {warn}
          </span>
          <span className={styles.countItem}>
            <span className={styles.dot} data-status="danger" aria-hidden />
            危険 {danger}
          </span>
        </div>
      </div>

      {/* 縦バーチャート */}
      <div
        className={styles.barsWrap}
        role="list"
        aria-label={`蜂群スコア一覧（全${total}群）`}
      >
        {colonies.map(c => (
          <ScoreBar key={c.id} item={c} />
        ))}
      </div>

      <p className={styles.note}>
        注意ライン {WARN_LINE} ／ スコアは合成指標です（β版）
      </p>
    </div>
  )
}
