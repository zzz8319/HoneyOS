import { useState, useRef, useId } from 'react'
import {
  X,
  Calendar,
  AlertCircle,
  WifiOff,
  Info,
  Search,
  Check,
  ChevronDown,
  Lock,
  Plus,
} from 'lucide-react'
import type { TaskCreateViewState, TaskPriority, Colony } from './types'
import { MOCK_COLONIES, AI_CONTEXT, MANUAL_CONTEXT } from './mockData'
import styles from './TaskCreateScreen.module.css'

interface Props {
  viewState: TaskCreateViewState
  onBack: () => void
  onSuccess?: () => void
}

// ── Brain AI icon ────────────────────────────────────────────
// Two brain lobes with a central sulcus and neural sparks

function BrainAiIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#1E3A5F"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Left lobe — rounded organic shape */}
      <path d="M12 6.5C12 6.5 10 5 7.5 5.5C5 6 4 8 4 9.5C4 11 4.8 12.2 6 12.8C4.8 13.5 4 14.8 4 16.2C4 18.3 5.8 20 8 20C9.2 20 10.3 19.5 11 18.7" />
      {/* Right lobe — mirror */}
      <path d="M12 6.5C12 6.5 14 5 16.5 5.5C19 6 20 8 20 9.5C20 11 19.2 12.2 18 12.8C19.2 13.5 20 14.8 20 16.2C20 18.3 18.2 20 16 20C14.8 20 13.7 19.5 13 18.7" />
      {/* Central sulcus (top stem) */}
      <path d="M12 5.5 L12 6.5" strokeWidth="2" />
      {/* Left intra-lobe fissure */}
      <path d="M6.5 10.5 C7.5 10 8.5 10.5 9 11.5" strokeWidth="1.3" />
      <path d="M6.2 14.5 C7 14 8.2 14.5 8.8 15.5" strokeWidth="1.3" />
      {/* Right intra-lobe fissure */}
      <path d="M17.5 10.5 C16.5 10 15.5 10.5 15 11.5" strokeWidth="1.3" />
      <path d="M17.8 14.5 C17 14 15.8 14.5 15.2 15.5" strokeWidth="1.3" />
      {/* Neural spark dots */}
      <circle cx="12" cy="12.5" r="1" fill="#1E3A5F" stroke="none" />
    </svg>
  )
}

function CloseSmIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function ClearIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  )
}

// ── Date helpers ────────────────────────────────────────────

function localDateToDisplay(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return `${y}年${m}月${d}日（${days[date.getDay()]}）`
}

// ── Colony picker ────────────────────────────────────────────

function ColonyPicker({
  selected,
  onSelect,
  onClose,
}: {
  selected: Colony | null
  onSelect: (c: Colony) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')

  const groups = MOCK_COLONIES.reduce<Record<string, Colony[]>>((acc, c) => {
    if (!acc[c.apiaryName]) acc[c.apiaryName] = []
    acc[c.apiaryName].push(c)
    return acc
  }, {})

  const filteredGroups = Object.entries(groups).reduce<Record<string, Colony[]>>(
    (acc, [apiaryName, colonies]) => {
      const f = colonies.filter(c => c.name.includes(query) || apiaryName.includes(query))
      if (f.length) acc[apiaryName] = f
      return acc
    },
    {},
  )

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.sheetHandle} />
        <div className={styles.sheetHeader}>
          <button className={styles.sheetCloseBtn} onClick={onClose} aria-label="蜂群選択を閉じる">
            <CloseSmIcon />
          </button>
          <span className={styles.sheetTitle}>蜂群を選択</span>
          <div style={{ width: 32 }} />
        </div>
        <div className={styles.sheetSearch}>
          <Search size={15} color="var(--color-text-secondary, #66707A)" />
          <input
            className={styles.sheetSearchInput}
            placeholder="蜂群番号で検索"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="蜂群番号で検索"
          />
        </div>
        <div className={styles.sheetList}>
          {Object.entries(filteredGroups).map(([apiaryName, colonies]) => (
            <div key={apiaryName}>
              <div className={styles.sheetGroupLabel}>{apiaryName}</div>
              {colonies.map(c => (
                <button
                  key={c.id}
                  className={`${styles.sheetItem} ${selected?.id === c.id ? styles.sheetItemSelected : ''}`}
                  onClick={() => { onSelect(c); onClose() }}
                >
                  <span className={styles.sheetItemCheck}>
                    {selected?.id === c.id
                      ? <Check size={16} color="var(--color-primary, #E39A16)" />
                      : <span style={{ width: 16, display: 'inline-block' }} />}
                  </span>
                  {c.name}
                  <span style={{ fontSize: 11, color: 'var(--color-text-secondary, #66707A)', marginLeft: 4 }}>
                    {apiaryName}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Discard dialog ───────────────────────────────────────────

function DiscardDialog({
  onKeep,
  onDiscard,
}: {
  onKeep: () => void
  onDiscard: () => void
}) {
  return (
    <div className={styles.dialogOverlay}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="discard-title">
        <div className={styles.dialogBody}>
          <p className={styles.dialogTitle} id="discard-title">入力内容を破棄しますか？</p>
          <p className={styles.dialogDesc}>入力した内容は保存されません。</p>
        </div>
        <div className={styles.dialogActions}>
          <button className={styles.dialogCancelBtn} onClick={onKeep}>編集を続ける</button>
          <button className={styles.dialogDiscardBtn} onClick={onDiscard}>破棄する</button>
        </div>
      </div>
    </div>
  )
}

// ── iOS Switch ───────────────────────────────────────────────

function Switch({
  checked,
  onChange,
  disabled,
  id,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  id?: string
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      className={styles.switchBtn}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      type="button"
    >
      <span className={`${styles.switchTrack} ${checked ? styles.switchTrackOn : ''}`} />
      <span className={`${styles.switchKnob} ${checked ? styles.switchKnobOn : ''}`} />
    </button>
  )
}

// ── Header ───────────────────────────────────────────────────

function Header({ onClose }: { onClose: () => void }) {
  return (
    <div className={styles.header}>
      <div className={styles.headerRow}>
        <div className={styles.headerSide}>
          <button className={styles.iconBtn} onClick={onClose} aria-label="閉じる">
            <X size={20} />
          </button>
        </div>
        <span className={styles.headerTitle}>タスク作成</span>
        <div className={styles.headerSide} />
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────

export function TaskCreateScreen({ viewState, onBack, onSuccess }: Props) {
  // validation-error uses empty values (manual context) to show empty-field errors
  const isAi = (
    viewState === 'normal-ai' ||
    viewState === 'date-picker' ||
    viewState === 'colony-picker' ||
    viewState === 'discard-dialog' ||
    viewState === 'submit-error' ||
    viewState === 'submitting' ||
    viewState === 'offline'
  )
  const ctx = isAi ? AI_CONTEXT : MANUAL_CONTEXT

  const titleId = useId()
  const dueDateId = useId()
  const titleErrId = useId()
  const dueDateErrId = useId()

  const [showAiCard, setShowAiCard] = useState(ctx.source === 'ai-recommendation')
  const [linkedRecommendationId, setLinkedRecommendationId] = useState(ctx.recommendationId)

  // Form state — validation-error starts empty; all others from context
  const [title, setTitle] = useState(
    viewState === 'validation-error' ? '' : (ctx.initialTitle ?? ''),
  )
  const [dueDate, setDueDate] = useState(
    viewState === 'validation-error' ? '' : (ctx.initialDueDate ?? ''),
  )
  const [priority, setPriority] = useState<TaskPriority>(ctx.initialPriority ?? 'high')
  const [selectedColony, setSelectedColony] = useState<Colony | null>(() => {
    if (viewState === 'validation-error' || !ctx.colonyId) return null
    return MOCK_COLONIES.find(c => c.id === ctx.colonyId) ?? null
  })
  const [memo, setMemo] = useState(
    viewState === 'validation-error' ? '' : (ctx.initialMemo ?? ''),
  )
  const [reminderOn, setReminderOn] = useState(true)

  // UI overlays — initialise from viewState for snapshot testing
  const [showColonyPicker, setShowColonyPicker] = useState(viewState === 'colony-picker')
  const [showDatePicker, setShowDatePicker] = useState(viewState === 'date-picker')
  const [showDiscardDialog, setShowDiscardDialog] = useState(viewState === 'discard-dialog')

  // Validation errors — only shown when fields are actually empty
  const [titleError, setTitleError] = useState(
    viewState === 'validation-error' ? 'タイトルを入力してください。' : '',
  )
  const [dueDateError, setDueDateError] = useState(
    viewState === 'validation-error' ? '期限日を選択してください。' : '',
  )

  const isSubmitting = viewState === 'submitting'
  const isOffline = viewState === 'offline'
  const hasSubmitError = viewState === 'submit-error'
  const disabled = isSubmitting || isOffline

  const isDirty = useRef(false)

  const handleTitleChange = (v: string) => {
    isDirty.current = true
    setTitle(v)
    if (titleError && v.trim()) setTitleError('')
  }

  const handleDueDateChange = (v: string) => {
    isDirty.current = true
    setDueDate(v)
    if (dueDateError && v) setDueDateError('')
  }

  const handleClose = () => {
    if (isDirty.current) {
      setShowDiscardDialog(true)
    } else {
      onBack()
    }
  }

  const handleDiscard = () => {
    setShowDiscardDialog(false)
    onBack()
  }

  const handleSubmit = () => {
    let valid = true
    if (!title.trim()) { setTitleError('タイトルを入力してください。'); valid = false }
    if (!dueDate) { setDueDateError('期限日を選択してください。'); valid = false }
    if (!valid) return

    // [DEV] In production: call window.HoneyDB.createTask(payload)
    const _payload = {
      title: title.trim(),
      dueDate,
      priority,
      colonyId: selectedColony?.id ?? null,
      apiaryId: selectedColony?.apiaryId ?? null,
      memo,
      reminderEnabled: reminderOn,
      source: ctx.source,
      recommendationId: linkedRecommendationId,
      diagnosisResultId: ctx.diagnosisResultId,
      inspectionId: ctx.inspectionId,
    }
    void _payload
    onSuccess?.()
  }

  const isFormValid = title.trim().length > 0 && dueDate.length > 0

  // ── Full-screen states ──────────────────────────────────────

  if (viewState === 'loading') {
    return (
      <div className={styles.screen}>
        <Header onClose={onBack} />
        <div className={styles.stateBody}>
          <div className={styles.spinner} />
          <p className={styles.stateDesc}>タスク情報を読み込み中…</p>
        </div>
      </div>
    )
  }

  if (viewState === 'context-missing') {
    return (
      <div className={styles.screen}>
        <Header onClose={onBack} />
        <div className={styles.stateBody}>
          <AlertCircle size={40} className={styles.stateIcon} />
          <p className={styles.stateTitle}>推奨作業が見つかりません</p>
          <p className={styles.stateDesc}>診断結果から再度操作してください。</p>
          <button className={styles.retryBtn} onClick={onBack}>戻る</button>
        </div>
      </div>
    )
  }

  // ── Normal / form states ────────────────────────────────────

  return (
    <div
      className={styles.screen}
      aria-busy={isSubmitting}
    >
      {/* Fixed header */}
      <Header onClose={handleClose} />

      {/* Fixed banners (shrink body, never push footer) */}
      {hasSubmitError && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={16} className={styles.errorBannerIcon} />
          <span className={styles.errorBannerText}>
            タスクを作成できませんでした。入力内容を確認して再度お試しください。
          </span>
        </div>
      )}
      {isOffline && (
        <div className={styles.offlineBanner} role="status">
          <WifiOff size={15} />
          オフラインです。接続後にタスクを作成してください。
        </div>
      )}

      {/* AI card (outside scroll, shrinks body) */}
      {showAiCard && ctx.source === 'ai-recommendation' && (
        <div className={styles.aiCard}>
          <div className={styles.aiCardLeft}>
            <span className={styles.aiCardIcon}>
              <BrainAiIcon size={22} />
            </span>
            <div className={styles.aiCardTexts}>
              <div className={styles.aiCardTitle}>AI推奨から作成</div>
              <div className={styles.aiCardSub}>24時間以内に再確認（A-03）</div>
            </div>
          </div>
          <div className={styles.aiCardRight}>
            <button
              className={styles.aiCardDeleteBtn}
              onClick={() => { setShowAiCard(false); setLinkedRecommendationId(undefined) }}
              aria-label="AI推奨との関連付けを解除"
            >
              削除
            </button>
            <button
              className={styles.aiCardCloseBtn}
              onClick={() => { setShowAiCard(false); setLinkedRecommendationId(undefined) }}
              aria-label="AI推奨カードを閉じる"
            >
              <CloseSmIcon />
            </button>
          </div>
        </div>
      )}

      {/* Scrollable body — flex: 1 1 auto; min-height: 0 */}
      <div className={styles.body}>

        {/* タイトル */}
        <div className={styles.formSection}>
          <div className={styles.labelRow}>
            <label className={styles.label} htmlFor={titleId}>タイトル</label>
            <span className={styles.required}>必須</span>
          </div>
          <div className={`${styles.inputWrap} ${titleError ? styles.inputWrapError : ''}`}>
            <input
              id={titleId}
              className={styles.textInput}
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="タイトルを入力"
              maxLength={100}
              required
              aria-required="true"
              aria-describedby={titleError ? titleErrId : undefined}
              aria-invalid={!!titleError}
              disabled={disabled}
            />
            {title && (
              <button
                className={styles.clearBtn}
                onClick={() => handleTitleChange('')}
                aria-label="タイトルをクリア"
                type="button"
                disabled={disabled}
              >
                <ClearIcon />
              </button>
            )}
          </div>
          {titleError && <p id={titleErrId} className={styles.fieldError} role="alert">{titleError}</p>}
        </div>

        <div className={styles.divider} />

        {/* 期限日 */}
        <div className={styles.formSection}>
          <div className={styles.labelRow}>
            <label className={styles.label} htmlFor={dueDateId}>期限日</label>
            <span className={styles.required}>必須</span>
          </div>
          <div className={`${styles.dateRow} ${dueDateError ? styles.dateRowError : ''}`}>
            <span className={`${styles.dateText} ${!dueDate ? styles.datePlaceholder : ''}`}>
              {dueDate ? localDateToDisplay(dueDate) : '日付を選択'}
            </span>
            <Calendar size={18} color="var(--color-text-secondary, #66707A)" />
            <input
              id={dueDateId}
              type="date"
              className={styles.dateNativeInput}
              value={dueDate}
              onChange={e => handleDueDateChange(e.target.value)}
              required
              aria-required="true"
              aria-describedby={dueDateError ? dueDateErrId : undefined}
              aria-invalid={!!dueDateError}
              aria-label="期限日を選択"
              disabled={disabled}
              onClick={() => setShowDatePicker(true)}
            />
          </div>
          {dueDateError && <p id={dueDateErrId} className={styles.fieldError} role="alert">{dueDateError}</p>}
        </div>

        <div className={styles.divider} />

        {/* 優先度 */}
        <div className={styles.formSection}>
          <div className={styles.labelRow}>
            <span className={styles.label}>優先度</span>
            <span className={styles.required}>必須</span>
          </div>
          <div className={styles.prioritySegment} role="group" aria-label="優先度">
            {(['high', 'medium', 'low'] as TaskPriority[]).map((p) => {
              const label = p === 'high' ? '高' : p === 'medium' ? '中' : '低'
              const cls = p === 'high' ? styles.priorityBtnHigh : p === 'medium' ? styles.priorityBtnMid : styles.priorityBtnLow
              return (
                <button
                  key={p}
                  type="button"
                  className={`${styles.priorityBtn} ${cls}`}
                  aria-pressed={priority === p}
                  onClick={() => setPriority(p)}
                  disabled={disabled}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <div className={styles.divider} />

        {/* 対象蜂群 */}
        <div className={styles.formSection}>
          <div className={styles.labelRow}>
            <span className={styles.label}>対象蜂群</span>
          </div>
          <div className={styles.colonyRow}>
            {selectedColony && (
              <span className={styles.colonyChip}>
                {selectedColony.name}
                <button
                  className={styles.colonyChipRemove}
                  onClick={() => setSelectedColony(null)}
                  aria-label={`${selectedColony.name}を削除`}
                  type="button"
                  disabled={disabled}
                >
                  <CloseSmIcon />
                </button>
              </span>
            )}
            <button
              className={styles.addColonyBtn}
              type="button"
              onClick={() => setShowColonyPicker(true)}
              aria-label="蜂群を追加"
              disabled={disabled}
            >
              <Plus size={13} />
              追加
            </button>
          </div>
        </div>

        <div className={styles.divider} />

        {/* 養蜂場 — 横並びレイアウト */}
        <div className={styles.apiaryInlineRow}>
          <span className={styles.apiaryInlineLabel}>養蜂場</span>
          <div className={`${styles.apiaryRow} ${selectedColony ? styles.apiaryRowLocked : ''}`}>
            {selectedColony ? (
              <>
                <Lock size={14} color="var(--color-text-secondary, #66707A)" />
                <span className={styles.apiaryValue}>{selectedColony.apiaryName}</span>
                <span className={styles.apiaryAutoLabel}>自動設定</span>
              </>
            ) : (
              <>
                <span className={`${styles.apiaryValue} ${styles.apiaryPlaceholder}`}>養蜂場を選択</span>
                <ChevronDown size={16} color="var(--color-text-secondary, #66707A)" />
              </>
            )}
          </div>
        </div>

        <div className={styles.divider} />

        {/* メモ */}
        <div className={styles.formSection}>
          <div className={styles.labelRow}>
            <span className={styles.label}>メモ</span>
          </div>
          <div className={styles.textareaWrap}>
            <textarea
              className={styles.textarea}
              value={memo}
              onChange={e => {
                isDirty.current = true
                if (e.target.value.length <= 200) setMemo(e.target.value)
              }}
              maxLength={200}
              placeholder="メモを入力（任意）"
              aria-label="メモ"
              disabled={disabled}
            />
            <div className={styles.charCount}>{memo.length}/200</div>
          </div>
        </div>

        <div className={styles.divider} />

        {/* リマインダー */}
        <div className={styles.formSection}>
          <div className={styles.reminderRow}>
            <div className={styles.reminderTexts}>
              <div className={styles.reminderTitle}>リマインダー</div>
              <div className={styles.reminderSub}>期限日の前日に通知します。</div>
            </div>
            <Switch
              checked={reminderOn}
              onChange={setReminderOn}
              disabled={disabled}
              id="reminder-switch"
            />
          </div>
        </div>

        {/* v1.0 info card */}
        <div className={styles.infoCard}>
          <Info size={15} className={styles.infoCardIcon} />
          <span className={styles.infoCardText}>v1.0では単発タスクのみ作成できます。</span>
        </div>

        {/* spacer so infoCard clears the fixed footer */}
        <div className={styles.bodyEnd} />

      </div>

      {/* Fixed footer — always visible, never pushed off screen */}
      <div className={styles.bottomActions}>
        <button
          className={styles.cancelBtn}
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          キャンセル
        </button>
        <button
          className={styles.submitBtn}
          type="button"
          onClick={handleSubmit}
          disabled={!isFormValid || disabled}
        >
          {isSubmitting
            ? <><span className={styles.spinnerSmall} />作成中…</>
            : 'タスクを作成'}
        </button>
      </div>

      {/* Overlays */}
      {showColonyPicker && (
        <ColonyPicker
          selected={selectedColony}
          onSelect={c => { setSelectedColony(c); isDirty.current = true }}
          onClose={() => setShowColonyPicker(false)}
        />
      )}

      {showDatePicker && (
        <div className={styles.dialogOverlay} onClick={() => setShowDatePicker(false)}>
          <div className={styles.dialog} onClick={e => e.stopPropagation()}>
            <div className={styles.dialogBody}>
              <p className={styles.dialogTitle}>期限日を選択</p>
              <input
                type="date"
                value={dueDate}
                onChange={e => { handleDueDateChange(e.target.value); setShowDatePicker(false) }}
                style={{ fontSize: 16, padding: 8, borderRadius: 8, border: '1px solid #E3E5E8', width: '100%', boxSizing: 'border-box' }}
                aria-label="期限日を選択"
              />
            </div>
            <div className={styles.dialogActions}>
              <button className={styles.dialogCancelBtn} style={{ flex: 1, borderRight: 'none' }} onClick={() => setShowDatePicker(false)}>閉じる</button>
            </div>
          </div>
        </div>
      )}

      {showDiscardDialog && (
        <DiscardDialog
          onKeep={() => setShowDiscardDialog(false)}
          onDiscard={handleDiscard}
        />
      )}
    </div>
  )
}
