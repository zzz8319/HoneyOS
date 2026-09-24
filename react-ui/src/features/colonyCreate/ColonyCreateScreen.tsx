import { useState, useEffect, useId, useRef } from 'react'
import {
  ChevronLeft,
  ChevronDown,
  Info,
  Plus,
  WifiOff,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { PrimaryButton } from '../../components'
import { HiveStackIcon } from '../../components/icons'
import type { ColonyCreateViewState, Apiary } from './types'
import { MOCK_APIARIES } from './mockData'
import styles from './ColonyCreateScreen.module.css'

interface Props {
  viewState?: ColonyCreateViewState
  onBack: () => void
  onSuccess?: (colonyId: string) => void
  onAddApiary?: () => void
}

export function ColonyCreateScreen({
  viewState = 'normal',
  onBack,
  onSuccess,
  onAddApiary,
}: Props) {
  const nameId = useId()
  const apiaryId = useId()
  const nameErrorId = useId()
  const apiaryErrorId = useId()
  const submitStatusId = useId()

  const [colonyName, setColonyName] = useState(() =>
    viewState === 'submitting' || viewState === 'submit-error' ? 'A-07' : '',
  )
  const [selectedApiaryId, setSelectedApiaryId] = useState(() =>
    viewState === 'submitting' || viewState === 'submit-error' ? 'apiary-miyata' : '',
  )
  const [apiaries, setApiaries] = useState<Apiary[]>([])
  const [apiaryLoading, setApiaryLoading] = useState(true)
  const [apiaryLoadError, setApiaryLoadError] = useState(false)

  const [nameError, setNameError] = useState('')
  const [apiaryError, setApiaryError] = useState('')
  const [submitError, setSubmitError] = useState(() =>
    viewState === 'submit-error'
      ? '蜂群を登録できませんでした。もう一度お試しください。'
      : '',
  )
  const [submitting, setSubmitting] = useState(false)

  const nameRef = useRef<HTMLInputElement>(null)
  const apiarySelectRef = useRef<HTMLSelectElement>(null)

  // Determine effective states from prop
  const isOffline = viewState === 'offline'
  const isSubmitting = viewState === 'submitting' || submitting
  const isSubmitError = viewState === 'submit-error' && !submitError
  const isNoApiary = viewState === 'no-apiary'
  const isApiaryLoadError = viewState === 'apiary-load-error'

  async function fetchApiaries() {
    setApiaryLoading(true)
    setApiaryLoadError(false)
    try {
      if (typeof window !== 'undefined' && window.HoneyDB?.getFarms) {
        const farms = await window.HoneyDB.getFarms()
        setApiaries(farms.map(f => ({ id: String(f.id), name: f.name })))
      } else {
        // dev/test fallback
        setApiaries(
          isNoApiary || isApiaryLoadError ? [] : MOCK_APIARIES,
        )
        if (isApiaryLoadError) setApiaryLoadError(true)
      }
    } catch {
      setApiaryLoadError(true)
      setApiaries([])
    } finally {
      setApiaryLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (isApiaryLoadError) {
        if (!cancelled) {
          setApiaryLoadError(true)
          setApiaryLoading(false)
          setApiaries([])
        }
        return
      }
      if (isNoApiary) {
        if (!cancelled) {
          setApiaries([])
          setApiaryLoading(false)
        }
        return
      }
      await fetchApiaries()
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewState])


  const trimmedName = colonyName.trim()
  // Disabled for structural reasons (not field-level validation)
  const canSubmit =
    !isSubmitting &&
    !isOffline &&
    !apiaryLoadError &&
    !apiaryLoading &&
    !isNoApiary

  function validate(): boolean {
    let valid = true
    const newNameError = trimmedName === '' ? '蜂群名を入力してください' : ''
    const newApiaryError =
      selectedApiaryId === '' ? '所属養蜂場を選択してください' : ''
    setNameError(newNameError)
    setApiaryError(newApiaryError)
    if (newNameError) {
      valid = false
      nameRef.current?.focus()
    } else if (newApiaryError) {
      valid = false
      apiarySelectRef.current?.focus()
    }
    return valid
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isSubmitting) return
    setSubmitError('')
    if (!validate()) return

    if (isOffline || !navigator.onLine) {
      setSubmitError('オフラインのため蜂群を登録できません')
      return
    }

    setSubmitting(true)
    try {
      const newId = crypto.randomUUID()
      if (window.HoneyDB?.saveColony) {
        await window.HoneyDB.saveColony(newId, trimmedName, 9999)
      }
      onSuccess?.(newId)
    } catch {
      setSubmitError('蜂群を登録できませんでした。もう一度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  const previewName = trimmedName

  return (
    <div className={styles.screen}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <div className={styles.headerSide}>
            <button
              className={styles.backBtn}
              onClick={onBack}
              aria-label="戻る"
              type="button"
            >
              <ChevronLeft size={22} aria-hidden />
            </button>
          </div>
          <h1 className={styles.headerTitle}>蜂群を追加</h1>
          <div className={styles.headerSide} />
        </div>
      </header>

      {/* ── Banners ── */}
      {(isSubmitError || submitError) && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={16} className={styles.errorBannerIcon} aria-hidden />
          <span className={styles.errorBannerText}>
            {submitError || '蜂群を登録できませんでした。もう一度お試しください。'}
          </span>
        </div>
      )}
      {isOffline && (
        <div className={styles.offlineBanner} role="status">
          <WifiOff size={16} className={styles.offlineBannerIcon} aria-hidden />
          <span className={styles.offlineBannerText}>
            オフラインのため蜂群を登録できません
          </span>
        </div>
      )}

      {/* ── Body ── */}
      <div className={styles.body}>
        {/* Info box 1 */}
        <div className={styles.infoBox} aria-hidden="false">
          <Info size={16} className={styles.infoIcon} aria-hidden />
          <span className={styles.infoText}>基本情報だけで登録できます。</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate aria-label="蜂群追加フォーム">
          {/* Colony name */}
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label} htmlFor={nameId}>
                蜂群名
              </label>
              <span className={styles.required} aria-hidden="true">
                必須
              </span>
            </div>
            <input
              ref={nameRef}
              id={nameId}
              className={`${styles.input}${nameError ? ` ${styles.inputError}` : ''}`}
              type="text"
              placeholder="例：A-07"
              value={colonyName}
              onChange={e => {
                setColonyName(e.target.value)
                if (nameError) setNameError('')
              }}
              aria-required="true"
              aria-invalid={nameError ? 'true' : 'false'}
              aria-describedby={nameError ? nameErrorId : undefined}
              autoComplete="off"
            />
            {nameError && (
              <span id={nameErrorId} className={styles.errorText} role="alert">
                {nameError}
              </span>
            )}
          </div>

          {/* Apiary */}
          <div className={styles.field} style={{ marginTop: 20 }}>
            <div className={styles.labelRow}>
              <label className={styles.label} htmlFor={apiaryId}>
                所属養蜂場
              </label>
              <span className={styles.required} aria-hidden="true">
                必須
              </span>
            </div>
            {apiaryLoadError ? (
              <div className={styles.apiaryNotice} role="alert">
                <AlertCircle
                  size={15}
                  style={{ flexShrink: 0, color: '#D97706', marginTop: 1 }}
                  aria-hidden
                />
                <div>
                  <p className={styles.apiaryNoticeText}>
                    養蜂場の読み込みに失敗しました。
                  </p>
                  <button
                    type="button"
                    className={styles.retryBtn}
                    onClick={() => fetchApiaries()}
                  >
                    <RefreshCw size={13} aria-hidden />
                    再試行
                  </button>
                </div>
              </div>
            ) : apiaryLoading ? (
              <div className={styles.selectWrap}>
                <select
                  id={apiaryId}
                  className={styles.selectNative}
                  disabled
                  aria-busy="true"
                >
                  <option>読み込み中…</option>
                </select>
                <ChevronDown
                  size={16}
                  className={styles.selectChevron}
                  aria-hidden
                />
              </div>
            ) : (
              <div className={styles.selectWrap}>
                <select
                  ref={apiarySelectRef}
                  id={apiaryId}
                  className={`${styles.selectNative}${apiaryError ? ` ${styles.selectError}` : ''}`}
                  value={selectedApiaryId}
                  onChange={e => {
                    setSelectedApiaryId(e.target.value)
                    if (apiaryError) setApiaryError('')
                  }}
                  aria-required="true"
                  aria-invalid={apiaryError ? 'true' : 'false'}
                  aria-describedby={apiaryError ? apiaryErrorId : undefined}
                >
                  <option value="">養蜂場を選択</option>
                  {apiaries.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className={styles.selectChevron}
                  aria-hidden
                />
              </div>
            )}
            {apiaryError && (
              <span id={apiaryErrorId} className={styles.errorText} role="alert">
                {apiaryError}
              </span>
            )}
          </div>

          {/* Add apiary link */}
          <div style={{ marginTop: 8 }}>
            <button
              type="button"
              className={styles.addApiaryLink}
              onClick={() => onAddApiary?.()}
              aria-label="新しい養蜂場を追加（SCR-033）"
            >
              <Plus size={15} aria-hidden />
              新しい養蜂場を追加
            </button>
          </div>

          {/* Info box 2 */}
          <div className={styles.infoBox} style={{ marginTop: 12 }}>
            <Info size={16} className={styles.infoIcon} aria-hidden />
            <span className={styles.infoText}>
              巣箱タイプと段構成は、最初の内検時に記録方式から自動設定されます。
            </span>
          </div>

          {/* Preview card */}
          <div style={{ marginTop: 8 }}>
            <div className={styles.previewCard} aria-live="polite" aria-label="登録後の表示プレビュー">
              {/* Card header */}
              <div className={styles.previewCardHeader}>
                <span className={styles.previewCardHeaderText}>登録後の表示</span>
              </div>
              <div className={styles.previewCardDivider} />
              {/* Card body */}
              <div className={styles.previewCardBody}>
                <div className={styles.previewTop}>
                  <div className={styles.previewIconWrap} aria-hidden>
                    <HiveStackIcon size={30} color="#9CA3AF" />
                  </div>
                  <div className={styles.previewRight}>
                    <div className={styles.previewNameRow}>
                      {previewName ? (
                        <span className={styles.previewName}>{previewName}</span>
                      ) : (
                        <span className={styles.previewNameEmpty}>—</span>
                      )}
                      <span className={styles.previewBadge}>内検未実施</span>
                    </div>
                  </div>
                </div>
                <div className={styles.previewBar} aria-hidden>
                  <div className={styles.previewBarSegment} />
                  <div className={styles.previewBarSegment} />
                  <div className={styles.previewBarSegment} />
                  <div className={styles.previewBarSegment} />
                </div>
                <p className={styles.previewDesc}>
                  最初の内検を記録すると状態が表示されます。
                </p>
              </div>
            </div>
          </div>

          {/* Submit status for a11y */}
          <span id={submitStatusId} className={styles.srOnly} aria-live="assertive">
            {isSubmitting ? '登録中…' : ''}
          </span>

          {/* Buttons */}
          <div className={styles.actions} style={{ marginTop: 20 }}>
            <PrimaryButton
              type="submit"
              size="lg"
              fullWidth
              loading={isSubmitting}
              disabled={!canSubmit}
              aria-describedby={submitStatusId}
            >
              蜂群を登録
            </PrimaryButton>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onBack}
              disabled={isSubmitting}
            >
              キャンセル
            </button>
          </div>

          {/* Bottom hint */}
          <div className={styles.bottomHint} style={{ marginTop: 16 }}>
            <Info size={13} className={styles.bottomHintIcon} aria-hidden />
            <span className={styles.bottomHintText}>
              登録後に最初の内検を始められます。
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}
