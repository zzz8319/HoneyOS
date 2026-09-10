import type { Composition } from './mockData'
import { COMP_SEGMENTS } from './compositionConfig'
import styles from './CompositionBar.module.css'

interface CompositionBarProps {
  composition: Composition
}

export function CompositionBar({ composition }: CompositionBarProps) {
  return (
    <div
      className={styles.bar}
      role="img"
      aria-label={`枠構成比 蜂${composition.bee}% 育児${composition.brood}% 貯蜜${composition.honey}% 空間${composition.empty}%`}
    >
      {COMP_SEGMENTS.map(({ key, color }) => (
        <div
          key={key}
          className={styles.segment}
          style={{ width: `${composition[key]}%`, background: color }}
        />
      ))}
    </div>
  )
}
