import { AlertCircle, AlertTriangle, X } from 'lucide-react'
import styles from './ErrorBanner.module.css'

type Severity = 'minor' | 'critical'

interface ErrorBannerProps {
  message: string
  severity?: Severity
  onClose?: () => void
}

export function ErrorBanner({ message, severity = 'minor', onClose }: ErrorBannerProps) {
  const Icon = severity === 'critical' ? AlertCircle : AlertTriangle
  return (
    <div
      className={`${styles.banner} ${styles[severity]}`}
      role="alert"
      aria-live="assertive"
      aria-atomic
    >
      <Icon size={16} className={styles.icon} aria-hidden />
      <span className={styles.message}>{message}</span>
      {onClose && (
        <button className={styles.close} onClick={onClose} aria-label="エラーを閉じる">
          <X size={16} aria-hidden />
        </button>
      )}
    </div>
  )
}
