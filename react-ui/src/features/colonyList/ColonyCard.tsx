import { ChevronRight } from 'lucide-react'
import type { ColonyListItem, CompositionDelta } from './mockData'
import { CompositionBar } from './CompositionBar'
import { COMP_SEGMENTS } from './compositionConfig'
import styles from './ColonyCard.module.css'

interface ColonyCardProps {
  colony: ColonyListItem
  onClick?: (colonyId: string) => void
}

function relativeDate(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (diff === 0) return '今日'
  if (diff === 1) return '昨日'
  return `${diff}日前`
}

function shortDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

// デルタ絶対値上位2件を「注目項目」として返す
function topDeltas(delta: CompositionDelta): { label: string; value: number }[] {
  return COMP_SEGMENTS
    .map(({ key, label }) => ({ label, value: delta[key] }))
    .filter(x => x.value !== 0)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 2)
}

const STATUS_LABEL: Record<string, string> = {
  good: '良好', warn: '注意', danger: '危険',
}

export function ColonyCard({ colony, onClick }: ColonyCardProps) {
  const { id, name, status, lastInspectedAt, composition, compositionDelta } = colony
  const notable = topDeltas(compositionDelta)

  return (
    <button
      className={`${styles.card} ${styles[status]}`}
      onClick={() => onClick?.(id)}
      aria-label={`${name} ${STATUS_LABEL[status]} 最終内検${relativeDate(lastInspectedAt)}`}
    >
      {/* 1行目: バッジ + 蜂群名 + シェブロン */}
      <div className={styles.topRow}>
        <span className={`${styles.badge} ${styles[`badge_${status}`]}`}>
          {STATUS_LABEL[status]}
        </span>
        <span className={styles.name}>{name}</span>
        <ChevronRight size={14} className={styles.chevron} aria-hidden />
      </div>

      {/* 2行目: 最終内検 */}
      <div className={styles.inspRow}>
        <span className={styles.inspRel}>{relativeDate(lastInspectedAt)}</span>
        <span className={styles.inspAbs}>{shortDate(lastInspectedAt)}</span>
      </div>

      {/* 3行目: 積み上げバー */}
      <CompositionBar composition={composition} />

      {/* 4行目: 注目項目デルタ */}
      {notable.length > 0 && (
        <div className={styles.deltaRow}>
          {notable.map(({ label, value }) => (
            <span
              key={label}
              className={value >= 0 ? styles.deltaUp : styles.deltaDown}
            >
              {label} {value >= 0 ? '↑' : '↓'} {Math.abs(value)}%
            </span>
          ))}
        </div>
      )}
    </button>
  )
}
