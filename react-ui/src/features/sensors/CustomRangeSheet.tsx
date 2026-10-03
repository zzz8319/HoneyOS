import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import styles from './CustomRangeSheet.module.css'

interface Props {
  initialStart?: string
  initialEnd?: string
  onApply: (start: string, end: string) => void
  onCancel: () => void
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function CustomRangeSheet({ initialStart, initialEnd, onApply, onCancel }: Props) {
  const [start, setStart] = useState(initialStart ?? '')
  const [end, setEnd]     = useState(initialEnd ?? today())
  const [error, setError] = useState('')
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => { closeRef.current?.focus() }, [])
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  function validate(): boolean {
    if (!start || !end) { setError('開始日と終了日を選択してください'); return false }
    if (start > end)    { setError('開始日は終了日より前にしてください'); return false }
    const days = (new Date(end).getTime() - new Date(start).getTime()) / 86400000
    if (days > 365)     { setError('期間は最大1年です'); return false }
    setError('')
    return true
  }

  function handleApply() {
    if (validate()) onApply(start, end)
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
              type="date"
              className={styles.input}
              value={start}
              max={end || today()}
              onChange={e => { setStart(e.target.value); setError('') }}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="rangeEnd" className={styles.label}>終了日</label>
            <input
              id="rangeEnd"
              type="date"
              className={styles.input}
              value={end}
              min={start}
              max={today()}
              onChange={e => { setEnd(e.target.value); setError('') }}
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
