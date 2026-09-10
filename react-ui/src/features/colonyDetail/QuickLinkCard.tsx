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
      <span className={styles.title}>{title}</span>
      <span className={styles.subtitle}>{subtitle}</span>
    </button>
  )
}
