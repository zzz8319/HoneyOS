import { useState, useRef } from 'react'
import { HiveBeeMark } from '../../components/icons/HiveBeeMark'
import { QueenMark } from '../../components/icons/QueenMark'
import type {
  AiAnalysisViewState,
  AnalysisTarget,
  SelectedPhoto,
  InspectionSummary,
  InspectionData,
} from './types'
import {
  MOCK_INSPECTION_SUMMARY,
  MOCK_INSPECTION_DATA,
  MOCK_SELECTED_PHOTOS,
  MOCK_MAX_PHOTOS,
  MOCK_CONTEXT,
} from './mockData'
import styles from './AiAnalysisScreen.module.css'

interface Props {
  viewState: AiAnalysisViewState
  onBack: () => void
  onAnalysisComplete?: (inspectionId: string, colonyId: string) => void
  // context passed from SCR-021
  initialPhotos?: SelectedPhoto[]
  inspectionId?: string
  colonyId?: string
  apiaryId?: string
}

const MAX_PHOTOS = 10

// ── Icons ────────────────────────────────────────────────

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

function ChevronRightIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function CheckIcon({ size = 12, color = 'white' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6l3 3 5-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function InspectionIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

function CameraIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1.5" y="5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="9" cy="10.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M6 5l1-2h4l1 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="3" y="8" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M6 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="9" cy="12.5" r="1.2" fill="currentColor"/>
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M5 3.5l10 5.5-10 5.5V3.5z" fill="currentColor"/>
    </svg>
  )
}

function PhotoPlaceholder() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M9 6l1-2h4l1 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function BroodIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="5" cy="6" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="11" cy="6" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="8" cy="10" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M7 6h2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  )
}

function HoneyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2l2.5 4.5h-5L8 2z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
      <path d="M5.5 6.5l-2.5 4h10l-2.5-4" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
      <path d="M6 10.5v2M10 10.5v2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  )
}

function EstimateIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M5 8h6M5 11h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M5 6l1.5-1.5L8 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function WifiOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 3l14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 15a1 1 0 110 2 1 1 0 010-2z" fill="currentColor"/>
      <path d="M4 9a8.5 8.5 0 013-1.9M13 7.1c1.1.5 2.2 1.2 3 2.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M6 12a4.5 4.5 0 014-1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M20 12v10M20 28v1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  )
}

// ── Step indicator ───────────────────────────────────────

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: '解析内容を確認' },
    { n: 2, label: '解析中' },
    { n: 3, label: '結果表示' },
  ] as const
  return (
    <div className={styles.steps}>
      {steps.flatMap((s, i) => {
        const items = [
          <div key={`step-${s.n}`} className={styles.stepItem}>
            <div className={`${styles.stepCircle} ${current === s.n ? styles.stepCircleActive : ''}`}>
              {s.n}
            </div>
            <span className={`${styles.stepLabel} ${current === s.n ? styles.stepLabelActive : ''}`}>
              {s.label}
            </span>
          </div>,
        ]
        if (i < steps.length - 1) items.push(<div key={`line-${i}`} className={styles.stepLine}/>)
        return items
      })}
    </div>
  )
}

// ── Screen Header ────────────────────────────────────────

function ScreenHeader({ onBack }: { onBack: () => void }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerRow}>
        <button className={styles.iconBtn} onClick={onBack} aria-label="戻る">
          <BackIcon/>
        </button>
        <div className={styles.headerTitles}>
          <div className={styles.headerTitle}>AI解析</div>
          <div className={styles.headerSubtitle}>解析内容を確認</div>
        </div>
        {/* 三点メニュー: 利用可能な操作が未接続のため表示のみ */}
        <button className={styles.iconBtn} aria-label="メニュー" disabled>
          <MoreIcon/>
        </button>
      </div>
    </header>
  )
}

// ── Inspection target card ───────────────────────────────

function InspectionTargetCard({ summary }: { summary: InspectionSummary }) {
  return (
    <div className={styles.card}>
      <div className={styles.inspCard}>
        <div className={styles.inspIcon}>
          <InspectionIcon/>
        </div>
        <div className={styles.inspInfo}>
          <div className={styles.inspLabel}>{summary.colonyLabel}・{summary.dateLabel}の内検</div>
          <div className={styles.inspSub}>{summary.apiaryName}・{summary.boxName}</div>
        </div>
        <span className={styles.chevron}><ChevronRightIcon/></span>
      </div>
    </div>
  )
}

// ── Image card ───────────────────────────────────────────

function ImageCard({
  photos,
  onDelete,
  onCamera,
  onAdd,
  atMax,
}: {
  photos: SelectedPhoto[]
  onDelete: (id: string) => void
  onCamera: () => void
  onAdd: () => void
  atMax: boolean
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>解析画像<span className={styles.cardSubtitle}>（任意）</span></span>
        <span className={styles.cardRight}>
          <span className={styles.cardSubtitle}>最大10枚まで</span>
        </span>
      </div>

      {atMax && (
        <p className={styles.maxWarning} role="alert">上限の10枚に達しています。削除してから追加してください。</p>
      )}

      <div className={styles.imageScroll}>
        {photos.map((p) => (
          <div key={p.id} className={styles.imageTile}>
            {p.url ? (
              <img src={p.url} alt="" className={styles.tileImg}/>
            ) : (
              <div className={styles.imagePlaceholder}>
                <PhotoPlaceholder/>
              </div>
            )}
            <span className={styles.tileTime}>{p.timeLabel}</span>
            <button
              className={styles.deleteBtn}
              onClick={() => onDelete(p.id)}
              aria-label={`写真 ${p.timeLabel} を解析対象から除外`}
            >
              <CloseIcon/>
            </button>
          </div>
        ))}

        <button
          className={`${styles.actionTile} ${atMax ? styles.actionTileDisabled : ''}`}
          onClick={onCamera}
          aria-label="カメラで撮影して追加"
          disabled={atMax}
        >
          <CameraIcon size={20}/>
          <span className={styles.actionTileLabel}>撮影</span>
        </button>

        <button
          className={`${styles.actionTile} ${atMax ? styles.actionTileDisabled : ''}`}
          onClick={onAdd}
          aria-label="写真を追加"
          disabled={atMax}
        >
          <PlusIcon/>
          <span className={styles.actionTileLabel}>追加</span>
        </button>
      </div>
    </div>
  )
}

// ── Inspection data card ─────────────────────────────────

function DiffLabel({ diff }: { diff: number }) {
  if (diff === 0) return null
  const up = diff > 0
  return (
    <span className={`${styles.dataCellDiff} ${up ? styles.diffUp : styles.diffDown}`}>
      {up ? `↑ +${diff}` : `↓ ${diff}`}
    </span>
  )
}

function InspectionDataCard({ data }: { data: InspectionData }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>内検データ<span className={styles.cardSubtitle}>（自動連携・必須）</span></span>
        <div className={styles.dataLinkedBadge}>
          <CheckIcon size={12} color="var(--color-ok, #16A34A)"/>
          連携済み
        </div>
      </div>
      <p className={styles.dataDesc}>この内検の記録データが自動で連携されています。</p>
      <div className={styles.dataGrid}>
        {/* Row 1 */}
        <div className={styles.dataCell}>
          <div className={styles.dataCellIcon}><HiveBeeMark size={16}/></div>
          <span className={styles.dataCellLabel}>蜂量</span>
          <span className={styles.dataCellValue}>{data.beePopulation.value}%</span>
          <DiffLabel diff={data.beePopulation.diff}/>
        </div>
        <div className={styles.dataCell}>
          <div className={styles.dataCellIcon}><BroodIcon/></div>
          <span className={styles.dataCellLabel}>育児</span>
          <span className={styles.dataCellValue}>{data.brood.value}%</span>
          <DiffLabel diff={data.brood.diff}/>
        </div>
        <div className={styles.dataCell}>
          <div className={styles.dataCellIcon}><HoneyIcon/></div>
          <span className={styles.dataCellLabel}>貯蜜</span>
          <span className={styles.dataCellValue}>{data.honey.value}%</span>
          <DiffLabel diff={data.honey.diff}/>
        </div>
        {/* Row 2 */}
        <div className={styles.dataCell}>
          <div className={styles.dataCellIcon}><QueenMark size={16}/></div>
          <span className={styles.dataCellLabel}>女王</span>
          {data.queenConfirmed === null && (
            <span className={styles.queenBadge}>未確認</span>
          )}
          {data.queenConfirmed === true && (
            <span className={styles.dataCellValue}>確認済</span>
          )}
          {data.queenConfirmed === false && (
            <span className={styles.queenBadge}>不在</span>
          )}
        </div>
        <div className={styles.dataCell}>
          <div className={styles.dataCellIcon}><EstimateIcon/></div>
          <span className={styles.dataCellLabel}>推定総蜂数</span>
          <span className={styles.dataCellValue}>{data.estimatedBees.toLocaleString('ja-JP')}匹</span>
        </div>
        <div className={`${styles.dataCell} ${styles.dataLinkCell}`}>
          <div className={styles.dataCellIcon}><InspectionIcon/></div>
          <span className={styles.dataCellLabel}>内容を確認</span>
          <span className={styles.dataLinkText}>
            確認 <ChevronRightIcon size={12}/>
          </span>
        </div>
      </div>
    </div>
  )
}

function DataMissingCard() {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>内検データ<span className={styles.cardSubtitle}>（自動連携・必須）</span></span>
      </div>
      <div className={styles.dataMissingBox}>
        <div className={styles.dataMissingIcon}>
          <AlertIcon/>
        </div>
        <p className={styles.dataMissingText}>内検データを取得できませんでした。<br/>内検を完了してから再度お試しください。</p>
      </div>
    </div>
  )
}

// ── Analysis targets ─────────────────────────────────────

const ALL_TARGETS: { id: AnalysisTarget; label: string }[] = [
  { id: 'health', label: '健康状態' },
  { id: 'disease-pest', label: '病気・害虫' },
  { id: 'queen', label: '女王の有無' },
]

function AnalysisTargets({
  selected,
  onToggle,
  showError,
}: {
  selected: Set<AnalysisTarget>
  onToggle: (t: AnalysisTarget) => void
  showError: boolean
}) {
  return (
    <div className={styles.card}>
      <div className={styles.targetSection}>
        <div className={styles.targetTitle}>解析対象<span className={styles.cardSubtitle}>（複数選択可）</span></div>
        <div className={styles.targetChips} role="group" aria-label="解析対象の選択">
          {ALL_TARGETS.map((t) => {
            const active = selected.has(t.id)
            return (
              <button
                key={t.id}
                className={`${styles.targetChip} ${active ? styles.targetChipActive : ''}`}
                onClick={() => onToggle(t.id)}
                aria-pressed={active}
                aria-label={t.label}
              >
                <span className={`${styles.chipCheck} ${active ? styles.chipCheckActive : ''}`} aria-hidden="true">
                  {active && <CheckIcon size={10}/>}
                </span>
                {t.label}
              </button>
            )
          })}
        </div>
        {showError && (
          <p className={styles.targetsError} role="alert">解析対象を1つ以上選択してください。</p>
        )}
      </div>
    </div>
  )
}

// ── Security notice ──────────────────────────────────────

function SecurityNotice() {
  return (
    <div className={styles.securityCard}>
      <span className={styles.securityIcon}><LockIcon/></span>
      <p className={styles.securityText}>
        画像と内検データを安全に送信して解析します。<br/>
        このデータはAI解析のみに使用されます。
      </p>
    </div>
  )
}

// ── Main screen ──────────────────────────────────────────

export function AiAnalysisScreen({
  viewState,
  onBack,
  onAnalysisComplete,
  initialPhotos,
  inspectionId = MOCK_CONTEXT.inspectionId,
  colonyId = MOCK_CONTEXT.colonyId,
}: Props) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)

  // Determine initial photos based on viewState
  const initPhotos = (): SelectedPhoto[] => {
    if (viewState === 'max-images') return MOCK_MAX_PHOTOS
    if (viewState === 'no-images') return []
    return initialPhotos ?? MOCK_SELECTED_PHOTOS
  }

  const [photos, setPhotos] = useState<SelectedPhoto[]>(initPhotos)
  const [targets, setTargets] = useState<Set<AnalysisTarget>>(
    viewState === 'targets-empty'
      ? new Set()
      : new Set<AnalysisTarget>(['health', 'disease-pest', 'queen'])
  )
  const [showTargetError, setShowTargetError] = useState(false)

  const atMax = photos.length >= MAX_PHOTOS

  const summary = MOCK_INSPECTION_SUMMARY
  const inspData = MOCK_INSPECTION_DATA

  function deletePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id))
  }

  function toggleTarget(t: AnalysisTarget) {
    setTargets((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
    setShowTargetError(false)
  }

  function handleStart(withImages: boolean) {
    if (targets.size === 0) {
      setShowTargetError(true)
      return
    }
    // AI解析バックエンドは未接続。成功を装わない。
    const photoIds = withImages ? photos.map((p) => p.id) : []
    console.log('[SCR-014] AI解析リクエスト（未接続）:', { inspectionId, colonyId, photoIds, targets: Array.from(targets) })
    onAnalysisComplete?.(inspectionId, colonyId)
  }

  // ── Full-screen special states ─────────────────────────
  if (viewState === 'context-missing') {
    return (
      <div className={styles.stateScreen}>
        <ScreenHeader onBack={onBack}/>
        <div className={styles.stateBody}>
          <AlertIcon/>
          <p className={styles.stateTitle}>内検情報が見つかりません</p>
          <p className={styles.stateDesc}>内検画面から再度操作してください。</p>
          <button className={styles.retryBtn} onClick={onBack}>戻る</button>
        </div>
      </div>
    )
  }

  if (viewState === 'loading-inspection') {
    return (
      <div className={styles.stateScreen}>
        <ScreenHeader onBack={onBack}/>
        <StepIndicator current={1}/>
        <div className={styles.stateBody}>
          <div className={styles.spinner}/>
          <p className={styles.stateDesc}>内検データを読み込み中…</p>
        </div>
      </div>
    )
  }

  if (viewState === 'camera-permission-denied') {
    return (
      <div className={styles.stateScreen}>
        <ScreenHeader onBack={onBack}/>
        <StepIndicator current={1}/>
        <div className={styles.stateBody}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className={styles.stateIcon} aria-hidden="true">
            <rect x="4" y="12" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="1.8"/>
            <circle cx="18" cy="22" r="5" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M8 12l2-4h16l2 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M26 14l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p className={styles.stateTitle}>カメラのアクセスが拒否されました</p>
          <p className={styles.stateDesc}>設定からカメラのアクセスを<br/>許可してください。</p>
          <button className={styles.retryBtn} onClick={onBack}>戻る</button>
        </div>
      </div>
    )
  }

  // ── Normal / content layout ────────────────────────────
  const canStart = targets.size > 0 && viewState !== 'request-pending'
  const isPending = viewState === 'request-pending'
  const isError = viewState === 'request-error'
  const isOffline = viewState === 'offline'
  const isDataMissing = viewState === 'data-missing'

  return (
    <div className={styles.screen}>
      <ScreenHeader onBack={onBack}/>
      <StepIndicator current={1}/>

      {isOffline && (
        <div className={styles.offlineBanner} role="status">
          <WifiOffIcon/>
          オフライン — キャッシュデータを表示しています
        </div>
      )}

      {isError && (
        <div className={styles.errorBanner} role="alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M8 5v4M8 10.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          解析リクエストに失敗しました。選択内容を確認して再試行してください。
        </div>
      )}

      <div className={styles.content}>
        {/* 3. 対象内検カード */}
        <InspectionTargetCard summary={summary}/>

        {/* 4. 解析画像カード */}
        <ImageCard
          photos={photos}
          onDelete={deletePhoto}
          onCamera={() => cameraInputRef.current?.click()}
          onAdd={() => uploadInputRef.current?.click()}
          atMax={atMax}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          aria-hidden="true"
        />
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          aria-hidden="true"
        />

        {/* 5. 内検データカード */}
        {isDataMissing ? <DataMissingCard/> : <InspectionDataCard data={inspData}/>}

        {/* 6. 解析対象 */}
        <AnalysisTargets
          selected={targets}
          onToggle={toggleTarget}
          showError={showTargetError}
        />

        {/* 7. セキュリティ案内 */}
        <SecurityNotice/>

        {/* 8. 解析時間 + CTA */}
        <div className={styles.timeRow}>
          <div className={styles.timeLeft}>
            <ClockIcon/>解析にかかる時間
          </div>
          <span className={styles.timeValue}>約30秒</span>
        </div>

        <div className={styles.ctaArea}>
          {isPending ? (
            <div className={styles.pendingOverlay} aria-live="polite">
              <div className={styles.spinner}/>
              解析リクエスト送信中…
            </div>
          ) : (
            <button
              className={styles.startBtn}
              onClick={() => handleStart(true)}
              disabled={!canStart}
              aria-label="AI解析を開始"
            >
              <PlayIcon/>AI解析を開始
            </button>
          )}

          <button
            className={styles.noImageLink}
            onClick={() => handleStart(false)}
            disabled={isPending || targets.size === 0}
            aria-label="画像なしで解析する"
          >
            画像なしで解析する<ChevronRightIcon size={14}/>
          </button>
        </div>
      </div>
    </div>
  )
}
