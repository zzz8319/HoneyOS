import { Bell } from 'lucide-react'
import styles from './AppHeader.module.css'

interface AppHeaderProps {
  farmName?: string
  notifCount?: number
  onNotifClick?: () => void
}

export function AppHeader({ farmName = '', notifCount = 0, onNotifClick }: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <strong className={styles.logo}>HoneyOS</strong>
        {farmName && <span className={styles.farmName}>{farmName}</span>}
      </div>
      <button
        className={styles.notifButton}
        aria-label={`通知${notifCount > 0 ? `（${notifCount}件）` : ''}`}
        onClick={onNotifClick}
      >
        <Bell size={22} aria-hidden />
        {notifCount > 0 && (
          <span className={styles.badge} aria-hidden>
            {notifCount > 99 ? '99+' : notifCount}
          </span>
        )}
      </button>
    </header>
  )
}
