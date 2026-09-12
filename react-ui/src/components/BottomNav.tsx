import { BarChart3, ClipboardCheck, Home, Settings } from 'lucide-react'
import { ApiaryFarmIcon } from './icons'
import styles from './BottomNav.module.css'

export type TabId = 'home' | 'farms' | 'work' | 'analytics' | 'settings'

const FarmsIcon = ({ size }: { size?: number }) => (
  <ApiaryFarmIcon size={size} />
)

interface NavItem {
  id: TabId
  label: string
  Icon: React.ComponentType<{ size?: number; 'aria-hidden'?: boolean | 'true' | 'false' }>
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home',      label: 'ホーム',   Icon: Home },
  { id: 'farms',     label: '養蜂場',   Icon: FarmsIcon },
  { id: 'work',      label: '作業',     Icon: ClipboardCheck },
  { id: 'analytics', label: '分析',     Icon: BarChart3 },
  { id: 'settings',  label: '設定',     Icon: Settings },
]

interface BottomNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className={styles.nav} aria-label="メインナビゲーション">
      {NAV_ITEMS.map(({ id, label, Icon }) => {
        const active = activeTab === id
        return (
          <button
            key={id}
            className={active ? styles.itemActive : styles.item}
            aria-current={active ? 'page' : undefined}
            onClick={() => onTabChange(id)}
          >
            <Icon size={21} aria-hidden />
            <span className={styles.label}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
