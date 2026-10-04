import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import styles from './CustomRangeSheet.module.css'

interface Props {
  initialStart?: string  // YYYY-MM-DD
  initialEnd?: string    // YYYY-MM-DD
  onApply: (start: string, end: string) => void
  onCancel: () => void
}

// Internal: YYYY-MM-DD  Display: YYYY/MM/DD
function toDisplay(iso: string): string {
  return iso ? iso.replace(/-/g, '/') : ''
}
function toIso(display: string): string {
  return display ? display.replace(/\//g, '-') : ''
}
function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function CustomRangeSheet({ initialStart, initialEnd, onApply, onCancel }: Props) {
  const [startDisplay, setStartDisplay] = useState(toDisplay(initialStart ?? ''))
  const [endDisplay, setEndDisplay]     = useState(toDisplay(initialEnd ?? todayIso()))
  const [error, setError] = useState('')
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => { closeRef.current?.focus() }, [])
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const startIso = toIso(startDisplay)
  const endIso   = toIso(endDisplay)

  function validate(): boolean {
    if (!startIso || !endIso) { setError('開始日と終了日を入力してください'); return false }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startIso) || !/^\d{4}-\d{2}-\d{2}$/.test(endIso)) {
      setError('YYYY/MM/DD の形式で入力してください'); return false
    }
    if (startIso > endIso) { setError('開始日は終了日より前にしてください'); return false }
    const days = (new Date(endIso).getTime() - new Date(startIso).getTime()) / 86400000
    if (days > 365) { setError('期間は最大1年です'); return false }
    setError('')
    return true
  }

  function handleApply() {
    if (validate()) onApply(startIso, endIso)
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="期間を選択">
      <div className={styles.sheet}>
        <div className={styles.handle} aria-hidden />
        <div className={styles.header}>
          <h2 className={styles.title}>期間を選択</h2>
          <button ref={closeRef} className={styles.closeBtn} onClick={onCancel} aria-label="キャンセル">
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className={styles.fields}>
          <div className={styles.field}>
            <label htmlFor="rangeStart" className={styles.label}>開始日</label>
            <input
              id="rangeStart"
              type="text"
              inputMode="numeric"
              placeholder="YYYY/MM/DD"
              className={styles.input}
              value={startDisplay}
              onChange={e => { setStartDisplay(e.target.value); setError('') }}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="rangeEnd" className={styles.label}>終了日</label>
            <input
              id="rangeEnd"
              type="text"
              inputMode="numeric"
              placeholder="YYYY/MM/DD"
              className={styles.input}
              value={endDisplay}
              onChange={e => { setEndDisplay(e.target.value); setError('') }}
            />
          </div>
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>キャンセル</button>
          <button className={styles.applyBtn} onClick={handleApply}>適用</button>
        </div>
      </div>
    </div>
  )
}
