import { useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, MoreVertical, Plus, ChevronRight as ChevronRightSmall } from 'lucide-react'
import type { ViewerStage, FrameRecord, InspectionRecord, EditTarget, ViewerViewState } from './types'
import { MOCK_RECORDS, getInitialRecord, getInitialSelected, getRecordIndex } from './mockData'
import styles from './FrameViewerScreen.module.css'

export type { ViewerViewState }

const BAR = {
  bee:   '#3D4551',
  brood: '#E07B6A',
  honey: '#D97706',
  empty: '#E3E5E8',
}

const QUEEN_LABEL: Record<string, string> = {
  laying:      '産卵中',
  unconfirmed: '未確認',
  concern:     '不安',
}

const QUEEN_BADGE_CLASS: Record<string, string> = {
  laying:      'queenBadgeLaying',
  unconfirmed: 'queenBadgeUnconfirmed',
  concern:     'queenBadgeConcern',
}

// ── FrameMiniBar ─────────────────────────────────────────────────────────────
function FrameMiniBar({ frame, isFoundation }: { frame: FrameRecord | null; isFoundation: boolean }) {
  if (isFoundation) {
    return <div className={`${styles.miniBar} ${styles.miniBarFoundation}`} />
  }
  if (!frame) {
    return <div className={`${styles.miniBar} ${styles.miniBarEmpty}`} />
  }
  const empty = Math.max(0, 100 - frame.bee - frame.brood - frame.honey)
  return (
    <div className={styles.miniBar}>
      <div style={{ flex: frame.bee,   background: BAR.bee   }} />
      <div style={{ flex: frame.brood, background: BAR.brood }} />
      <div style={{ flex: frame.honey, background: BAR.honey }} />
      <div style={{ flex: empty,       background: BAR.empty }} />
    </div>
  )
}

// ── QueenExcluder ────────────────────────────────────────────────────────────
function QueenExcluder() {
  return (
    <div className={styles.queenExcluder} aria-label="隔王板">
      <span className={styles.queenExcluderLabel}>隔王板</span>
    </div>
  )
}

// ── StageSection ─────────────────────────────────────────────────────────────
interface StageSectionProps {
  stage: ViewerStage
  frameOffset: number
  selectedFrameIndex: number | null
  onFrameSelect: (i: number) => void
}
function StageSection({ stage, frameOffset, selectedFrameIndex, onFrameSelect }: StageSectionProps) {
  return (
    <div className={styles.stageSection}>
      <div className={styles.stageHeader}>
        <div className={styles.stageHeaderLeft}>
          <span className={styles.stageIndicator} aria-hidden />
          <span className={styles.stageName}>{stage.label}{'　'}{stage.frameCount}枠</span>
        </div>
        <button className={styles.stageMenuBtn} type="button" aria-label={`${stage.label}のメニュー`} disabled>
          <MoreVertical size={16} aria-hidden />
        </button>
      </div>

      <div
        className={styles.frameGrid}
        role="radiogroup"
        aria-label={`${stage.label}の枠一覧`}
        style={{ gridTemplateColumns: `repeat(${stage.frameCount}, 1fr)` }}
      >
        {stage.frames.map((frame, i) => {
          const isFoundation = stage.foundationFrames.includes(i)
          const hasAlert = stage.alertFrames.includes(i)
          const isActive = selectedFrameIndex === i
          const displayNum = frameOffset + i + 1
          return (
            <button
              key={i}
              className={`${styles.frameCard} ${isActive ? styles.frameCardActive : ''}`}
              onClick={() => onFrameSelect(i)}
              aria-pressed={isActive}
              aria-label={`${displayNum}枠目${frame ? '（記録済み）' : isFoundation ? '（巣礎）' : '（未記録）'}`}
              type="button"
            >
              <FrameMiniBar frame={frame} isFoundation={isFoundation} />
              <span className={styles.frameNum}>{displayNum}</span>
              {hasAlert && <span className={styles.alertBadge} aria-label="注意">！</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── DetailPanel ───────────────────────────────────────────────────────────────
interface DetailPanelProps {
  stage: ViewerStage
  frameIndex: number
  frameOffset: number
  onClose: () => void
  onEdit: (target: EditTarget) => void
  onMemo: () => void
  onAddStage: () => void
}
function DetailPanel({ stage, frameIndex, frameOffset, onClose, onEdit, onMemo, onAddStage }: DetailPanelProps) {
  const frame = stage.frames[frameIndex]
  const empty = frame ? Math.max(0, 100 - frame.bee - frame.brood - frame.honey) : 100
  const displayNum = frameOffset + frameIndex + 1

  return (
    <div className={styles.detailPanel}>
      <div className={styles.detailDragHandle} aria-hidden />
      <div className={styles.detailHeader}>
        <h3 className={styles.detailTitle}>{displayNum}枠目</h3>
        <button className={styles.detailCloseBtn} onClick={onClose} type="button" aria-label="パネルを閉じる">×</button>
      </div>
      <div className={styles.detailBody}>
        {/* Compact horizontal composition — single row */}
        <div className={styles.compositionCompact}>
          {([
            { color: BAR.bee,   label: '蜂',   value: frame?.bee   ?? 0 },
            { color: BAR.brood, label: '育児', value: frame?.brood ?? 0 },
            { color: BAR.honey, label: '貯蜜', value: frame?.honey ?? 0 },
            { color: BAR.empty, label: '空き', value: empty },
          ] as const).map(({ color, label, value }) => (
            <span key={label} className={styles.compositionChip}>
              <span className={styles.compositionChipDot} style={{ background: color }} />
              <span className={styles.compositionChipLabel}>{label}</span>
              <span className={styles.compositionChipValue}>{value}%</span>
            </span>
          ))}
        </div>

        <button
          className={styles.editBtn}
          type="button"
          onClick={() => onEdit({ stageId: stage.id, frameIndex })}
        >
          編集する
        </button>

        <div className={styles.memoRow} role="button" tabIndex={0} onClick={onMemo} onKeyDown={e => e.key === 'Enter' && onMemo()}>
          <span className={styles.memoLabel}>この日の内検メモ</span>
          <span className={styles.memoValue}>タップで確認・編集</span>
          <ChevronRightSmall size={16} className={styles.memoChevron} aria-hidden />
        </div>

        <button className={styles.detailAddStageBtn} type="button" onClick={onAddStage}>
          <Plus size={14} aria-hidden />
          段を追加
        </button>
      </div>
    </div>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────
interface Props {
  viewState?: ViewerViewState
  initialRecord?: InspectionRecord
  onBack?: () => void
  onEdit?: (target: EditTarget, record: InspectionRecord) => void
  onAddStage?: (record: InspectionRecord) => void
}

export function FrameViewerScreen({
  viewState = 'normal',
  initialRecord,
  onBack,
  onEdit,
  onAddStage,
}: Props) {
  const isLoading = viewState === 'loading'
  const isEmpty   = viewState === 'empty'
  const isError   = viewState === 'error'
  const isOffline = viewState === 'offline'

  const [recordIndex, setRecordIndex] = useState(() => getRecordIndex(viewState))
  const [selected, setSelected] = useState<{ stageId: string; frameIndex: number } | null>(
    () => getInitialSelected(viewState),
  )

  const records = MOCK_RECORDS
  const record = initialRecord ?? records[recordIndex] ?? getInitialRecord(viewState)

  const canGoPrev = recordIndex < records.length - 1
  const canGoNext = recordIndex > 0

  const goPrev = () => { if (canGoPrev) { setRecordIndex(i => i + 1); setSelected(null) } }
  const goNext = () => { if (canGoNext) { setRecordIndex(i => i - 1); setSelected(null) } }

  const handleFrameSelect = (stageId: string, frameIndex: number) => {
    setSelected(prev =>
      prev?.stageId === stageId && prev.frameIndex === frameIndex ? null : { stageId, frameIndex }
    )
  }

  const handleEdit = (target: EditTarget) => {
    onEdit?.(target, record)
  }

  const estimatedBees = record.stages.reduce((sum, st) =>
    sum + st.frames.reduce((fs, f) =>
      f ? fs + Math.round(f.bee / 100 * 10000) : fs, 0), 0)

  const stageOffsets = (() => {
    const map: Record<string, number> = {}
    let offset = 0
    for (const st of [...record.stages].reverse()) {
      map[st.id] = offset
      offset += st.frameCount
    }
    return map
  })()

  const selectedStage = selected
    ? record.stages.find(s => s.id === selected.stageId) ?? null
    : null

  const showNormal = !isLoading && !isEmpty && !isError

  return (
    <div className={styles.shell}>

      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} type="button" aria-label="戻る">
          <ArrowLeft size={20} aria-hidden />
        </button>
        <h1 className={styles.headerTitle}>{record.colonyLabel} 枠ビューア</h1>
        <button className={styles.menuBtn} type="button" aria-label="メニュー" disabled>
          <MoreVertical size={20} aria-hidden />
        </button>
      </header>

      {/* Date switcher */}
      <div className={styles.dateSwitcher}>
        <button className={styles.dateArrowBtn} onClick={goPrev} disabled={!canGoPrev} type="button" aria-label="前の内検記録">
          <ChevronLeft size={18} aria-hidden />
        </button>
        <div className={styles.dateCenter}>
          <span className={styles.dateLabel}>{record.inspDate.replace(/（.+）/, '')}</span>
          <span className={styles.dateHint}>左右にスワイプで履歴</span>
        </div>
        <button className={styles.dateArrowBtn} onClick={goNext} disabled={!canGoNext} type="button" aria-label="次の内検記録">
          <ChevronRight size={18} aria-hidden />
        </button>
      </div>

      {/* Top section — non-scrollable */}
      {showNormal && (
        <div className={styles.topSection}>
          {isOffline && (
            <div className={styles.offlineBanner}>
              オフラインです。キャッシュ済みの記録を表示しています。
            </div>
          )}

          {/* Summary card */}
          <div className={styles.summaryCard}>
            <div className={styles.summaryCell}>
              <span className={styles.summaryIcon}>🐝</span>
              <div className={styles.summaryText}>
                <span className={styles.summaryLabel}>推定総蜂数</span>
                <span className={styles.summaryValue}>
                  {estimatedBees.toLocaleString()}匹
                </span>
              </div>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryCell}>
              <span className={styles.summaryIcon}>👑</span>
              <div className={styles.summaryText}>
                <span className={styles.summaryLabel}>女王</span>
                <span className={`${styles.queenBadge} ${styles[QUEEN_BADGE_CLASS[record.queenStatus ?? 'unconfirmed']]}`}>
                  {record.queenStatus ? QUEEN_LABEL[record.queenStatus] : '未確認'}
                </span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className={styles.legend}>
            {([
              { color: BAR.bee,   label: '蜂' },
              { color: BAR.brood, label: '育児' },
              { color: BAR.honey, label: '貯蜜' },
              { color: BAR.empty, label: '空き' },
            ] as const).map(({ color, label }) => (
              <span key={label} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: color }} />
                {label}
              </span>
            ))}
            <span className={styles.legendItem}>
              <span className={styles.legendDotFoundation} />
              巣礎
            </span>
          </div>

          {/* Add stage */}
          <button className={styles.addStageBtn} type="button" onClick={() => onAddStage?.(record)}>
            <Plus size={15} aria-hidden />
            段を追加
          </button>
        </div>
      )}

      {/* Scrollable content — stages only */}
      <main className={styles.content}>

        {isLoading && (
          <>
            <div className={`${styles.skeleton} ${styles.skeletonSummary}`} />
            <div className={`${styles.skeleton} ${styles.skeletonStage}`} />
            <div className={`${styles.skeleton} ${styles.skeletonStage}`} />
          </>
        )}

        {isEmpty && (
          <div className={styles.centerState}>
            <span className={styles.stateIcon}>🐝</span>
            <h2 className={styles.stateTitle}>内検記録がありません</h2>
            <p className={styles.stateDesc}>この蜂群にはまだ内検記録がありません。</p>
          </div>
        )}

        {isError && (
          <div className={styles.centerState}>
            <span className={styles.stateIcon}>⚠️</span>
            <h2 className={styles.stateTitle}>記録を取得できませんでした</h2>
            <p className={styles.stateDesc}>ネットワークエラーが発生しました。</p>
            <button className={styles.retryBtn} type="button" onClick={() => {}}>再試行</button>
          </div>
        )}

        {showNormal && (
          <>
            {record.stages.map(stage => (
              <div key={stage.id}>
                {stage.hasQueenExcluderAbove && <QueenExcluder />}
                <StageSection
                  stage={stage}
                  frameOffset={stageOffsets[stage.id] ?? 0}
                  selectedFrameIndex={
                    selected?.stageId === stage.id ? selected.frameIndex : null
                  }
                  onFrameSelect={i => handleFrameSelect(stage.id, i)}
                />
              </div>
            ))}
          </>
        )}
      </main>

      {/* Bottom sheet detail panel — no overlay */}
      {showNormal && selected && selectedStage && (
        <DetailPanel
          stage={selectedStage}
          frameIndex={selected.frameIndex}
          frameOffset={stageOffsets[selectedStage.id] ?? 0}
          onClose={() => setSelected(null)}
          onEdit={handleEdit}
          onMemo={() => alert('内検メモ（未実装）')}
          onAddStage={() => onAddStage?.(record)}
        />
      )}
    </div>
  )
}
