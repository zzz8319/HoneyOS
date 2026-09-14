import { useState, useRef } from 'react'
import type { CameraViewState, CameraTabId, PhotoItem, InspectionGroup, AutoCaptureGroup } from './types'
import { MOCK_DATA, DEFAULT_SELECTED_IDS } from './mockData'
import styles from './CameraImagesScreen.module.css'

interface Props {
  viewState: CameraViewState
  onBack: () => void
  onAnalyze?: (photoIds: string[]) => void
}

function PlaceholderIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="4" y="8" width="24" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="16" cy="17" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M11 8l1.5-3h7L21 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="3" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M5 1.5v3M11 1.5v3M1.5 7h13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

function RobotIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="6" cy="9" r="1.2" stroke="currentColor" strokeWidth="1.1"/>
      <circle cx="10" cy="9" r="1.2" stroke="currentColor" strokeWidth="1.1"/>
      <path d="M8 1v4M6 13h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="8" cy="1" r="1" fill="currentColor"/>
    </svg>
  )
}

function ExpandIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M8.5 2h3.5v3.5M5.5 12H2V8.5M11.5 2.5l-4 4M2.5 11.5l4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1.5" y="5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="9" cy="10.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M6 5l1-2h4l1 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 12V4M6 7l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 14h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function VideoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="1" y="4" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M13 8l6-3v10l-6-3V8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  )
}

function PhotoTile({
  photo,
  selected,
  isAutoCapture,
  onToggle,
}: {
  photo: PhotoItem
  selected: boolean
  isAutoCapture: boolean
  onToggle: (id: string) => void
}) {
  return (
    <div
      className={`${styles.tile} ${selected ? styles.tileSelected : ''}`}
      onClick={() => onToggle(photo.id)}
      role="checkbox"
      aria-checked={selected}
      aria-label={`写真 ${photo.timeLabel}`}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') onToggle(photo.id) }}
    >
      {photo.url ? (
        <img src={photo.url} alt="" className={styles.tileImg}/>
      ) : (
        <div className={styles.tilePlaceholder}>
          <PlaceholderIcon/>
        </div>
      )}

      <div className={`${styles.tileSelectCircle} ${selected ? styles.tileSelectCircleActive : ''}`}>
        {selected && <CheckIcon/>}
      </div>

      <span className={styles.tileTime}>{photo.timeLabel}</span>

      {isAutoCapture ? (
        <span className={styles.tileRobot}><RobotIcon size={14}/></span>
      ) : (
        <span className={styles.tileExpand}><ExpandIcon/></span>
      )}
    </div>
  )
}

function InspectionGroupCard({
  group,
  selectedIds,
  onToggle,
}: {
  group: InspectionGroup
  selectedIds: Set<string>
  onToggle: (id: string) => void
}) {
  return (
    <div className={styles.groupCard}>
      <div className={styles.groupHeader}>
        <span className={styles.groupIcon}><CalendarIcon/></span>
        <span className={styles.groupDate}>{group.dateLabel}</span>
        <span className={styles.groupCount}>{group.photos.length}枚</span>
      </div>
      <div className={styles.photoGrid}>
        {group.photos.map((p) => (
          <PhotoTile
            key={p.id}
            photo={p}
            selected={selectedIds.has(p.id)}
            isAutoCapture={false}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  )
}

function AutoCaptureGroupCard({
  group,
  selectedIds,
  onToggle,
}: {
  group: AutoCaptureGroup
  selectedIds: Set<string>
  onToggle: (id: string) => void
}) {
  return (
    <div className={styles.groupCard}>
      <div className={styles.groupHeader}>
        <span className={styles.groupIcon}><RobotIcon/></span>
        <span className={styles.groupDate}>{group.dateLabel}</span>
        <span className={styles.groupCount}>{group.photos.length}枚</span>
      </div>
      <div className={styles.photoGrid}>
        {group.photos.map((p) => (
          <PhotoTile
            key={p.id}
            photo={p}
            selected={selectedIds.has(p.id)}
            isAutoCapture={true}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  )
}

export function CameraImagesScreen({ viewState, onBack, onAnalyze }: Props) {
  const [activeTab, setActiveTab] = useState<CameraTabId>(() => {
    if (viewState === 'inspection-tab') return 'inspection'
    if (viewState === 'auto-capture-tab') return 'auto-capture'
    return 'all'
  })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    if (viewState === 'none-selected') return new Set()
    if (viewState === 'auto-capture-tab') return new Set()
    if (viewState === 'loading' || viewState === 'error' || viewState === 'offline'
        || viewState === 'empty' || viewState === 'camera-permission-denied'
        || viewState === 'context-missing') return new Set()
    return new Set(DEFAULT_SELECTED_IDS)
  })

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)

  const data = MOCK_DATA

  function togglePhoto(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  const selectedCount = selectedIds.size

  // ── Loading ──────────────────────────────────────────
  if (viewState === 'loading') {
    return (
      <div className={styles.screen}>
        <Header onBack={onBack} subtitle={`${data.colonyLabel}・${data.apiaryName}`}/>
        <div className={styles.stateBox}>
          <div className={styles.spinner}/>
          <p className={styles.stateBody}>読み込み中…</p>
        </div>
        <Footer count={0} onClear={clearSelection} onAnalyze={() => {}} disabled/>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────
  if (viewState === 'error') {
    return (
      <div className={styles.screen}>
        <Header onBack={onBack} subtitle={`${data.colonyLabel}・${data.apiaryName}`}/>
        <div className={styles.stateBox}>
          <span className={styles.stateIcon}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2"/>
              <path d="M20 12v10M20 28v1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </span>
          <p className={styles.stateTitle}>読み込みエラー</p>
          <p className={styles.stateBody}>画像を取得できませんでした。</p>
          <button className={styles.retryBtn} onClick={onBack}>戻る</button>
        </div>
        <Footer count={0} onClear={clearSelection} onAnalyze={() => {}} disabled/>
      </div>
    )
  }

  // ── Offline ──────────────────────────────────────────
  if (viewState === 'offline') {
    return (
      <div className={styles.screen}>
        <Header onBack={onBack} subtitle={`${data.colonyLabel}・${data.apiaryName}`}/>
        <div className={styles.stateBox}>
          <span className={styles.stateIcon}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <path d="M6 6l28 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M20 30a1 1 0 110 2 1 1 0 010-2z" fill="currentColor"/>
              <path d="M8 18c1.6-1.6 3.7-2.8 6-3.4M26 14.6c2.3.6 4.4 1.8 6 3.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M12 22c2.1-2.1 5-3.4 8-3.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </span>
          <p className={styles.stateTitle}>オフライン</p>
          <p className={styles.stateBody}>ネットワークに接続して<br/>再度お試しください。</p>
        </div>
        <Footer count={0} onClear={clearSelection} onAnalyze={() => {}} disabled/>
      </div>
    )
  }

  // ── Camera permission denied ─────────────────────────
  if (viewState === 'camera-permission-denied') {
    return (
      <div className={styles.screen}>
        <Header onBack={onBack} subtitle={`${data.colonyLabel}・${data.apiaryName}`}/>
        <div className={styles.stateBox}>
          <span className={styles.stateIcon}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <rect x="4" y="12" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="1.8"/>
              <circle cx="18" cy="22" r="5" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M8 12l2-4h16l2 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M26 14l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </span>
          <p className={styles.stateTitle}>カメラのアクセスが拒否されました</p>
          <p className={styles.stateBody}>設定からカメラのアクセスを<br/>許可してください。</p>
        </div>
        <Footer count={0} onClear={clearSelection} onAnalyze={() => {}} disabled/>
      </div>
    )
  }

  // ── Context missing ──────────────────────────────────
  if (viewState === 'context-missing') {
    return (
      <div className={styles.screen}>
        <Header onBack={onBack} subtitle="—"/>
        <div className={styles.stateBox}>
          <span className={styles.stateIcon}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <rect x="6" y="8" width="28" height="26" rx="3" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M13 18h14M13 24h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </span>
          <p className={styles.stateTitle}>内検情報が見つかりません</p>
          <p className={styles.stateBody}>巣箱を選択してから<br/>カメラ画面を開いてください。</p>
          <button className={styles.retryBtn} onClick={onBack}>戻る</button>
        </div>
        <Footer count={0} onClear={clearSelection} onAnalyze={() => {}} disabled/>
      </div>
    )
  }

  // ── Normal content ───────────────────────────────────
  const allInspectionPhotos = data.inspectionGroups.flatMap((g) => g.photos)
  const allAutoCapturePhotos = data.autoCaptureGroups.flatMap((g) => g.photos)

  const showInspection = activeTab === 'all' || activeTab === 'inspection'
  const showAutoCapture = activeTab === 'all' || activeTab === 'auto-capture'

  const isEmpty = viewState === 'empty'
    || (activeTab === 'inspection' && allInspectionPhotos.length === 0)
    || (activeTab === 'auto-capture' && allAutoCapturePhotos.length === 0)

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <button className={styles.backBtn} onClick={onBack} aria-label="戻る">
            <BackIcon/>
          </button>
          <div className={styles.headerTitles}>
            <div className={styles.headerTitle}>カメラ画像</div>
            <div className={styles.headerSubtitle}>{data.colonyLabel}・{data.apiaryName}</div>
          </div>
        </div>

        <div className={styles.segmentRow} role="tablist">
          {([
            { id: 'all' as CameraTabId, label: 'すべて' },
            { id: 'inspection' as CameraTabId, label: '内検' },
            { id: 'auto-capture' as CameraTabId, label: '自動撮影' },
          ] as const).map(({ id, label }) => (
            <button
              key={id}
              role="tab"
              aria-selected={activeTab === id}
              className={`${styles.segBtn} ${activeTab === id ? styles.segBtnActive : ''}`}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {viewState === 'upload-error' && (
        <div className={styles.errorBanner} role="alert">
          アップロードに失敗しました。ネットワークを確認して再度お試しください。
        </div>
      )}

      <div className={styles.actionBar}>
        <button className={styles.actionBtn} onClick={() => cameraInputRef.current?.click()}>
          <CameraIcon/>撮影
        </button>
        <button className={styles.actionBtn} onClick={() => uploadInputRef.current?.click()}>
          <UploadIcon/>アップロード
        </button>
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
      </div>

      <div className={styles.content}>
        {isEmpty ? (
          <div className={styles.stateBox}>
            <span className={styles.stateIcon}><PlaceholderIcon/></span>
            <p className={styles.stateTitle}>画像がありません</p>
            <p className={styles.stateBody}>撮影またはアップロードして<br/>画像を追加してください。</p>
          </div>
        ) : (
          <>
            {showInspection && data.inspectionGroups.map((group) => (
              <InspectionGroupCard
                key={group.inspectionId}
                group={group}
                selectedIds={selectedIds}
                onToggle={togglePhoto}
              />
            ))}

            {showAutoCapture && data.autoCaptureGroups.map((group, i) => (
              <AutoCaptureGroupCard
                key={i}
                group={group}
                selectedIds={selectedIds}
                onToggle={togglePhoto}
              />
            ))}

            {activeTab === 'all' && (
              <div className={styles.liveFeedCard} aria-disabled="true">
                <span className={styles.liveFeedIcon}><VideoIcon/></span>
                <span className={styles.liveFeedLabel}>ライブフィード</span>
                <span className={styles.liveFeedBadge}>将来対応</span>
              </div>
            )}
          </>
        )}
      </div>

      <Footer
        count={selectedCount}
        onClear={clearSelection}
        onAnalyze={() => onAnalyze?.(Array.from(selectedIds))}
        disabled={selectedCount === 0}
      />
    </div>
  )
}

function Header({ onBack, subtitle }: { onBack: () => void; subtitle: string }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <button className={styles.backBtn} onClick={onBack} aria-label="戻る">
          <BackIcon/>
        </button>
        <div className={styles.headerTitles}>
          <div className={styles.headerTitle}>カメラ画像</div>
          <div className={styles.headerSubtitle}>{subtitle}</div>
        </div>
      </div>
    </header>
  )
}

function Footer({
  count,
  onClear,
  onAnalyze,
  disabled,
}: {
  count: number
  onClear: () => void
  onAnalyze: () => void
  disabled: boolean
}) {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerLeft}>
        <span className={styles.footerCount}>{count}枚選択</span>
        <button className={styles.clearBtn} onClick={onClear} disabled={disabled}>
          解除
        </button>
      </div>
      <button className={styles.analyzeBtn} onClick={onAnalyze} disabled={disabled}>
        AI解析にかける
      </button>
    </footer>
  )
}
