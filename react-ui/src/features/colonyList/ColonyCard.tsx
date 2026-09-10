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

// デルタ絶対値上位2件を「注目項目」として返す（空間は除外）
function topDeltas(delta: CompositionDelta): { label: string; value: number; color: string }[] {
  return COMP_SEGMENTS
    .filter(s => s.key !== 'empty')
    .map(({ key, label, color }) => ({ label, value: delta[key], color }))
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
  const rel = relativeDate(lastInspectedAt)
  const abs = shortDate(lastInspectedAt)

  return (
    <button
      className={`${styles.card} ${styles[status]}`}
      onClick={() => onClick?.(id)}
      aria-label={`${name} ${STATUS_LABEL[status]} 最終内検${rel}`}
    >
      {/* 行1: 蜂群名（左）+ 状態バッジ（右） */}
      <div className={styles.row1}>
        <span className={styles.name}>{name}</span>
        <span className={`${styles.badge} ${styles[`badge_${status}`]}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      {/* 行2: 最終内検ラベル + 相対日付 + 実日付 */}
      <div className={styles.row2}>
        <span className={styles.inspLabel}>最終内検</span>
        <span className={styles.inspRel}>{rel}</span>
        <span className={styles.inspAbs}>{abs}</span>
      </div>

      {/* 行3: 積み上げバー */}
      <CompositionBar composition={composition} />

      {/* 行4: 注目デルタ（左）+ シェブロン（右） */}
      <div className={styles.row4}>
        <div className={styles.deltaWrap}>
          {notable.map(({ label, value }) => (
            <span
              key={label}
              className={value >= 0 ? styles.deltaUp : styles.deltaDown}
            >
              {label} {value >= 0 ? '↑' : '↓'} {Math.abs(value)}%
            </span>
          ))}
        </div>
        <ChevronRight size={13} className={styles.chevron} aria-hidden />
      </div>
    </button>
  )
}
