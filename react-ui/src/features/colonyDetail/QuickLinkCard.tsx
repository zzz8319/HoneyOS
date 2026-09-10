import { ChevronRight } from 'lucide-react'
import styles from './QuickLinkCard.module.css'

interface Props {
  icon: string
  title: string
  subtitle: string
  onClick?: () => void
}

export function QuickLinkCard({ icon, title, subtitle, onClick }: Props) {
  return (
    <button className={styles.card} onClick={onClick}>
      <span className={styles.icon}>{icon}</span>
      <div className={styles.text}>
        <span className={styles.title}>{title}</span>
        <span className={styles.subtitle}>{subtitle}</span>
      </div>
      <ChevronRight size={14} className={styles.chevron} aria-hidden />
    </button>
  )
}
