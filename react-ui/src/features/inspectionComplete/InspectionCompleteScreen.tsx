import { useState } from 'react'
import { HiveBeeMark } from '../../components/icons/HiveBeeMark'
import { QueenMark } from '../../components/icons/QueenMark'
import type { CompleteViewState, ComparisonMetric, InspectionCompleteData } from './types'
import { getMockData } from './mockData'
import styles from './InspectionCompleteScreen.module.css'

export type { CompleteViewState }

// ── Inline SVG icons ─────────────────────────────────────────────────────────

function CheckSvg() {
  return (
    <svg className={styles.checkSvg} viewBox="0 0 24 24" aria-hidden="true">
      <polyline points="5,12 10,17 19,8" />
    </svg>
  )
}

function WarnTriangle() {
  return (
    <svg className={styles.warnTriangle} viewBox="0 0 18 18" aria-hidden="true">
      <path d="M9 2L16.5 15.5H1.5L9 2z" strokeLinejoin="round" />
      <line x1="9" y1="7" x2="9" y2="11" />
      <circle cx="9" cy="13" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

function ChevronRight({ cls }: { cls?: string }) {
  return (
    <svg className={cls ?? styles.warnChevron} viewBox="0 0 16 16" aria-hidden="true">
      <polyline points="6,4 10,8 6,12" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg className={styles.sunIcon} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" />
      <line x1="12" y1="3"   x2="12" y2="5"   />
      <line x1="12" y1="19"  x2="12" y2="21"  />
      <line x1="3"  y1="12"  x2="5"  y2="12"  />
      <line x1="19" y1="12"  x2="21" y2="12"  />
      <line x1="5.6"  y1="5.6"  x2="7"   y2="7"   />
      <line x1="17"   y1="17"   x2="18.4" y2="18.4"/>
      <line x1="17"   y1="5.6"  x2="18.4" y2="7"   />
      <line x1="5.6"  y1="17"   x2="7"   y2="18.4" />
    </svg>
  )
}

function HiveIcon() {
  return (
    <svg className={styles.hiveIcon} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2"  y="7"  width="20" height="4.5" rx="1" />
      <rect x="2"  y="13" width="20" height="4.5" rx="1" />
      <line x1="7"  y1="7"  x2="7"  y2="17.5" />
      <line x1="12" y1="7"  x2="12" y2="17.5" />
      <line x1="17" y1="7"  x2="17" y2="17.5" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className={styles.calIcon} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="3"  y1="10" x2="21" y2="10" />
      <line x1="8"  y1="3"  x2="8"  y2="7"  />
      <line x1="16" y1="3"  x2="16" y2="7"  />
    </svg>
  )
}

// AI chip/circuit icon — square chip with pins on sides
function AiChipIcon() {
  return (
    <svg className={styles.aiChipIcon} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      {/* left pins */}
      <line x1="7" y1="9.5"  x2="4" y2="9.5"  />
      <line x1="7" y1="12"   x2="4" y2="12"   />
      <line x1="7" y1="14.5" x2="4" y2="14.5" />
      {/* right pins */}
      <line x1="17" y1="9.5"  x2="20" y2="9.5"  />
      <line x1="17" y1="12"   x2="20" y2="12"   />
      <line x1="17" y1="14.5" x2="20" y2="14.5" />
      {/* top pins */}
      <line x1="9.5"  y1="7" x2="9.5"  y2="4" />
      <line x1="14.5" y1="7" x2="14.5" y2="4" />
      {/* bottom pins */}
      <line x1="9.5"  y1="17" x2="9.5"  y2="20" />
      <line x1="14.5" y1="17" x2="14.5" y2="20" />
      {/* inner cross */}
      <line x1="10" y1="12" x2="14" y2="12" />
      <line x1="12" y1="10" x2="12" y2="14" />
    </svg>
  )
}

function WifiOffIcon() {
  return (
    <svg className={styles.stateIconSvg} viewBox="0 0 48 48" aria-hidden="true">
      <line x1="4" y1="4" x2="44" y2="44" strokeWidth="2.5" />
      <path d="M8 18 A22 22 0 0 1 36 10" />
      <path d="M12 24 A16 16 0 0 1 30 19" />
      <path d="M18 30 A8 8 0 0 1 28 27" />
      <circle cx="24" cy="36" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

function AlertCircleIcon() {
  return (
    <svg className={styles.stateIconSvg} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="20" strokeWidth="2.5" />
      <line x1="24" y1="14" x2="24" y2="26" strokeWidth="2.5" />
      <circle cx="24" cy="32" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

// Metric row icons (18×18 visible area)
function MetricIcon({ type }: { type: 'bee' | 'brood' | 'honey' | 'strength' }) {
  const BASE = {
    width: 18, height: 18, viewBox: '0 0 18 18', fill: 'none',
    strokeWidth: 1.8, strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const, 'aria-hidden': true as const,
  }
  if (type === 'bee') return <HiveBeeMark size={18} color="var(--color-text-secondary)" />
  if (type === 'strength') {
    return (
      <svg {...BASE} stroke="var(--color-text-secondary)">
        <rect x="1.5" y="10" width="3.5" height="6.5" rx="0.5" />
        <rect x="7"   y="6"  width="3.5" height="10.5" rx="0.5" />
        <rect x="12.5" y="2" width="3.5" height="14.5" rx="0.5" />
      </svg>
    )
  }
  if (type === 'brood') {
    return (
      <svg {...BASE} stroke="#DC2626">
        <ellipse cx="9" cy="9" rx="5.5" ry="7" />
        <line x1="5.5" y1="6.5"  x2="12.5" y2="6.5"  />
        <line x1="5.5" y1="9"    x2="12.5" y2="9"    />
        <line x1="5.5" y1="11.5" x2="12.5" y2="11.5" />
      </svg>
    )
  }
  // honey
  return (
    <svg {...BASE} stroke="#D97706">
      <path d="M9 2 C5 2 2.5 5.5 2.5 9.5 C2.5 13.5 5.5 16 9 16 C12.5 16 15.5 13.5 15.5 9.5 C15.5 5.5 13 2 9 2Z" />
      <path d="M5.5 10 C5.5 7.5 7 6.5 9 6.5 C11 6.5 12.5 7.5 12.5 10" />
    </svg>
  )
}

// ── Loading / Error / Offline screens ────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className={styles.screen}>
      <div className={styles.stateCenter}>
        <div className={styles.spinner} aria-label="保存中" role="status" />
        <p className={styles.stateMsg}>保存中…</p>
      </div>
    </div>
  )
}

function ErrorScreen({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className={styles.screen}>
      <div className={styles.stateCenter}>
        <AlertCircleIcon />
        <p className={styles.stateTitle}>保存に失敗しました</p>
        <p className={styles.stateMsg}>ネットワークエラーが発生しました。<br />再度お試しください。</p>
        <button className={styles.retryBtn} onClick={onRetry}>再試行</button>
      </div>
    </div>
  )
}

function OfflineScreen({ onDashboard }: { onDashboard?: () => void }) {
  return (
    <div className={styles.screen}>
      <div className={styles.stateCenter}>
        <WifiOffIcon />
        <p className={styles.stateTitle}>オフライン保存しました</p>
        <p className={styles.stateMsg}>オンラインに復帰したときに<br />自動で同期されます。</p>
        <button className={styles.dashBtn} onClick={onDashboard}>ダッシュボードへ</button>
      </div>
    </div>
  )
}

function MissingRecordScreen({ onDashboard, onNextColony }: { onDashboard?: () => void; onNextColony?: () => void }) {
  return (
    <div className={styles.screen}>
      <div className={styles.stateCenter}>
        <AlertCircleIcon />
        <p className={styles.stateTitle}>記録が見つかりません</p>
        <p className={styles.stateMsg}>対象の内検記録を読み込めませんでした。</p>
        <button className={styles.retryBtn} onClick={onNextColony}>内検開始へ戻る</button>
        <button className={styles.dashBtn} onClick={onDashboard}>ダッシュボードへ</button>
      </div>
    </div>
  )
}

// ── ComparisonRows ────────────────────────────────────────────────────────────

const BAR_CLASS: Record<string, string> = {
  bee:   styles.barBee,
  brood: styles.barBrood,
  honey: styles.barHoney,
}

function CompRow({ metric }: { metric: ComparisonMetric }) {
  const { key, label, current, previous, unit } = metric
  const isFirst = previous === null
  const diff    = isFirst ? null : current - previous

  let diffLabel: string
  let diffCls: string
  if (diff === null) {
    diffLabel = ''
    diffCls   = ''
  } else if (diff > 0) {
    diffLabel = `↑ +${diff}`
    diffCls   = styles.compDiffUp
  } else if (diff < 0) {
    diffLabel = `↓ ${diff}`
    diffCls   = styles.compDiffDown
  } else {
    diffLabel = '±0'
    diffCls   = styles.compDiffSame
  }

  const barColor = key === 'strength'
    ? (current >= 60 ? 'var(--color-ok)' : 'var(--color-danger)')
    : undefined

  return (
    <div className={styles.compRow}>
      <div className={styles.compIconWrap}>
        <MetricIcon type={key} />
      </div>
      <span className={styles.compLabel}>{label}</span>
      <span className={styles.compValue}>{current}{unit}</span>
      <span className={`${styles.compDiffSlot} ${diffCls}`}>{diffLabel}</span>
      <div className={styles.compBarTrack}>
        <div
          className={key !== 'strength' ? `${styles.compBarFill} ${BAR_CLASS[key] ?? ''}` : styles.compBarFill}
          style={{ width: `${Math.min(100, current)}%`, ...(barColor ? { background: barColor } : {}) }}
        />
      </div>
    </div>
  )
}

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <label className={styles.toggle} htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className={styles.toggleTrack} />
      <span className={styles.toggleThumb} />
    </label>
  )
}

// ── Queen label ───────────────────────────────────────────────────────────────

function queenLabel(status: InspectionCompleteData['queenStatus']) {
  if (status === 'laying')      return { text: '産卵中', green: true }
  if (status === 'unconfirmed') return { text: '未確認', green: false }
  return { text: '要注意', green: false }
}

// ── Main screen ───────────────────────────────────────────────────────────────

interface Props {
  viewState: CompleteViewState
  onNextColony?: () => void
  onAddNote?: () => void
  onDashboard?: () => void
  onEdit?: () => void
  onAiAnalyze?: () => void
}

export function InspectionCompleteScreen({
  viewState,
  onNextColony,
  onAddNote,
  onDashboard,
  onEdit,
  onAiAnalyze,
}: Props) {
  const [reminderOn, setReminderOn] = useState(viewState !== 'reminder-off')

  if (viewState === 'loading')        return <LoadingScreen />
  if (viewState === 'error')          return <ErrorScreen onRetry={onNextColony} />
  if (viewState === 'offline')        return <OfflineScreen onDashboard={onDashboard} />
  if (viewState === 'missing-record') return <MissingRecordScreen onDashboard={onDashboard} onNextColony={onNextColony} />

  const data = getMockData(viewState)
  if (!data) return <MissingRecordScreen onDashboard={onDashboard} onNextColony={onNextColony} />

  const showWarning = data.strengthScore < 60
  const isFirstInsp = data.previousInspDate === null
  const { stageSummary, comparison, aiDiagnosis, nextInspection } = data
  const queen       = queenLabel(data.queenStatus)
  const displayDate = nextInspection.userDate ?? nextInspection.suggestedDate

  return (
    <div className={styles.screen}>

      {/* Section 1: Compact header */}
      <header className={styles.header}>
        <div className={styles.checkCircle} aria-hidden="true">
          <CheckSvg />
        </div>
        <div className={styles.headerText}>
          <h1 className={styles.headerTitle}>内検を保存しました</h1>
          <p className={styles.headerMeta}>{data.colonyLabel}・{data.inspDate}</p>
        </div>
      </header>

      {/* Section 2: Warning banner (strength < 60 only) */}
      {showWarning && (
        <div className={styles.warningBanner} role="alert">
          <WarnTriangle />
          <p className={styles.warnText}>注意：簡易強さスコアが60未満</p>
          <ChevronRight />
        </div>
      )}

      {/* Section 3: 4-column summary */}
      <div className={styles.card}>
        <div className={styles.summaryGrid}>
          {/* Bees */}
          <div className={styles.summaryCell}>
            <div className={styles.summaryIconWrap}>
              <HiveBeeMark size={22} color="var(--color-text-secondary)" />
            </div>
            <span className={styles.summaryLabel}>推定総蜂数</span>
            <span className={styles.summaryValue}>
              {data.estimatedBeeCount.toLocaleString('ja-JP')}匹
            </span>
          </div>
          {/* Queen */}
          <div className={styles.summaryCell}>
            <div className={styles.summaryIconWrap}>
              <QueenMark size={22} color="var(--color-text-secondary)" />
            </div>
            <span className={styles.summaryLabel}>女王</span>
            <span className={`${styles.summaryValue} ${queen.green ? styles.summaryValueGreen : ''}`}>
              {queen.text}
            </span>
          </div>
          {/* Stages — no label, value only */}
          <div className={styles.summaryCell}>
            <div className={styles.summaryIconWrap}>
              <HiveIcon />
            </div>
            <span className={styles.summaryValue}>{stageSummary.stageCount}段・{stageSummary.totalFrames}枠</span>
          </div>
          {/* Weather — weather name as label, temp as value */}
          <div className={styles.summaryCell}>
            <div className={styles.summaryIconWrap}>
              <SunIcon />
            </div>
            <span className={styles.summaryLabel}>{data.weather}</span>
            <span className={styles.summaryValue}>{data.tempCelsius}℃</span>
          </div>
        </div>
      </div>

      {/* Section 4: Comparison card */}
      <div className={styles.card}>
        <div className={styles.cardTitleRow}>
          <span className={styles.cardTitle}>前回との比較</span>
          {!isFirstInsp && (
            <span className={styles.cardSubtitle}>前回：{data.previousInspDate}</span>
          )}
        </div>
        {isFirstInsp ? (
          <p className={styles.firstInspNote}>初回記録のため比較データがありません。</p>
        ) : (
          <>
            <div className={styles.compRows}>
              {comparison.map(m => <CompRow key={m.key} metric={m} />)}
            </div>
            <p className={styles.compNote}>※ 簡易強さスコアの基準値は60以上です。</p>
          </>
        )}
      </div>

      {/* Section 5: AI diagnosis card */}
      <div className={styles.card}>
        <div className={styles.aiCard}>
          <AiChipIcon />
          <div className={styles.aiLeft}>
            <div className={styles.aiTitleRow}>
              <span className={styles.aiLabel}>AI診断</span>
              {aiDiagnosis ? (
                <span className={`${styles.aiBadge} ${styles.aiBadgeAnalyzed}`}>解析済み</span>
              ) : (
                <span className={styles.aiBadge}>画像解析なし</span>
              )}
            </div>
            <p className={styles.aiDesc}>
              {aiDiagnosis
                ? aiDiagnosis.summary
                : '内検写真から、巣の状態をAIが解析します。'}
            </p>
          </div>
          <button className={styles.aiActionBtn} onClick={onAiAnalyze}>
            {aiDiagnosis ? '結果を確認' : 'AI解析を行う'}
            <ChevronRight cls={styles.aiChevron} />
          </button>
        </div>
      </div>

      {/* Section 6: Next inspection card */}
      <div className={styles.card}>
        <div className={styles.nextCard}>
          <div className={styles.nextLeft}>
            <CalendarIcon />
            <div className={styles.nextDateWrap}>
              <span className={styles.nextTitle}>次回内検</span>
              <span className={styles.nextDate}>{displayDate}</span>
              <span className={styles.nextSub}>
                {reminderOn
                  ? `${nextInspection.daysBefore}日後にリマインドします。`
                  : 'リマインダーはオフです。'}
              </span>
            </div>
          </div>
          <div className={styles.nextRight}>
            <Toggle id="reminder-toggle" checked={reminderOn} onChange={setReminderOn} />
            <button className={styles.editBtn} onClick={onEdit}>編集</button>
          </div>
        </div>
      </div>

      {/* Sections 7–9: CTAs */}
      <div className={styles.ctaSection}>
        <button className={styles.primaryBtn} onClick={onNextColony}>
          次の蜂群を内検
        </button>
        <div className={styles.secondaryActions}>
          <button className={styles.secondaryBtn} onClick={onAddNote}>作業記録を追加</button>
          <button className={styles.secondaryBtn} onClick={onDashboard}>ダッシュボードへ</button>
        </div>
        <button className={styles.editLink} onClick={onEdit}>記録を編集</button>
      </div>

      <div className={styles.bottomPad} />
    </div>
  )
}
