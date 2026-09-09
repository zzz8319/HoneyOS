import type { Composition } from './mockData'
import styles from './CompositionBar.module.css'

interface CompositionBarProps {
  composition: Composition
}

const SEGMENTS = [
  { key: 'bee'   as const, label: '蜂',   color: 'var(--color-primary)' },
  { key: 'brood' as const, label: '育児', color: '#F59E0B' },
  { key: 'honey' as const, label: '貯蜜', color: '#A16207' },
  { key: 'empty' as const, label: '空間', color: 'var(--color-border)' },
]

export function CompositionBar({ composition }: CompositionBarProps) {
  return (
    <div className={styles.root}>
      <div className={styles.bar} role="img" aria-label="枠構成比">
        {SEGMENTS.map(({ key, color }) => (
          <div
            key={key}
            className={styles.segment}
            style={{ width: `${composition[key]}%`, background: color }}
          />
        ))}
      </div>
      <div className={styles.legend} aria-hidden>
        {SEGMENTS.map(({ key, label, color }) => (
          <span key={key} className={styles.legendItem}>
            <span className={styles.dot} style={{ background: color }} />
            <span className={styles.legendLabel}>{label}</span>
            <span className={styles.legendVal}>{composition[key]}%</span>
          </span>
        ))}
      </div>
    </div>
  )
}
