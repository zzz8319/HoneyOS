import { useState, useEffect, useRef } from 'react'
import type { DiagnosisViewState, DiagnosisData, DetectionItem, Severity } from './types'
import { MOCK_DIAGNOSIS_DATA } from './mockData'
import styles from './AiDiagnosisScreen.module.css'

interface Props {
  viewState: DiagnosisViewState
  onBack: () => void
  onViewRecommendations?: () => void
  onReanalyze?: () => void
  onReturnToRecord?: () => void
}

// ── Honeycomb grid (module-level, computed once) ──────────────────────────────
const FRAME_HEX_POLYGONS: string[] = (() => {
  const W = 358, H = 172, r = 19
  const dx = r * 1.5
  const dy = r * Math.sqrt(3)
  const cols = Math.ceil(W / dx) + 1
  const rows = Math.ceil(H / dy) + 2
  const result: string[] = []
  for (let c = 0; c <= cols; c++) {
    for (let ro = -1; ro <= rows; ro++) {
      const cx = c * dx + r
      const cy = ro * dy + (c % 2 ? dy / 2 : 0)
      const pts: string[] = []
      for (let i = 0; i < 6; i++) {
        const a = (i * 60 - 30) * (Math.PI / 180)
        pts.push(`${(cx + (r - 1.5) * Math.cos(a)).toFixed(1)},${(cy + (r - 1.5) * Math.sin(a)).toFixed(1)}`)
      }
      result.push(pts.join(' '))
    }
  }
  return result
})()

// ── Detection overlay positions (visual fixture only, not from API) ───────────
const DETECTION_OVERLAYS = [
  { label: 'ダニ疑い', confidence: 72, severity: 'warn' as Severity, top: '12%', left: '54%', width: '31%', height: '36%' },
  { label: '育児の偏り', confidence: 81, severity: 'warn' as Severity, top: '44%', left: '8%', width: '36%', height: '40%' },
] as const

// ── Icons ─────────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
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

function ChevronRightIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function CloseIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

function ExpandIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M11 3h4v4M7 15H3v-4M14 7l-4 4M4 11l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

function ListIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 5h12M3 9h12M3 13h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function SaveDocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="12" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M5 7h6M5 10h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M5 2v3h6V2" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13.5 8a5.5 5.5 0 01-9.4 3.9L2.5 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M2.5 8a5.5 5.5 0 019.4-3.9L13.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M13.5 2v3.5h-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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

// ── Frame placeholder ─────────────────────────────────────────────────────────

function FramePlaceholder({ width, height }: { width: number; height: number }) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect width={width} height={height} fill="#9E6B0A"/>
      {FRAME_HEX_POLYGONS.map((pts, i) => (
        <polygon key={i} points={pts} fill="#C08820" stroke="#7A5008" strokeWidth="0.9"/>
      ))}
      <rect x="3" y="3" width={width - 6} height={height - 6} fill="none" stroke="#6B4506" strokeWidth="3" rx="2"/>
      <text x={width / 2} y={height / 2 + 5} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="12" fontFamily="system-ui" aria-hidden="true">
        巣板プレースホルダー
      </text>
    </svg>
  )
}

// ── Screen header ─────────────────────────────────────────────────────────────

function ScreenHeader({
  colonyLabel,
  dateLabel,
  onBack,
}: {
  colonyLabel: string
  dateLabel: string
  onBack: () => void
}) {
  return (
    <header className={styles.header}>
      <div className={styles.headerRow}>
        <button className={styles.iconBtn} onClick={onBack} aria-label="戻る">
          <BackIcon/>
        </button>
        <div className={styles.headerTitles}>
          <div className={styles.headerTitle}>AI診断結果</div>
          <div className={styles.headerSubtitle}>{colonyLabel}・{dateLabel}</div>
        </div>
        <button className={styles.iconBtn} aria-label="メニュー" disabled>
          <MoreIcon/>
        </button>
      </div>
    </header>
  )
}

// ── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({ summary }: { summary: DiagnosisData['summary'] }) {
  const isDanger = summary.severity === 'danger'
  return (
    <div className={isDanger ? styles.summaryCardDanger : styles.summaryCardWarn}>
      <div className={styles.summaryTop}>
        <span className={isDanger ? styles.summaryIconDanger : styles.summaryIconWarn}>
          <AlertCircleIcon size={22}/>
        </span>
        <span className={styles.summaryTitle}>要確認</span>
        <span className={styles.summaryConfidence}>
          信頼度{' '}
          <strong className={isDanger ? styles.confidenceDanger : styles.confidenceWarn}>
            {summary.confidence}%
          </strong>
        </span>
      </div>
      <p className={styles.summaryText}>{summary.text}</p>
    </div>
  )
}

// ── Analyzed image card ───────────────────────────────────────────────────────

function DetectionOverlay({
  label,
  confidence,
  severity,
  top,
  left,
  width,
  height,
}: {
  label: string
  confidence: number
  severity: Severity
  top: string
  left: string
  width: string
  height: string
}) {
  return (
    <div
      className={severity === 'danger' ? styles.detectionBoxDanger : styles.detectionBoxWarn}
      style={{ top, left, width, height }}
    >
      <span className={severity === 'danger' ? styles.detectionBoxLabelDanger : styles.detectionBoxLabelWarn}>
        {label} {confidence}%
      </span>
    </div>
  )
}

function AnalyzedImageCard({ onExpand }: { onExpand: () => void }) {
  return (
    <div className={styles.imageCard}>
      <div className={styles.imageWrap}>
        <FramePlaceholder width={358} height={172}/>
        {DETECTION_OVERLAYS.map((d) => (
          <DetectionOverlay key={d.label} {...d}/>
        ))}
        <button className={styles.expandBtn} onClick={onExpand} aria-label="画像を拡大表示">
          <ExpandIcon/>
        </button>
      </div>
    </div>
  )
}

// ── Detection section ─────────────────────────────────────────────────────────

function DetectionCard({ item, onOpen }: { item: DetectionItem; onOpen: (d: DetectionItem) => void }) {
  const isDanger = item.severity === 'danger'
  return (
    <button
      className={styles.detectionCard}
      onClick={() => onOpen(item)}
      aria-label={`${item.title}の詳細を見る`}
    >
      <div className={styles.detectionHeader}>
        <span className={isDanger ? styles.detectionIconDanger : styles.detectionIconWarn}>
          <AlertCircleIcon size={18}/>
        </span>
        <span className={styles.detectionTitle}>{item.title}</span>
        <span className={isDanger ? styles.confidenceDanger : styles.confidenceWarn}>
          信頼度 {item.confidence}%
        </span>
        <span className={styles.detectionChevron}><ChevronRightIcon size={14}/></span>
      </div>
      <p className={styles.detectionDesc}>{item.description}</p>
    </button>
  )
}

function DetectionSection({
  detections,
  onOpen,
}: {
  detections: DetectionItem[]
  onOpen: (d: DetectionItem) => void
}) {
  return (
    <div className={styles.detectionSection}>
      <h2 className={styles.sectionTitle}>検出結果</h2>
      <div className={styles.detectionList}>
        {detections.map((d) => (
          <DetectionCard key={d.id} item={d} onOpen={onOpen}/>
        ))}
      </div>
    </div>
  )
}

// ── Disclaimer ────────────────────────────────────────────────────────────────

function Disclaimer() {
  return (
    <div className={styles.disclaimer}>
      <span className={styles.disclaimerIcon}><InfoIcon/></span>
      <p className={styles.disclaimerText}>AI診断は補助情報です。最終判断は養蜂家が行ってください。</p>
    </div>
  )
}

// ── Action area ───────────────────────────────────────────────────────────────

interface ActionAreaProps {
  isSaving: boolean
  isSaved: boolean
  onViewRecommendations: () => void
  onSave: () => void
  onReanalyze: () => void
  onReturnToRecord: () => void
}

function ActionArea({
  isSaving,
  isSaved,
  onViewRecommendations,
  onSave,
  onReanalyze,
  onReturnToRecord,
}: ActionAreaProps) {
  return (
    <div className={styles.actionArea}>
      <button className={styles.primaryBtn} onClick={onViewRecommendations}>
        <ListIcon/>
        推奨作業を見る
      </button>

      <div className={styles.secondaryRow}>
        <button
          className={styles.outlineBtn}
          onClick={onSave}
          disabled={isSaving || isSaved}
          aria-label={isSaved ? '結果を保存済み' : '結果を保存'}
          aria-busy={isSaving}
        >
          {isSaving ? (
            <>
              <span className={styles.spinnerSmall} aria-hidden="true"/>
              保存中…
            </>
          ) : isSaved ? (
            <>
              <CheckIcon/>
              保存済み
            </>
          ) : (
            <>
              <SaveDocIcon/>
              結果を保存
            </>
          )}
        </button>

        <button className={styles.outlineBtn} onClick={onReanalyze}>
          <RefreshIcon/>
          再解析
        </button>
      </div>

      <button className={styles.returnLink} onClick={onReturnToRecord}>
        内検記録に戻る<ChevronRightIcon size={13}/>
      </button>
    </div>
  )
}

// ── Detection detail modal ────────────────────────────────────────────────────

function DetectionDetailModal({
  detection,
  onClose,
}: {
  detection: DetectionItem
  onClose: () => void
}) {
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const isDanger = detection.severity === 'danger'

  useEffect(() => {
    closeBtnRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className={styles.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label={detection.title}
      onClick={onClose}
    >
      <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHandle} aria-hidden="true"/>
        <div className={styles.modalHeader}>
          <span className={isDanger ? styles.detectionIconDanger : styles.detectionIconWarn}>
            <AlertCircleIcon size={20}/>
          </span>
          <span className={styles.modalTitle}>{detection.title}</span>
          <button
            ref={closeBtnRef}
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="閉じる"
          >
            <CloseIcon/>
          </button>
        </div>
        <div className={styles.modalContent}>
          <div className={styles.modalConfidenceRow}>
            <span className={styles.modalConfidenceLabel}>信頼度</span>
            <span className={isDanger ? styles.confidenceDanger : styles.confidenceWarn}>
              {detection.confidence}%
            </span>
          </div>
          <div>
            <p className={styles.modalSectionLabel}>解析結果</p>
            <p className={styles.modalBody}>{detection.description}</p>
          </div>
          <div>
            <p className={styles.modalSectionLabel}>次に確認すること</p>
            <p className={styles.modalBody}>{detection.nextCheck}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Image expand modal ────────────────────────────────────────────────────────

function ImageExpandModal({ onClose }: { onClose: () => void }) {
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeBtnRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className={styles.imageModalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="解析画像の拡大表示"
    >
      <div className={styles.imageModalBar}>
        <span className={styles.imageModalTitle}>巣板の解析画像</span>
        <button
          ref={closeBtnRef}
          className={styles.imageModalCloseBtn}
          onClick={onClose}
          aria-label="閉じる"
        >
          <CloseIcon size={22}/>
        </button>
      </div>
      <div className={styles.imageModalBody}>
        <div className={styles.imageModalInner}>
          <FramePlaceholder width={358} height={240}/>
          {DETECTION_OVERLAYS.map((d) => (
            <DetectionOverlay key={d.label} {...d}/>
          ))}
        </div>
      </div>
      <div className={styles.imageModalCaption}>
        {DETECTION_OVERLAYS.map((d) => (
          <span key={d.label} className={d.severity === 'danger' ? styles.captionDanger : styles.captionWarn}>
            {d.label} {d.confidence}%
          </span>
        ))}
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
            <div className={styles.headerTitle}>AI診断結果</div>
          </div>
          <div style={{ width: 44 }}/>
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
      <p className={styles.stateDesc}>診断結果を読み込み中…</p>
    </StateScreen>
  )
}

function ContextMissingState({ onBack }: { onBack: () => void }) {
  return (
    <StateScreen onBack={onBack}>
      <span className={styles.stateIcon}><AlertCircleIcon size={40}/></span>
      <p className={styles.stateTitle}>診断結果が見つかりません</p>
      <p className={styles.stateDesc}>内検記録から再度AI解析を実行してください。</p>
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
      <p className={styles.stateTitle}>診断結果を取得できませんでした</p>
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
      <p className={styles.stateTitle}>保存済みの診断結果がありません</p>
      <p className={styles.stateDesc}>オンライン時に診断結果を保存しておくと、オフラインでも確認できます。</p>
      <button className={styles.retryBtn} onClick={onBack}>戻る</button>
    </StateScreen>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function AiDiagnosisScreen({
  viewState,
  onBack,
  onViewRecommendations,
  onReanalyze,
  onReturnToRecord,
}: Props) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [isSaving, setIsSaving] = useState<boolean>(() => viewState === 'saving')
  const [isSaved, setIsSaved] = useState(false)

  const [openDetection, setOpenDetection] = useState<DetectionItem | null>(() => {
    const modal = new URLSearchParams(window.location.search).get('modal')
    return modal === 'detail' ? MOCK_DIAGNOSIS_DATA.detections[0] : null
  })
  const [imageExpanded, setImageExpanded] = useState<boolean>(() => {
    const modal = new URLSearchParams(window.location.search).get('modal')
    return modal === 'image'
  })

  function handleRetry() {
    if (isRetrying) return
    setIsRetrying(true)
    console.log('[SCR-022] 診断結果再取得リクエスト（未接続）')
    setTimeout(() => setIsRetrying(false), 2000)
  }

  function handleSave() {
    if (isSaving || isSaved) return
    setIsSaving(true)
    console.log('[SCR-022] 診断結果保存リクエスト（未接続）')
    setTimeout(() => { setIsSaving(false); setIsSaved(true) }, 1500)
  }

  if (viewState === 'loading') return <LoadingState onBack={onBack}/>
  if (viewState === 'context-missing') return <ContextMissingState onBack={onBack}/>
  if (viewState === 'error') return <ErrorState onBack={onBack} onRetry={handleRetry} isRetrying={isRetrying}/>
  if (viewState === 'offline-no-cache') return <OfflineNoCacheState onBack={onBack}/>

  const isOffline = viewState === 'offline'
  const data = MOCK_DIAGNOSIS_DATA

  return (
    <div className={styles.screen} aria-busy={isSaving}>
      <ScreenHeader colonyLabel={data.colonyLabel} dateLabel={data.dateLabel} onBack={onBack}/>

      {isOffline && (
        <div className={styles.offlineBanner} role="status">
          <WifiOffIcon/>
          オフライン — 保存済みの診断結果を表示しています
        </div>
      )}

      <div className={styles.content}>
        <SummaryCard summary={data.summary}/>
        <AnalyzedImageCard onExpand={() => setImageExpanded(true)}/>
        <DetectionSection detections={data.detections} onOpen={setOpenDetection}/>
        <Disclaimer/>
        <ActionArea
          isSaving={isSaving}
          isSaved={isSaved}
          onViewRecommendations={onViewRecommendations ?? (() => {})}
          onSave={handleSave}
          onReanalyze={onReanalyze ?? (() => {})}
          onReturnToRecord={onReturnToRecord ?? (() => {})}
        />
      </div>

      {openDetection && (
        <DetectionDetailModal
          detection={openDetection}
          onClose={() => setOpenDetection(null)}
        />
      )}
      {imageExpanded && (
        <ImageExpandModal onClose={() => setImageExpanded(false)}/>
      )}
    </div>
  )
}
