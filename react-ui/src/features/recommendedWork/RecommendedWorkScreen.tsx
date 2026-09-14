import { useState } from 'react'
import type { RecommendedWorkState, RecommendedWorkItem, DiagnosisFinding } from './types'
import { MOCK_RECOMMENDED_WORK_DATA } from './mockData'
import styles from './RecommendedWorkScreen.module.css'

interface Props {
  viewState: RecommendedWorkState
  onBack: () => void
  onAddToTask?: (workId: string) => void
  onRecord?: (workId: string) => void
  onCreateTasks?: (selectedIds: string[]) => void
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function AlertCircleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 6v5M10 13.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

function CheckCircleFilledIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="#E39A16"/>
      <path d="M5.5 10l3 3 5.5-5.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function CircleOutlineIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="9" stroke="#D1D5DB" strokeWidth="1.5"/>
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M8 7v5M8 5.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

function WifiOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M8 12a0.8 0.8 0 110 1.6A0.8 0.8 0 018 12z" fill="currentColor"/>
      <path d="M3.2 7.2a7 7 0 012.5-1.6M10.3 5.6a7 7 0 012.5 1.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M5 10a3.5 3.5 0 013-1.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function TaskAddIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="2" y="1.5" width="9" height="11" rx="1.3" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M4 6.5l2 2 2.5-2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 4h5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M12 9v4M10 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

function WorkRecordIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="2" y="1.5" width="11" height="12" rx="1.3" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M4.5 5.5h6M4.5 8h6M4.5 10.5h3.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────

function ScreenHeader({ colonyLabel, onBack }: { colonyLabel: string; onBack: () => void }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerRow}>
        <button className={styles.iconBtn} onClick={onBack} aria-label="戻る">
          <BackIcon/>
        </button>
        <div className={styles.headerTitles}>
          <div className={styles.headerTitle}>推奨作業</div>
          <div className={styles.headerSubtitle}>{colonyLabel}・AI診断結果から作成</div>
        </div>
        <div style={{ width: 44 }} aria-hidden="true"/>
      </div>
    </header>
  )
}

// ── Diagnosis summary ─────────────────────────────────────────────────────────

function DiagnosisSummary({ findings }: { findings: DiagnosisFinding[] }) {
  return (
    <div className={styles.diagnosisSummary}>
      {findings.map((f, i) => (
        <div key={f.title} className={styles.diagnosisFindingWrap}>
          {i > 0 && <div className={styles.diagnosisDivider}/>}
          <div className={styles.diagnosisFinding}>
            <div className={styles.findingTop}>
              <span className={f.severity === 'danger' ? styles.findingIconDanger : styles.findingIconWarn}>
                <AlertCircleIcon size={13}/>
              </span>
              <span className={styles.findingTitle}>{f.title}</span>
            </div>
            <div className={f.severity === 'danger' ? styles.findingConfidenceDanger : styles.findingConfidenceWarn}>
              {f.confidence}%
            </div>
            <p className={styles.findingDesc}>{f.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Work card ─────────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: 1 | 2 | 3 }) {
  const cls = priority === 1
    ? styles.priorityBadge1
    : priority === 2
    ? styles.priorityBadge2
    : styles.priorityBadge3
  return <span className={cls}>{priority}</span>
}

function WorkCard({
  item,
  selected,
  disabled,
  onToggle,
  onAddToTask,
  onRecord,
}: {
  item: RecommendedWorkItem
  selected: boolean
  disabled: boolean
  onToggle: () => void
  onAddToTask: (e: React.MouseEvent) => void
  onRecord: (e: React.MouseEvent) => void
}) {
  return (
    <div
      className={selected ? `${styles.workCard} ${styles.workCardSelected}` : styles.workCard}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`${item.title}を${selected ? '選択解除' : '選択'}`}
      onClick={disabled ? undefined : onToggle}
      onKeyDown={(e) => {
        if (disabled) return
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() }
      }}
    >
      <div className={styles.cardTop}>
        <span className={styles.selectCircle} aria-hidden="true">
          {selected ? <CheckCircleFilledIcon/> : <CircleOutlineIcon/>}
        </span>
        <div className={styles.cardMeta}>
          <div className={styles.cardTitleRow}>
            <PriorityBadge priority={item.priority}/>
            <span className={styles.cardTitle}>{item.title}</span>
          </div>
          <p className={styles.cardDesc}>{item.description}</p>
          <div className={styles.tagRow}>
            {item.tags.map((t) => (
              <span
                key={t.label}
                className={
                  t.variant === 'danger' ? styles.tagDanger
                  : t.variant === 'warn' ? styles.tagWarn
                  : styles.tagNeutral
                }
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.cardActions}>
        <button
          className={styles.cardActionBtn}
          disabled={disabled}
          onClick={onAddToTask}
          aria-label={`${item.title}をタスクに追加`}
        >
          <TaskAddIcon/>
          タスクに追加
        </button>
        <button
          className={styles.cardActionBtn}
          disabled={disabled}
          onClick={onRecord}
          aria-label={`${item.title}の作業記録を残す`}
        >
          <WorkRecordIcon/>
          作業記録を残す
        </button>
      </div>
    </div>
  )
}

// ── Full-screen state views ────────────────────────────────────────────────────

function StateScreen({ onBack, children }: { onBack: () => void; children: React.ReactNode }) {
  return (
    <div className={styles.stateScreen}>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <button className={styles.iconBtn} onClick={onBack} aria-label="戻る">
            <BackIcon/>
          </button>
          <div className={styles.headerTitles}>
            <div className={styles.headerTitle}>推奨作業</div>
          </div>
          <div style={{ width: 44 }} aria-hidden="true"/>
        </div>
      </header>
      <div className={styles.stateBody}>{children}</div>
    </div>
  )
}

function LoadingState({ onBack }: { onBack: () => void }) {
  return (
    <StateScreen onBack={onBack}>
      <div className={styles.spinner} aria-hidden="true"/>
      <p className={styles.stateDesc}>推奨作業を読み込み中…</p>
    </StateScreen>
  )
}

function ContextMissingState({ onBack }: { onBack: () => void }) {
  return (
    <StateScreen onBack={onBack}>
      <span className={styles.stateIcon}><AlertCircleIcon size={40}/></span>
      <p className={styles.stateTitle}>診断結果が見つかりません</p>
      <p className={styles.stateDesc}>AI診断結果から再度お試しください。</p>
      <button className={styles.retryBtn} onClick={onBack}>戻る</button>
    </StateScreen>
  )
}

function ErrorState({
  onBack,
  onRetry,
  isRetrying,
}: {
  onBack: () => void
  onRetry: () => void
  isRetrying: boolean
}) {
  return (
    <StateScreen onBack={onBack}>
      <span className={styles.stateIcon}><AlertCircleIcon size={40}/></span>
      <p className={styles.stateTitle}>推奨作業を取得できませんでした</p>
      <p className={styles.stateDesc}>ネットワーク接続を確認してから再度お試しください。</p>
      <div className={styles.stateActions}>
        <button
          className={styles.retryBtn}
          onClick={onRetry}
          disabled={isRetrying}
          aria-busy={isRetrying}
        >
          {isRetrying ? '再試行中…' : '再試行'}
        </button>
        <button className={styles.backLinkBtn} onClick={onBack}>戻る</button>
      </div>
    </StateScreen>
  )
}

function OfflineNoCacheState({ onBack }: { onBack: () => void }) {
  return (
    <StateScreen onBack={onBack}>
      <span className={styles.stateIcon}><WifiOffIcon/></span>
      <p className={styles.stateTitle}>保存済みの推奨作業がありません</p>
      <p className={styles.stateDesc}>オンライン時に診断結果を保存しておくと、オフラインでも確認できます。</p>
      <button className={styles.retryBtn} onClick={onBack}>戻る</button>
    </StateScreen>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function RecommendedWorkScreen({
  viewState,
  onBack,
  onAddToTask,
  onRecord,
  onCreateTasks,
}: Props) {
  const data = MOCK_RECOMMENDED_WORK_DATA

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    if (viewState === 'none-selected') return new Set()
    if (viewState === 'multi-selected') return new Set(data.items.map((i) => i.id))
    return new Set(['work-1'])
  })

  const [isRetrying, setIsRetrying] = useState(false)
  const [isCreating, setIsCreating] = useState<boolean>(() => viewState === 'creating-tasks')

  const isOffline = viewState === 'offline'
  const isDisabled = isCreating

  function toggleWork(id: string) {
    if (isDisabled) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function clearAll() {
    if (isDisabled) return
    setSelectedIds(new Set())
  }

  function handleRetry() {
    if (isRetrying) return
    setIsRetrying(true)
    console.log('[SCR-023] 推奨作業再取得リクエスト（未接続）')
    setTimeout(() => setIsRetrying(false), 2000)
  }

  function handleCreateTasks() {
    if (selectedIds.size === 0 || isCreating) return
    setIsCreating(true)
    console.log('[SCR-023] タスク作成リクエスト（未接続）', [...selectedIds])
    onCreateTasks?.([...selectedIds])
  }

  if (viewState === 'loading') return <LoadingState onBack={onBack}/>
  if (viewState === 'context-missing') return <ContextMissingState onBack={onBack}/>
  if (viewState === 'error') return <ErrorState onBack={onBack} onRetry={handleRetry} isRetrying={isRetrying}/>
  if (viewState === 'offline-no-cache') return <OfflineNoCacheState onBack={onBack}/>

  const hasSelection = selectedIds.size > 0

  return (
    <div className={styles.screen} aria-busy={isCreating}>
      <ScreenHeader colonyLabel={data.colonyLabel} onBack={onBack}/>

      {isOffline && (
        <div className={styles.offlineBanner} role="status">
          <WifiOffIcon/>
          オフライン — 保存済みの推奨作業を表示しています
        </div>
      )}

      <div className={styles.content}>
        <DiagnosisSummary findings={data.findings}/>

        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>おすすめの対応</h2>
          <button
            className={styles.clearBtn}
            onClick={clearAll}
            disabled={isDisabled}
            aria-label="すべての選択を解除"
          >
            選択の解除
          </button>
        </div>

        <div className={styles.workList}>
          {data.items.map((item) => (
            <WorkCard
              key={item.id}
              item={item}
              selected={selectedIds.has(item.id)}
              disabled={isDisabled}
              onToggle={() => toggleWork(item.id)}
              onAddToTask={(e) => {
                e.stopPropagation()
                console.log('[SCR-023] タスクに追加:', item.id, '（未接続）')
                onAddToTask?.(item.id)
              }}
              onRecord={(e) => {
                e.stopPropagation()
                console.log('[SCR-023] 作業記録を残す:', item.id, '（未接続）')
                onRecord?.(item.id)
              }}
            />
          ))}
        </div>

        <div className={styles.disclaimer}>
          <span className={styles.disclaimerIcon}><InfoIcon/></span>
          <p className={styles.disclaimerText}>推奨内容は補助情報です。実施前に状態を確認してください。</p>
        </div>

        <div className={styles.actionArea}>
          <button
            className={styles.primaryBtn}
            onClick={handleCreateTasks}
            disabled={!hasSelection || isCreating}
            aria-label={isCreating ? 'タスクを作成中' : '選択した内容でタスク作成'}
            aria-busy={isCreating}
          >
            {isCreating ? (
              <>
                <span className={styles.spinnerSmall} aria-hidden="true"/>
                タスクを作成中…
              </>
            ) : (
              '選択した内容でタスク作成'
            )}
          </button>
          <button className={styles.returnLink} onClick={onBack}>
            <ChevronLeftIcon/>
            診断結果に戻る
          </button>
        </div>
      </div>
    </div>
  )
}
