import { PrimaryButton } from './PrimaryButton'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  emoji?: string
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ emoji = '🐝', title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className={styles.container} role="status" aria-live="polite">
      <span className={styles.emoji} aria-hidden>{emoji}</span>
      <h2 className={styles.title}>{title}</h2>
      {description && <p className={styles.description}>{description}</p>}
      {actionLabel && onAction && (
        <PrimaryButton onClick={onAction} size="md">
          {actionLabel}
        </PrimaryButton>
      )}
    </div>
  )
}
