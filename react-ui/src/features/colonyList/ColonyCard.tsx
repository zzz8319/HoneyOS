import { StatusBadge } from '../../components'
import type { ColonyListItem } from './mockData'
import { CompositionBar } from './CompositionBar'
import styles from './ColonyCard.module.css'

interface ColonyCardProps {
  colony: ColonyListItem
  onClick?: (colonyId: string) => void
}

export function ColonyCard({ colony, onClick }: ColonyCardProps) {
  const { id, name, status, score, delta, lastInspectedAt, composition } = colony
  const deltaUp = delta >= 0

  const lastDate = new Date(lastInspectedAt)
  const dateLabel = `${lastDate.getMonth() + 1}/${lastDate.getDate()}`

  return (
    <button
      className={styles.card}
      onClick={() => onClick?.(id)}
      aria-label={`${name} 状態: ${status === 'good' ? '良好' : status === 'warn' ? '注意' : '危険'} スコア${score}`}
    >
      {/* ヘッダー行 */}
      <div className={styles.header}>
        <span className={styles.name}>{name}</span>
        <StatusBadge status={status} />
        <span className={`${styles.delta} ${deltaUp ? styles.deltaUp : styles.deltaDown}`}>
          {deltaUp ? '↑' : '↓'} {Math.abs(delta)}
        </span>
      </div>

      {/* スコア + 最終内検日 */}
      <div className={styles.meta}>
        <span className={styles.scoreWrap}>
          <span className={styles.scoreLabel}>簡易指標β</span>
          <span className={styles.scoreVal}>{score}</span>
        </span>
        <span className={styles.inspDate}>最終内検 {dateLabel}</span>
      </div>

      {/* 構成バー */}
      <CompositionBar composition={composition} />
    </button>
  )
}
