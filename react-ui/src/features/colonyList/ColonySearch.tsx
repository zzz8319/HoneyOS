import { Search } from 'lucide-react'
import styles from './ColonySearch.module.css'

interface ColonySearchProps {
  value: string
  onChange: (v: string) => void
}

export function ColonySearch({ value, onChange }: ColonySearchProps) {
  return (
    <div className={styles.wrap}>
      <Search size={16} className={styles.icon} aria-hidden />
      <input
        type="search"
        placeholder="蜂群名で検索"
        value={value}
        onChange={e => onChange(e.target.value)}
        className={styles.input}
        aria-label="蜂群名で検索"
      />
    </div>
  )
}
