import styles from './AlertBanner.module.css'

interface AlertBannerProps {
  colonyCount: number
  onTap?: () => void
}

export function AlertBanner({ colonyCount, onTap }: AlertBannerProps) {
  if (colonyCount === 0) return null
  return (
    <button className={styles.banner} onClick={onTap} aria-label={`要注意蜂群${colonyCount}群 — 一覧を見る`}>
      <span className={styles.icon} aria-hidden>⚠️</span>
      <span className={styles.text}>{colonyCount}群が要注意</span>
      <span className={styles.arrow} aria-hidden>›</span>
    </button>
  )
}
