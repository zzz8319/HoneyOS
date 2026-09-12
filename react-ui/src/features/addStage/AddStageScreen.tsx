import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import type { InspectionRecord } from '../frameViewer/types'
import styles from './AddStageScreen.module.css'

interface Props {
  record: InspectionRecord
  onBack: () => void
  onSave: (record: InspectionRecord) => void
}

export function AddStageScreen({ record, onBack, onSave }: Props) {
  const [frameCount, setFrameCount] = useState(8)
  const [position, setPosition] = useState<'top' | 'bottom'>('top')

  const handleSave = () => {
    const newStageId = `stage-${Date.now()}`
    const newStage = {
      id: newStageId,
      label: position === 'top' ? `${record.stages.length + 1}段目` : '1段目',
      frameCount,
      frames: Array(frameCount).fill(null) as null[],
      hasQueenExcluderAbove: false,
      foundationFrames: [] as number[],
      alertFrames: [] as number[],
    }
    const updatedStages = position === 'top'
      ? [newStage, ...record.stages]
      : [...record.stages, newStage]
    onSave({ ...record, stages: updatedStages })
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} type="button" aria-label="戻る">
          <ArrowLeft size={20} aria-hidden />
        </button>
        <h1 className={styles.headerTitle}>段を追加</h1>
        <div style={{ width: 44 }} />
      </header>

      <div className={styles.content}>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>
          {record.colonyLabel}・{record.inspDate.replace(/（.+）/, '')}
        </p>

        <div className={styles.divider} />

        <div className={styles.field}>
          <span className={styles.fieldLabel}>枠数</span>
          <div className={styles.stepper}>
            <button
              className={styles.stepBtn}
              onClick={() => setFrameCount(n => Math.max(1, n - 1))}
              disabled={frameCount <= 1}
              type="button"
              aria-label="枠数を減らす"
            >−</button>
            <span className={styles.stepValue}>{frameCount}</span>
            <button
              className={styles.stepBtn}
              onClick={() => setFrameCount(n => Math.min(20, n + 1))}
              disabled={frameCount >= 20}
              type="button"
              aria-label="枠数を増やす"
            >＋</button>
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>追加位置</span>
          <div className={styles.positionRow}>
            <button
              className={`${styles.posBtn} ${position === 'top' ? styles.posBtnActive : ''}`}
              onClick={() => setPosition('top')}
              type="button"
            >
              上段に追加
            </button>
            <button
              className={`${styles.posBtn} ${position === 'bottom' ? styles.posBtnActive : ''}`}
              onClick={() => setPosition('bottom')}
              type="button"
            >
              下段に追加
            </button>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button className={styles.saveBtn} type="button" onClick={handleSave}>
          追加する
        </button>
      </div>
    </div>
  )
}
