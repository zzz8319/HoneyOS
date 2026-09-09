import styles from './StatusBadge.module.css'

export type Status = 'good' | 'warn' | 'danger' | 'unknown'

const STATUS_CONFIG: Record<Status, { label: string; emoji: string }> = {
  good:    { label: '良好',   emoji: '✅' },
  warn:    { label: '注意',   emoji: '⚠️' },
  danger:  { label: '危険',   emoji: '🚨' },
  unknown: { label: '不明',   emoji: '❓' },
}

interface StatusBadgeProps {
  status: Status
  /** ラベルテキストを上書きする場合 */
  label?: string
  showEmoji?: boolean
}

export function StatusBadge({ status, label, showEmoji = false }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span className={`${styles.badge} ${styles[status]}`} role="status">
      {showEmoji && <span aria-hidden>{config.emoji} </span>}
      {label ?? config.label}
    </span>
  )
}
