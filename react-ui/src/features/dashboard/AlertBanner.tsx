import { AlertTriangle, ChevronRight } from 'lucide-react'
import styles from './AlertBanner.module.css'

interface AlertBannerProps {
  colonyCount: number
  onTap?: () => void
}

export function AlertBanner({ colonyCount, onTap }: AlertBannerProps) {
  if (colonyCount === 0) return null
  return (
    <button
      className={styles.banner}
      onClick={onTap}
      aria-label={`要注意蜂群${colonyCount}群 — 蜂群一覧を見る`}
    >
      <AlertTriangle size={15} className={styles.icon} aria-hidden />
      <span className={styles.text}>{colonyCount}群が要注意</span>
      <ChevronRight size={16} className={styles.arrow} aria-hidden />
    </button>
  )
}
