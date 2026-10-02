import { useEffect, useRef } from 'react'
import { X, CheckCircle } from 'lucide-react'
import styles from './SensorSetupSheet.module.css'

interface Props {
  onClose: () => void
}

const STEPS = [
  { step: 1, title: 'センサー本体の取り付け', body: '巣箱底板の指定溝にセンサーモジュールを差し込み、固定ネジ2本で締め付けます。' },
  { step: 2, title: '防水カバーの取り付け', body: '付属の防水カバーをスライドさせて装着します。外れるとIP54保護が失われます。' },
  { step: 3, title: 'ペアリング', body: 'センサー側面のボタンを3秒長押しし、HoneyOSアプリの「センサー追加」からペアリングします。' },
  { step: 4, title: '動作確認', body: 'ペアリング完了後、このセンサー詳細画面で振動値が表示されれば設置完了です。' },
]

export function SensorSetupSheet({ onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="振動センサー設置方法">
      <div className={styles.sheet}>
        <div className={styles.handle} aria-hidden />
        <div className={styles.sheetHeader}>
          <h2 className={styles.sheetTitle}>振動センサーの設置方法</h2>
          <button ref={closeRef} className={styles.closeBtn} onClick={onClose} aria-label="閉じる">
            <X size={20} aria-hidden />
          </button>
        </div>
        <p className={styles.intro}>以下の手順に沿って振動センサーを設置してください。</p>
        <ol className={styles.stepList}>
          {STEPS.map(({ step, title, body }) => (
            <li key={step} className={styles.stepItem}>
              <span className={styles.stepNum} aria-hidden>{step}</span>
              <div className={styles.stepContent}>
                <span className={styles.stepTitle}>{title}</span>
                <span className={styles.stepBody}>{body}</span>
              </div>
            </li>
          ))}
        </ol>
        <div className={styles.note}>
          <CheckCircle size={16} aria-hidden />
          <span>設置後は自動的に検出されます。最大5分かかる場合があります。</span>
        </div>
        <button className={styles.closeFullBtn} onClick={onClose}>
          閉じる
        </button>
      </div>
    </div>
  )
}
