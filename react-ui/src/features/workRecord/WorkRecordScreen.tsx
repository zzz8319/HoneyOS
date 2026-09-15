import { useState, useRef, useCallback } from 'react'
import type { WorkRecordViewState, WorkType, WorkRecordColony } from './types'
import { MOCK_COLONIES, MOCK_APIARIES, FEED_TYPES, FEED_UNITS, LINKED_CONTEXT, NEW_CONTEXT } from './mockData'
import styles from './WorkRecordScreen.module.css'

// ── SVG Icons ──────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}

function ChevronDownIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function CameraOffIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      {/* Camera body */}
      <path d="M6 20a5 5 0 0 0-5 5v24a5 5 0 0 0 5 5h40a5 5 0 0 0 5-5V25a5 5 0 0 0-5-5h-8l-5-8H27l-5 8H6z"
        fill="#F3F4F6" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Lens circle */}
      <circle cx="26" cy="34" r="9" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
      {/* Slash line across entire icon */}
      <line x1="8" y1="8" x2="56" y2="56" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

function Spinner() {
  return <div className={styles.spinner} aria-hidden="true" />
}

// ── Work type icons ────────────────────────────────────────────────────────

function HarvestIcon({ active }: { active: boolean }) {
  const color = active ? 'var(--color-primary, #E39A16)' : '#334155'
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 4C16 4 8 10 8 18a8 8 0 0 0 16 0c0-8-8-14-8-14z"
        fill={active ? '#FEF3C7' : '#F1F5F9'}
        stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 13 v9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13 16 l3-3 3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FeedIcon({ active }: { active: boolean }) {
  const color = active ? 'var(--color-primary, #E39A16)' : '#334155'
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M8 20 C8 14 12 10 16 8 C20 10 24 14 24 20" stroke={color} strokeWidth="1.7" strokeLinecap="round" fill="none" />
      <rect x="8" y="20" width="16" height="5" rx="2"
        fill={active ? '#FEF3C7' : '#F1F5F9'} stroke={color} strokeWidth="1.7" />
      <path d="M12 20 L12 16" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M16 20 L16 14" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M20 20 L20 16" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function TreatmentIcon({ active }: { active: boolean }) {
  const color = active ? 'var(--color-primary, #E39A16)' : '#334155'
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="14" y="7" width="4" height="18" rx="2"
        fill={active ? '#FEF3C7' : '#F1F5F9'} stroke={color} strokeWidth="1.7" />
      <rect x="7" y="14" width="18" height="4" rx="2"
        fill={active ? '#FEF3C7' : '#F1F5F9'} stroke={color} strokeWidth="1.7" />
    </svg>
  )
}

function SwarmIcon({ active }: { active: boolean }) {
  const color = active ? 'var(--color-primary, #E39A16)' : '#334155'
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="5" fill={active ? '#FEF3C7' : '#F1F5F9'} stroke={color} strokeWidth="1.7" />
      <circle cx="8" cy="10" r="2.5" fill={active ? '#FEF3C7' : '#F1F5F9'} stroke={color} strokeWidth="1.4" />
      <circle cx="24" cy="10" r="2.5" fill={active ? '#FEF3C7' : '#F1F5F9'} stroke={color} strokeWidth="1.4" />
      <circle cx="8" cy="22" r="2.5" fill={active ? '#FEF3C7' : '#F1F5F9'} stroke={color} strokeWidth="1.4" />
      <circle cx="24" cy="22" r="2.5" fill={active ? '#FEF3C7' : '#F1F5F9'} stroke={color} strokeWidth="1.4" />
    </svg>
  )
}

function WinterIcon({ active }: { active: boolean }) {
  const color = active ? 'var(--color-primary, #E39A16)' : '#334155'
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <line x1="16" y1="6" x2="16" y2="26" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <line x1="6" y1="16" x2="26" y2="16" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <line x1="9" y1="9" x2="23" y2="23" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <line x1="23" y1="9" x2="9" y2="23" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="16" cy="16" r="2.5" fill={active ? '#FEF3C7' : '#F1F5F9'} stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

// ── Switch ──────────────────────────────────────────────────────────────────

function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={styles.switchBtn}
      onClick={() => { if (!disabled) onChange(!checked) }}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!disabled) onChange(!checked) }
      }}
    >
      <span className={`${styles.switchTrack} ${checked ? styles.switchTrackOn : ''}`}>
        <span className={`${styles.switchKnob} ${checked ? styles.switchKnobOn : ''}`} />
      </span>
    </button>
  )
}

// ── Date helpers ───────────────────────────────────────────────────────────

const WEEKDAY_JA = ['日', '月', '火', '水', '木', '金', '土']

function localDateToDisplay(iso: string): string {
  const parts = iso.split('-')
  if (parts.length !== 3) return iso
  const y = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  const d = parseInt(parts[2], 10)
  const date = new Date(y, m - 1, d)
  const w = WEEKDAY_JA[date.getDay()]
  return `${y}年${m}月${d}日（${w}）`
}

// ── Colony picker ──────────────────────────────────────────────────────────

function ColonyPicker({
  selectedId,
  onSelect,
  onClose,
}: {
  selectedId: string | null
  onSelect: (colony: WorkRecordColony) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const filtered = MOCK_COLONIES.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()),
  )
  const groups = MOCK_APIARIES.map(ap => ({
    apiary: ap,
    colonies: filtered.filter(c => c.apiaryId === ap.id),
  })).filter(g => g.colonies.length > 0)

  return (
    <div className={styles.sheetOverlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.sheetHeader}>
          <span className={styles.sheetTitle}>対象蜂群を選択</span>
          <button className={styles.sheetClose} onClick={onClose} aria-label="閉じる">
            <XIcon />
          </button>
        </div>
        <div className={styles.sheetSearch}>
          <SearchIcon />
          <input
            type="text"
            className={styles.sheetSearchInput}
            placeholder="蜂群番号で検索"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className={styles.sheetList}>
          {groups.map(({ apiary, colonies }) => (
            <div key={apiary.id}>
              <div className={styles.sheetGroupLabel}>{apiary.name}</div>
              {colonies.map(colony => {
                const sel = colony.id === selectedId
                return (
                  <button
                    key={colony.id}
                    className={`${styles.sheetItem} ${sel ? styles.sheetItemSelected : ''}`}
                    onClick={() => onSelect(colony)}
                  >
                    <span>{colony.name}</span>
                    {sel && <CheckIcon />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Date picker (simple native date input overlay) ─────────────────────────

function DatePickerSheet({
  value,
  onSelect,
  onClose,
}: {
  value: string
  onSelect: (v: string) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState(value)
  return (
    <div className={styles.sheetOverlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.sheetHeader}>
          <span className={styles.sheetTitle}>作業日を選択</span>
          <button className={styles.sheetClose} onClick={onClose} aria-label="閉じる"><XIcon /></button>
        </div>
        <div className={styles.datePickerBody}>
          <input
            type="date"
            className={styles.dateInput}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            aria-label="作業日"
          />
          <button
            className={styles.dateConfirmBtn}
            onClick={() => { onSelect(draft); onClose() }}
            disabled={!draft}
          >
            確定
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Time picker ────────────────────────────────────────────────────────────

function TimePickerSheet({
  value,
  onSelect,
  onClose,
}: {
  value: string
  onSelect: (v: string) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState(value)
  return (
    <div className={styles.sheetOverlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.sheetHeader}>
          <span className={styles.sheetTitle}>作業時刻を選択</span>
          <button className={styles.sheetClose} onClick={onClose} aria-label="閉じる"><XIcon /></button>
        </div>
        <div className={styles.datePickerBody}>
          <input
            type="time"
            className={styles.dateInput}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            aria-label="作業時刻"
          />
          <button
            className={styles.dateConfirmBtn}
            onClick={() => { onSelect(draft); onClose() }}
            disabled={!draft}
          >
            確定
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Discard dialog ─────────────────────────────────────────────────────────

function DiscardDialog({ onContinue, onDiscard }: { onContinue: () => void; onDiscard: () => void }) {
  return (
    <div className={styles.dialogOverlay}>
      <div className={styles.dialog}>
        <h3 className={styles.dialogTitle}>入力内容を破棄しますか？</h3>
        <p className={styles.dialogBody}>入力した内容は保存されません。</p>
        <div className={styles.dialogActions}>
          <button className={styles.dialogContinueBtn} onClick={onContinue}>編集を続ける</button>
          <button className={styles.dialogDiscardBtn} onClick={onDiscard}>破棄する</button>
        </div>
      </div>
    </div>
  )
}

// ── Props ──────────────────────────────────────────────────────────────────

interface WorkRecordScreenProps {
  viewState: WorkRecordViewState
  onBack: () => void
  onSuccess: () => void
}

// ── Main component ─────────────────────────────────────────────────────────

export function WorkRecordScreen({ viewState, onBack, onSuccess }: WorkRecordScreenProps) {
  const isLinked = (
    viewState === 'normal-linked-top' ||
    viewState === 'normal-linked-bottom' ||
    viewState === 'saving-draft' ||
    viewState === 'saving' ||
    viewState === 'save-error' ||
    viewState === 'offline' ||
    viewState === 'photo-added' ||
    viewState === 'photo-upload-error' ||
    viewState === 'discard-confirm' ||
    viewState === 'colony-selector' ||
    viewState === 'date-picker' ||
    viewState === 'time-picker'
  )

  const ctx = isLinked ? LINKED_CONTEXT : NEW_CONTEXT

  const isValidationError = viewState === 'validation-error'
  const initWorkType = isValidationError ? null : (ctx.workType ?? null)
  const initColonyId = isValidationError ? null : (ctx.colonyId ?? null)
  const initDate = isValidationError ? '' : (ctx.dueDate ?? '')
  // Only linked states pre-fill the time; new/error states start empty
  const initTime = isLinked && !isValidationError ? '10:30' : ''

  const [workType, setWorkType] = useState<WorkType | null>(initWorkType)
  const [selectedColony, setSelectedColony] = useState<WorkRecordColony | null>(() => {
    if (!initColonyId) return null
    return MOCK_COLONIES.find(c => c.id === initColonyId) ?? null
  })
  const [performedDate, setPerformedDate] = useState(initDate)
  const [performedTime, setPerformedTime] = useState(initTime)
  const [feedType, setFeedType] = useState('砂糖水')
  const [feedAmount, setFeedAmount] = useState(viewState === 'validation-error' ? '' : '1.0')
  const [feedUnit, setFeedUnit] = useState('L')
  const [memo, setMemo] = useState(ctx.initialMemo ?? '')
  const [completeTask, setCompleteTask] = useState(true)
  const [photos, setPhotos] = useState<string[]>(viewState === 'photo-added' ? ['preview-1'] : [])
  const [isDirty, setIsDirty] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const markDirty = useCallback(() => setIsDirty(true), [])

  // Error states
  const initErrors: Record<string, string> = viewState === 'validation-error'
    ? {
        workType: '作業種別を選択してください。',
        colonyId: '対象蜂群を選択してください。',
        performedDate: '作業日を選択してください。',
        performedTime: '作業時刻を選択してください。',
      }
    : {}
  const [errors, setErrors] = useState<Record<string, string>>(initErrors)

  // Overlay states
  const showColonyPicker = viewState === 'colony-selector'
  const showDatePicker = viewState === 'date-picker'
  const showTimePicker = viewState === 'time-picker'
  const showDiscard = viewState === 'discard-confirm'

  const [localColonyPicker, setLocalColonyPicker] = useState(false)
  const [localDatePicker, setLocalDatePicker] = useState(false)
  const [localTimePicker, setLocalTimePicker] = useState(false)
  const [localDiscard, setLocalDiscard] = useState(false)

  const isColonyOpen = showColonyPicker || localColonyPicker
  const isDateOpen = showDatePicker || localDatePicker
  const isTimeOpen = showTimePicker || localTimePicker
  const isDiscardOpen = showDiscard || localDiscard

  const isSaving = viewState === 'saving'
  const isSavingDraft = viewState === 'saving-draft'
  const isOffline = viewState === 'offline'
  const isBusy = isSaving || isSavingDraft

  // special states
  if (viewState === 'loading') {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={onBack} aria-label="戻る"><BackIcon /></button>
          <span className={styles.headerTitle}>作業記録</span>
          <span className={styles.badge}>新規</span>
        </header>
        <div className={styles.loadingBody}>
          <Spinner />
          <p className={styles.loadingText}>作業情報を読み込み中…</p>
        </div>
      </div>
    )
  }

  if (viewState === 'context-missing') {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={onBack} aria-label="戻る"><BackIcon /></button>
          <span className={styles.headerTitle}>作業記録</span>
          <span className={styles.badge}>新規</span>
        </header>
        <div className={styles.errorBody}>
          <h2 className={styles.errorBodyTitle}>タスク情報が見つかりません</h2>
          <p className={styles.errorBodyText}>作業一覧から再度操作してください。</p>
          <button className={styles.errorBackBtn} onClick={onBack}>戻る</button>
        </div>
      </div>
    )
  }

  if (viewState === 'camera-permission-denied') {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={onBack} aria-label="戻る"><BackIcon /></button>
          <span className={styles.headerTitle}>作業記録</span>
          <span className={styles.badge}>新規</span>
        </header>
        <div className={styles.errorBody}>
          <CameraOffIcon />
          <h2 className={styles.errorBodyTitle}>カメラのアクセスが拒否されました</h2>
          <p className={styles.errorBodyText}>設定からカメラへのアクセスを許可してください。</p>
          <button className={styles.errorBackBtn} onClick={onBack}>戻る</button>
        </div>
      </div>
    )
  }

  const handleBack = () => {
    if (isDirty) { setLocalDiscard(true) } else { onBack() }
  }

  const handlePhotoAdd = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (photos.length >= 10) return
    const url = URL.createObjectURL(file)
    setPhotos(prev => [...prev, url])
    markDirty()
    e.target.value = ''
  }

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx))
    markDirty()
  }

  const WORK_TYPES: { id: WorkType; label: string }[] = [
    { id: 'harvest', label: '採蜜' },
    { id: 'feed', label: '給餌' },
    { id: 'treatment', label: '治療' },
    { id: 'swarm', label: '分蜂' },
    { id: 'winter', label: '越冬' },
  ]

  function WorkTypeIcon({ id, active }: { id: WorkType; active: boolean }) {
    if (id === 'harvest') return <HarvestIcon active={active} />
    if (id === 'feed') return <FeedIcon active={active} />
    if (id === 'treatment') return <TreatmentIcon active={active} />
    if (id === 'swarm') return <SwarmIcon active={active} />
    return <WinterIcon active={active} />
  }

  const clearError = (key: string) => {
    setErrors(prev => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  return (
    <div
      className={styles.screen}
      aria-busy={isSaving ? 'true' : undefined}
    >
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={handleBack} aria-label="戻る">
          <BackIcon />
        </button>
        <span className={styles.headerTitle}>作業記録</span>
        <span className={styles.badge}>新規</span>
      </header>

      {/* Banners */}
      {(viewState === 'save-error') && (
        <div className={styles.errorBanner} role="alert">
          <span>作業記録を保存できませんでした。入力内容を確認して再度お試しください。</span>
        </div>
      )}
      {viewState === 'photo-upload-error' && (
        <div className={styles.errorBanner} role="alert">
          <span>写真を追加できませんでした。再度お試しください。</span>
        </div>
      )}
      {isOffline && (
        <div className={styles.offlineBanner} role="status">
          <span>オフラインです。接続後に作業記録を保存してください。</span>
        </div>
      )}

      {/* Linked task card */}
      {ctx.taskId && (
        <div className={styles.linkedCard}>
          <div className={styles.linkedIcon}>
            <LinkIcon />
          </div>
          <div className={styles.linkedText}>
            <span className={styles.linkedTitle}>タスク「{ctx.taskName}」から引き継ぎ</span>
            <span className={styles.linkedSub}>対象蜂群・養蜂場・作業種別を反映しています。</span>
          </div>
          <ChevronRightIcon />
        </div>
      )}

      {/* Scrollable body */}
      <div className={styles.body} data-testid="work-record-body">

        {/* Work type */}
        <div className={styles.section}>
          <div className={styles.labelRow}>
            <span className={styles.label}>作業種別</span>
            <span className={styles.required}>必須</span>
          </div>
          <div className={styles.workTypeTiles} role="group" aria-label="作業種別">
            {WORK_TYPES.map(wt => {
              const active = workType === wt.id
              return (
                <button
                  key={wt.id}
                  type="button"
                  aria-pressed={active}
                  className={`${styles.workTile} ${active ? styles.workTileActive : ''}`}
                  onClick={() => {
                    setWorkType(wt.id)
                    clearError('workType')
                    markDirty()
                  }}
                >
                  <WorkTypeIcon id={wt.id} active={active} />
                  <span className={styles.workTileLabel}>{wt.label}</span>
                </button>
              )
            })}
          </div>
          {errors.workType && <p className={styles.errorText}>{errors.workType}</p>}
        </div>

        {/* Colony */}
        <div className={styles.section}>
          <div className={styles.labelRow}>
            <span className={styles.label}>対象蜂群</span>
            <span className={styles.required}>必須</span>
            <div className={styles.colonyRight}>
              {selectedColony && (
                <span className={styles.colonyChip}>
                  {selectedColony.name}
                  <button
                    className={styles.chipRemove}
                    aria-label={`${selectedColony.name}を削除`}
                    onClick={() => {
                      setSelectedColony(null)
                      clearError('colonyId')
                      markDirty()
                    }}
                  >
                    <CloseIcon />
                  </button>
                </span>
              )}
              <button
                className={styles.addColonyBtn}
                onClick={() => setLocalColonyPicker(true)}
                aria-label="対象蜂群を追加"
              >
                ＋ 追加
              </button>
            </div>
          </div>
          {errors.colonyId && <p className={styles.errorText}>{errors.colonyId}</p>}
        </div>

        {/* Apiary */}
        <div className={styles.apiaryInlineRow}>
          <span className={styles.apiaryInlineLabel}>養蜂場</span>
          <div className={`${styles.apiaryRow} ${selectedColony ? styles.apiaryRowLocked : ''}`}>
            {selectedColony ? (
              <>
                <LockIcon />
                <span className={styles.apiaryValue}>{selectedColony.apiaryName}</span>
                <span className={styles.apiaryAutoLabel}>自動設定</span>
              </>
            ) : (
              <>
                <span className={`${styles.apiaryValue} ${styles.apiaryPlaceholder}`}>養蜂場を選択</span>
                <ChevronDownIcon size={16} />
              </>
            )}
          </div>
        </div>

        {/* Date & time */}
        <div className={styles.section}>
          <div className={styles.labelRow}>
            <span className={styles.label}>作業日時</span>
            <span className={styles.required}>必須</span>
          </div>
          <div className={styles.datetimeRow}>
            <button
              className={`${styles.dateField} ${errors.performedDate ? styles.fieldError : ''}`}
              onClick={() => setLocalDatePicker(true)}
              aria-label="作業日を選択"
            >
              <span className={performedDate ? styles.dateValue : styles.datePlaceholder}>
                {performedDate ? localDateToDisplay(performedDate) : '作業日を選択'}
              </span>
              <CalendarIcon />
            </button>
            <button
              className={`${styles.timeField} ${errors.performedTime ? styles.fieldError : ''}`}
              onClick={() => setLocalTimePicker(true)}
              aria-label="作業時刻を選択"
            >
              <span className={performedTime ? styles.dateValue : styles.datePlaceholder}>
                {performedTime || '時刻'}
              </span>
              <ClockIcon />
            </button>
          </div>
          {(errors.performedDate || errors.performedTime) && (
            <div className={styles.datetimeErrors}>
              <div className={styles.dateErrorCol}>
                {errors.performedDate && <p className={styles.errorText}>{errors.performedDate}</p>}
              </div>
              <div className={styles.timeErrorCol}>
                {errors.performedTime && <p className={styles.errorText}>{errors.performedTime}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Feed-specific fields */}
        {workType === 'feed' && (
          <div className={styles.section}>
            <div className={styles.feedRow}>
              <div className={styles.feedTypeField}>
                <div className={styles.labelRow}>
                  <span className={styles.label}>給餌の種類</span>
                  <span className={styles.required}>必須</span>
                </div>
                <div className={`${styles.selectWrap} ${errors.feedType ? styles.fieldError : ''}`}>
                  <select
                    className={styles.select}
                    value={feedType}
                    onChange={e => { setFeedType(e.target.value); clearError('feedType'); markDirty() }}
                    aria-label="給餌の種類"
                  >
                    {FEED_TYPES.map(ft => <option key={ft} value={ft}>{ft}</option>)}
                  </select>
                  <ChevronDownIcon />
                </div>
                {errors.feedType && <p className={styles.errorText}>{errors.feedType}</p>}
              </div>
              <div className={styles.feedAmountField}>
                <div className={styles.labelRow}>
                  <span className={styles.label}>給餌量</span>
                  <span className={styles.required}>必須</span>
                </div>
                <div className={`${styles.amountWrap} ${errors.feedAmount ? styles.fieldError : ''}`}>
                  <input
                    type="number"
                    className={styles.amountInput}
                    value={feedAmount}
                    min="0.01"
                    step="0.1"
                    onChange={e => { setFeedAmount(e.target.value); clearError('feedAmount'); markDirty() }}
                    aria-label="給餌量"
                  />
                  <div className={styles.unitWrap}>
                    <select
                      className={styles.unitSelect}
                      value={feedUnit}
                      onChange={e => { setFeedUnit(e.target.value); markDirty() }}
                      aria-label="給餌量の単位"
                    >
                      {FEED_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <ChevronDownIcon size={14} />
                  </div>
                </div>
                {errors.feedAmount && <p className={styles.errorText}>{errors.feedAmount}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Memo */}
        <div className={styles.section}>
          <span className={styles.label}>メモ</span>
          <div className={styles.memoWrap}>
            <textarea
              className={styles.textarea}
              value={memo}
              maxLength={200}
              rows={4}
              placeholder="メモを入力（任意）"
              onChange={e => { setMemo(e.target.value); markDirty() }}
              aria-label="メモ"
            />
            <span className={styles.charCount}>{memo.length}/200</span>
          </div>
        </div>

        {/* Photos */}
        <div className={styles.section}>
          <div className={styles.labelRow}>
            <span className={styles.label}>写真</span>
            <span className={styles.optional}>（任意）</span>
          </div>
          <div className={styles.photosGrid}>
            {photos.map((src, idx) => (
              <div key={idx} className={styles.photoThumb}>
                {src.startsWith('blob:') || src.startsWith('preview') ? (
                  <div className={styles.photoPreviewPlaceholder} />
                ) : (
                  <img src={src} alt={`写真${idx + 1}`} className={styles.photoImg} />
                )}
                <button
                  className={styles.photoRemove}
                  aria-label={`写真${idx + 1}を削除`}
                  onClick={() => removePhoto(idx)}
                >
                  <CloseIcon />
                </button>
              </div>
            ))}
            {photos.length < 10 && (
              <button
                className={styles.photoAdd}
                onClick={handlePhotoAdd}
                aria-label="写真を追加"
              >
                <CameraIcon />
                <span className={styles.photoAddLabel}>写真を追加</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.hiddenInput}
            onChange={handleFileChange}
            aria-hidden="true"
          />
        </div>

        {/* Complete source task */}
        {ctx.taskId && (
          <div className={styles.completeRow}>
            <div className={styles.completeText}>
              <span className={styles.completeTitle}>元のタスクを完了にする</span>
              <span className={styles.completeSub}>この作業記録を保存すると、元のタスクは完了になります。</span>
            </div>
            <Switch
              checked={completeTask}
              onChange={(v) => { setCompleteTask(v); markDirty() }}
              disabled={isBusy}
              label="元のタスクを完了にする"
            />
          </div>
        )}

        <div className={styles.bodyEnd} />
      </div>

      {/* Bottom actions */}
      <div className={styles.bottomActions}>
        <div className={styles.actionBtns}>
          <button
            className={styles.draftBtn}
            disabled={isBusy || isOffline}
            onClick={() => { /* window.HoneyDB.saveWorkRecord(...) */ }}
          >
            {isSavingDraft ? '下書き保存中…' : '下書き保存'}
          </button>
          <button
            className={styles.submitBtn}
            disabled={isBusy || isOffline}
            onClick={() => {
              // validation would run here, then window.HoneyDB.saveWorkRecord(...)
              onSuccess()
            }}
          >
            {isSaving ? <><Spinner /><span>保存中…</span></> : '作業記録を保存'}
          </button>
        </div>
        <div className={styles.actionNote}>
          <InfoIcon />
          <span>保存後も編集・削除できます。</span>
        </div>
      </div>

      {/* Overlays */}
      {isColonyOpen && (
        <ColonyPicker
          selectedId={selectedColony?.id ?? null}
          onSelect={(c) => {
            setSelectedColony(c)
            clearError('colonyId')
            setLocalColonyPicker(false)
            markDirty()
          }}
          onClose={() => setLocalColonyPicker(false)}
        />
      )}
      {isDateOpen && (
        <DatePickerSheet
          value={performedDate}
          onSelect={(v) => { setPerformedDate(v); clearError('performedDate') }}
          onClose={() => setLocalDatePicker(false)}
        />
      )}
      {isTimeOpen && (
        <TimePickerSheet
          value={performedTime}
          onSelect={(v) => { setPerformedTime(v); clearError('performedTime') }}
          onClose={() => setLocalTimePicker(false)}
        />
      )}
      {isDiscardOpen && (
        <DiscardDialog
          onContinue={() => setLocalDiscard(false)}
          onDiscard={() => { setLocalDiscard(false); onBack() }}
        />
      )}
    </div>
  )
}
