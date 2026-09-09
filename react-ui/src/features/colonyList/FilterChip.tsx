import styles from './FilterChip.module.css'

export type FilterValue = 'all' | 'alert' | 'overdue'

const FILTERS: { id: FilterValue; label: string }[] = [
  { id: 'all',    label: 'すべて' },
  { id: 'alert',  label: '要注意' },
  { id: 'overdue', label: '内検期限' },
]

interface FilterChipProps {
  active: FilterValue
  onChange: (v: FilterValue) => void
}

export function FilterChip({ active, onChange }: FilterChipProps) {
  return (
    <div className={styles.row} role="group" aria-label="絞り込み">
      {FILTERS.map(({ id, label }) => (
        <button
          key={id}
          className={active === id ? styles.chipActive : styles.chip}
          onClick={() => onChange(id)}
          aria-pressed={active === id}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
