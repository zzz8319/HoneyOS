import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { SensorKind } from './sensorTypes'
import styles from './SensorFilterSheet.module.css'

const ALL_KINDS: { kind: SensorKind; label: string }[] = [
  { kind: 'temperature', label: '温度' },
  { kind: 'humidity',    label: '湿度' },
  { kind: 'weight',      label: '重量' },
  { kind: 'sound',       label: '音響' },
  { kind: 'vibration',   label: '振動' },
]

interface Props {
  selected: Set<SensorKind>
  onApply: (selected: Set<SensorKind>) => void
  onCancel: () => void
}

export function SensorFilterSheet({ selected, onApply, onCancel }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  function toggle(kind: SensorKind, current: Set<SensorKind>): Set<SensorKind> {
    const next = new Set(current)
    if (next.has(kind)) { next.delete(kind) } else { next.add(kind) }
    return next
  }

  // Local state via ref to avoid re-render; pass through onApply
  const localRef = useRef(new Set(selected))

  function handleToggle(kind: SensorKind) {
    localRef.current = toggle(kind, localRef.current)
    // Force re-render via forceUpdate workaround — use data attr instead
    const btn = sheetRef.current?.querySelector(`[data-kind="${kind}"]`) as HTMLButtonElement | null
    if (btn) {
      const active = localRef.current.has(kind)
      btn.setAttribute('aria-pressed', String(active))
      btn.className = [styles.chip, active ? styles.chipActive : ''].filter(Boolean).join(' ')
    }
  }

  function handleAll() {
    ALL_KINDS.forEach(({ kind }) => {
      localRef.current.add(kind)
      const btn = sheetRef.current?.querySelector(`[data-kind="${kind}"]`) as HTMLButtonElement | null
      if (btn) {
        btn.setAttribute('aria-pressed', 'true')
        btn.className = `${styles.chip} ${styles.chipActive}`
      }
    })
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="センサー絞り込み">
      <div className={styles.sheet} ref={sheetRef}>
        <div className={styles.handle} aria-hidden />
        <div className={styles.sheetHeader}>
          <h2 className={styles.sheetTitle}>表示するセンサー</h2>
          <button ref={closeRef} className={styles.closeBtn} onClick={onCancel} aria-label="閉じる">
            <X size={20} aria-hidden />
          </button>
        </div>
        <div className={styles.chips} role="group" aria-label="センサー種別">
          {ALL_KINDS.map(({ kind, label }) => (
            <button
              key={kind}
              className={`${styles.chip} ${selected.has(kind) ? styles.chipActive : ''}`}
              aria-pressed={selected.has(kind)}
              data-kind={kind}
              onClick={() => handleToggle(kind)}
            >
              {label}
            </button>
          ))}
        </div>
        <button className={styles.allBtn} onClick={handleAll}>
          すべて表示
        </button>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            キャンセル
          </button>
          <button className={styles.applyBtn} onClick={() => onApply(new Set(localRef.current))}>
            適用
          </button>
        </div>
      </div>
    </div>
  )
}
