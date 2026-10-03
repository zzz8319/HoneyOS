import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { SensorEvent } from './sensorGraphTypes'
import styles from './SensorEventSheet.module.css'

interface Props {
  event: SensorEvent
  unit: string
  onClose: () => void
}

function duration(start: string, end: string | null): string {
  if (!end) return '継続中'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const min = Math.round(ms / 60000)
  if (min < 60) return `${min}分`
  return `${Math.floor(min / 60)}時間${min % 60}分`
}

function fmt(iso: string): string {
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

export function SensorEventSheet({ event, unit, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { closeRef.current?.focus() }, [])
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="異常イベント詳細">
      <div className={styles.sheet}>
        <div className={styles.handle} aria-hidden />
        <div className={styles.header}>
          <h2 className={styles.title}>異常イベント詳細</h2>
          <button ref={closeRef} className={styles.closeBtn} onClick={onClose} aria-label="閉じる">
            <X size={20} aria-hidden />
          </button>
        </div>
        <dl className={styles.dl}>
          <div className={styles.row}>
            <dt>開始時刻</dt><dd>{fmt(event.startedAt)}</dd>
          </div>
          <div className={styles.row}>
            <dt>終了時刻</dt><dd>{event.endedAt ? fmt(event.endedAt) : '継続中'}</dd>
          </div>
          <div className={styles.row}>
            <dt>継続時間</dt><dd>{duration(event.startedAt, event.endedAt)}</dd>
          </div>
          {event.peakValue !== undefined && (
            <div className={styles.row}>
              <dt>最大値</dt><dd>{event.peakValue}{unit}</dd>
            </div>
          )}
          {event.threshold !== undefined && (
            <div className={styles.row}>
              <dt>設定閾値</dt><dd>{event.threshold}{unit}</dd>
            </div>
          )}
          <div className={styles.row}>
            <dt>内容</dt><dd>{event.message}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
