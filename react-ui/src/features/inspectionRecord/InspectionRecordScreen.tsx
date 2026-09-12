import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, ChevronDown, Plus, MoreVertical } from 'lucide-react'
import type { FrameRecord, StageRecord, QueenStatus, InspectionSession, RecordViewState } from './types'
import { DEFAULT_SESSION, getInitialStages, getInitialEditPos } from './mockData'
import { DraftStore } from './InspectionDraftStore'
import styles from './InspectionRecordScreen.module.css'

export type { RecordViewState }

// ── Color palette ────────────────────────────────────────────────────────────
const BAR = {
  bee:   '#3D4551',
  brood: '#E07B6A',
  honey: '#D97706',
  empty: '#E3E5E8',
}

// ── FrameMiniBar ─────────────────────────────────────────────────────────────
function FrameMiniBar({ frame }: { frame: FrameRecord | null }) {
  if (!frame) {
    return <div className={styles.miniBar}><div style={{ flex: 1, background: BAR.empty }} /></div>
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

// ── FrameStrip ───────────────────────────────────────────────────────────────
interface FrameStripProps {
  frames: (FrameRecord | null)[]
  activeIndex: number
  onSelect: (i: number) => void
  disabled?: boolean
}
function FrameStrip({ frames, activeIndex, onSelect, disabled }: FrameStripProps) {
  return (
    <div className={styles.frameStrip} role="radiogroup" aria-label="枠選択">
      {frames.map((frame, i) => (
        <button
          key={i}
          className={`${styles.frameBtn} ${activeIndex === i ? styles.frameBtnActive : ''} ${!frame ? styles.frameBtnEmpty : ''}`}
          onClick={() => onSelect(i)}
          disabled={disabled}
          aria-pressed={activeIndex === i}
          aria-label={`${i + 1}枠目${frame ? '（記録済み）' : '（未記録）'}`}
        >
          <FrameMiniBar frame={frame} />
          <span className={styles.frameNum}>{i + 1}</span>
        </button>
      ))}
    </div>
  )
}

// ── SliderRow ────────────────────────────────────────────────────────────────
interface SliderRowProps {
  label: string
  color: string
  value: number
  maxVal: number
  onChange: (v: number) => void
}
function SliderRow({ label, color, value, maxVal, onChange }: SliderRowProps) {
  const dec = () => onChange(Math.max(0, value - 5))
  const inc = () => onChange(Math.min(maxVal, value + 5))
  return (
    <div className={styles.sliderRow}>
      <span className={styles.sliderLabel} style={{ color }}>{label}</span>
      <button className={styles.adjBtn} onClick={dec} aria-label={`${label}を減らす`} type="button">－</button>
      <input
        type="range" min={0} max={maxVal} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={styles.slider}
        aria-label={`${label} ${value}%`}
        style={{ '--thumb-color': color } as React.CSSProperties}
      />
      <span className={styles.sliderValue}>{value}%</span>
      <button className={styles.adjBtn} onClick={inc} aria-label={`${label}を増やす`} type="button">＋</button>
    </div>
  )
}

// ── FrameCompositionEditor ───────────────────────────────────────────────────
interface FrameEditorProps {
  frameIndex: number
  frame: FrameRecord
  onChange: (frame: FrameRecord) => void
}
function FrameCompositionEditor({ frameIndex, frame, onChange }: FrameEditorProps) {
  const empty = Math.max(0, 100 - frame.bee - frame.brood - frame.honey)

  const update = (key: keyof FrameRecord, val: number) => {
    const next = { ...frame, [key]: val }
    if (next.bee + next.brood + next.honey > 100) return
    onChange(next)
  }

  const maxBee   = 100 - frame.brood - frame.honey
  const maxBrood = 100 - frame.bee   - frame.honey
  const maxHoney = 100 - frame.bee   - frame.brood

  return (
    <div className={styles.editorSection}>
      <h3 className={styles.editorTitle}>{frameIndex + 1}枠目を編集</h3>
      <div className={styles.editorPreview}>
        <div style={{ flex: frame.bee,   background: BAR.bee   }} />
        <div style={{ flex: frame.brood, background: BAR.brood }} />
        <div style={{ flex: frame.honey, background: BAR.honey }} />
        <div style={{ flex: empty,       background: BAR.empty }} />
      </div>
      <SliderRow label="蜂"   color={BAR.bee}   value={frame.bee}   maxVal={maxBee}   onChange={v => update('bee',   v)} />
      <SliderRow label="育児" color={BAR.brood} value={frame.brood} maxVal={maxBrood} onChange={v => update('brood', v)} />
      <SliderRow label="貯蜜" color={BAR.honey} value={frame.honey} maxVal={maxHoney} onChange={v => update('honey', v)} />
      <div className={styles.emptyRow}>
        <span className={styles.emptyLabel}>空間</span>
        <span className={styles.emptyValue}>{empty}%</span>
        <span className={styles.emptyNote}>（自動計算）</span>
      </div>
    </div>
  )
}

// ── Legend ───────────────────────────────────────────────────────────────────
function Legend({ estimated }: { estimated: number }) {
  return (
    <div className={styles.legendArea}>
      <div className={styles.legend}>
        {([
          { color: BAR.bee,   label: '蜂' },
          { color: BAR.brood, label: '育児' },
          { color: BAR.honey, label: '貯蜜' },
          { color: BAR.empty, label: '空間' },
        ] as const).map(({ color, label }) => (
          <span key={label} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
      {estimated > 0 && (
        <span className={styles.estCount}>
          推定総蜂数 {estimated.toLocaleString()}匹
        </span>
      )}
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

// ── QueenStatusSelector ──────────────────────────────────────────────────────
const QUEEN_OPTIONS: { value: QueenStatus; label: string }[] = [
  { value: 'laying',      label: '産卵中' },
  { value: 'unconfirmed', label: '未確認' },
  { value: 'concern',     label: '不安'   },
]
function QueenStatusSelector({ value, onChange }: { value: QueenStatus | null; onChange: (v: QueenStatus) => void }) {
  return (
    <div className={styles.sectionCard}>
      <h3 className={styles.sectionTitle}>女王の状態</h3>
      <div className={styles.chipRow}>
        {QUEEN_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            className={`${styles.chip} ${value === opt.value ? styles.chipActive : ''}`}
            onClick={() => onChange(opt.value)}
            aria-pressed={value === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── ObservationChips ─────────────────────────────────────────────────────────
const OBS_OPTIONS = ['巣礎', '空巣房']
function ObservationChips({ values, onChange }: { values: string[]; onChange: (v: string[]) => void }) {
  const toggle = (obs: string) => {
    onChange(values.includes(obs) ? values.filter(v => v !== obs) : [...values, obs])
  }
  return (
    <div className={styles.sectionCard}>
      <h3 className={styles.sectionTitle}>その他の所見</h3>
      <div className={styles.chipRow}>
        {OBS_OPTIONS.map(opt => (
          <button
            key={opt}
            type="button"
            className={`${styles.chip} ${values.includes(opt) ? styles.chipActive : ''}`}
            onClick={() => toggle(opt)}
            aria-pressed={values.includes(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── StageAccordion ───────────────────────────────────────────────────────────
interface StageAccordionProps {
  stage: StageRecord
  isActiveStage: boolean
  activeFrameIndex: number
  onToggle: () => void
  onFrameSelect: (i: number) => void
  onFrameChange: (i: number, f: FrameRecord) => void
  onFrameNav: (dir: 'prev' | 'next') => void
  onStageMenu: () => void
}
function StageAccordion({
  stage, isActiveStage, activeFrameIndex,
  onToggle, onFrameSelect, onFrameChange, onFrameNav, onStageMenu,
}: StageAccordionProps) {
  const recorded = stage.frames.filter(Boolean).length
  const activeFrame = stage.frames[activeFrameIndex]

  return (
    <div className={`${styles.stage} ${isActiveStage ? styles.stageActive : ''}`}>
      <div className={styles.stageHeader}>
        <button
          className={styles.stageToggleBtn}
          onClick={onToggle}
          aria-expanded={stage.isExpanded}
        >
          <span className={styles.stageName}>{stage.label}</span>
          <span className={styles.stageInfo}>
            {stage.frameCount}枠
            {recorded > 0 && <span className={styles.stageRecorded}> {recorded}/{stage.frameCount}記録済み</span>}
          </span>
          <ChevronDown
            size={16}
            className={`${styles.chevron} ${stage.isExpanded ? styles.chevronOpen : ''}`}
            aria-hidden
          />
        </button>
        <button
          className={styles.stageMenuBtn}
          onClick={e => { e.stopPropagation(); onStageMenu() }}
          aria-label={`${stage.label}のメニュー`}
          type="button"
        >
          <MoreVertical size={16} aria-hidden />
        </button>
      </div>

      {stage.isExpanded && (
        <div className={styles.stageBody}>
          <FrameStrip
            frames={stage.frames}
            activeIndex={isActiveStage ? activeFrameIndex : -1}
            onSelect={onFrameSelect}
          />

          {isActiveStage && (
            <>
              <FrameCompositionEditor
                frameIndex={activeFrameIndex}
                frame={activeFrame ?? { bee: 0, brood: 0, honey: 0 }}
                onChange={f => onFrameChange(activeFrameIndex, f)}
              />
              <div className={styles.frameNav}>
                <button
                  className={styles.frameNavBtn}
                  onClick={() => onFrameNav('prev')}
                  disabled={activeFrameIndex === 0}
                  type="button"
                >
                  ← 前の枠
                </button>
                <span className={styles.frameNavCount}>
                  {recorded} / {stage.frameCount}枠入力済み
                </span>
                <button
                  className={styles.frameNavBtn}
                  onClick={() => onFrameNav('next')}
                  disabled={activeFrameIndex >= stage.frameCount - 1}
                  type="button"
                >
                  次の枠 →
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── InspectionRecordScreen (main) ─────────────────────────────────────────────
interface Props {
  viewState?: RecordViewState
  session?: InspectionSession
  onBack?: () => void
  onReselect?: () => void
  onSave?: (params: {
    stages: StageRecord[]
    queenStatus: QueenStatus | null
    observations: string[]
  }) => void
}

export function InspectionRecordScreen({
  viewState = 'normal',
  session = DEFAULT_SESSION,
  onBack,
  onReselect,
  onSave,
}: Props) {
  const isOffline     = viewState === 'offline'
  const isSaveError   = viewState === 'save-error'
  const isDraftRestore= viewState === 'draft-restore'

  const [stages, setStages] = useState<StageRecord[]>(() => getInitialStages(viewState))
  const [queenStatus, setQueenStatus] = useState<QueenStatus | null>(
    viewState === 'unsaved' ? null : 'laying'
  )
  const [observations, setObservations] = useState<string[]>(
    viewState === 'saved' ? ['巣礎'] : []
  )
  const [editPos, setEditPos] = useState(() => getInitialEditPos(viewState))
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(
    isSaveError ? 'ネットワークエラーが発生しました。再試行してください。' : null
  )
  const [draftMsg, setDraftMsg] = useState<string | null>(
    isDraftRestore ? '前回の下書きを復元しました' : null
  )
  const [draftSaved, setDraftSaved] = useState(isOffline)

  // Auto-save draft (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      DraftStore.save(session.colonyId, { stages, queenStatus, observations, savedAt: new Date().toISOString() })
      if (isOffline) setDraftSaved(true)
    }, 600)
    return () => clearTimeout(t)
  }, [stages, queenStatus, observations, session.colonyId, isOffline])

  const allRecorded = stages.reduce((s, st) => s + st.frames.filter(Boolean).length, 0)
  const totalFrames = stages.reduce((s, st) => s + st.frameCount, 0)
  const allFilled   = allRecorded >= totalFrames
  const canSave     = allFilled && !isSaving

  const estimated = stages.reduce((sum, st) =>
    sum + st.frames.reduce((fs, f) => f ? fs + Math.round(f.bee / 100 * 10000) : fs, 0), 0)

  // Stage toggling
  const toggleStage = useCallback((stageId: string) => {
    setStages(prev => prev.map(s =>
      s.id === stageId ? { ...s, isExpanded: !s.isExpanded } : s
    ))
  }, [])

  // Frame select (also sets active stage)
  const handleFrameSelect = useCallback((stageId: string, frameIndex: number) => {
    setEditPos({ stageId, frameIndex })
    setStages(prev => prev.map(s =>
      s.id === stageId ? { ...s, isExpanded: true } : s
    ))
  }, [])

  // Frame value update
  const handleFrameChange = useCallback((stageId: string, frameIndex: number, frame: FrameRecord) => {
    setStages(prev => prev.map(s => {
      if (s.id !== stageId) return s
      const frames = [...s.frames]
      frames[frameIndex] = frame
      return { ...s, frames }
    }))
  }, [])

  // Frame navigation
  const handleFrameNav = useCallback((dir: 'prev' | 'next') => {
    setEditPos(prev => {
      const stage = stages.find(s => s.id === prev.stageId)
      if (!stage) return prev
      const next = dir === 'prev' ? prev.frameIndex - 1 : prev.frameIndex + 1
      if (next < 0 || next >= stage.frameCount) return prev
      return { ...prev, frameIndex: next }
    })
  }, [stages])

  // Add stage
  const handleAddStage = () => {
    const newId = `stage-${stages.length + 1}`
    setStages(prev => [{
      id: newId,
      label: `${prev.length + 1}段目`,
      frameCount: 8,
      frames: Array(8).fill(null),
      hasQueenExcluderAbove: prev.length > 0,
      isExpanded: true,
    }, ...prev])
    setEditPos({ stageId: newId, frameIndex: 0 })
  }

  const handleSave = () => {
    if (!canSave) return
    setIsSaving(true)
    setSaveError(null)
    setTimeout(() => {
      setIsSaving(false)
      onSave?.({ stages, queenStatus, observations })
    }, 800)
  }

  return (
    <div className={styles.shell}>

      {/* ===== Header ===== */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="戻る" type="button">
          <ArrowLeft size={20} aria-hidden />
        </button>
        <h1 className={styles.headerTitle}>内検記録</h1>
        <div className={styles.headerSpacer} />
      </header>

      {/* ===== Progress ===== */}
      <div className={styles.progress}>
        <div className={styles.progressMeta}>
          <span className={styles.progressStep}>2 / 2</span>
          <span className={styles.progressLabel}>枠を記録</span>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: '100%' }} />
        </div>
      </div>

      {/* ===== Scrollable content ===== */}
      <main className={styles.content}>

        {/* Banners */}
        {isOffline && (
          <div className={styles.offlineBanner}>
            オフラインです。入力内容は下書き保存されます。
            {draftSaved && <span className={styles.draftSavedChip}>下書き保存済</span>}
          </div>
        )}
        {draftMsg && (
          <div className={styles.draftBanner}>
            {draftMsg}
            <button className={styles.bannerClose} onClick={() => setDraftMsg(null)} type="button">×</button>
          </div>
        )}
        {saveError && (
          <div className={styles.errorBanner}>
            <span>{saveError}</span>
            <button className={styles.retryBtn} onClick={handleSave} type="button">再試行</button>
          </div>
        )}

        {/* Colony context row */}
        <button className={styles.colonyRow} onClick={onReselect} type="button" aria-label="蜂群を選び直す">
          <span className={styles.colonyLabel}>{session.colonyLabel}</span>
          <span className={styles.colonyApiary}>{session.apiaryName}</span>
          <span className={styles.colonyBadge}>{session.statusLabel}</span>
          <span className={styles.colonyHint}>選び直す</span>
        </button>

        {/* Mode tabs */}
        <div className={styles.modeTabs} role="tablist">
          <button role="tab" aria-selected className={`${styles.modeTab} ${styles.modeTabActive}`} type="button">枠式</button>
          <button role="tab" aria-selected={false} className={`${styles.modeTab} ${styles.modeTabDisabled}`} disabled type="button">割合式（準備中）</button>
        </div>
        <p className={styles.modeHint}>前回の方式を選択済み</p>

        {/* Add stage */}
        <button className={styles.addStageBtn} onClick={handleAddStage} type="button">
          <Plus size={15} aria-hidden />
          段を追加
        </button>

        {/* Stage list */}
        <div className={styles.stageList}>
          {stages.map(stage => (
            <div key={stage.id}>
              {stage.hasQueenExcluderAbove && <QueenExcluder />}
              <StageAccordion
                stage={stage}
                isActiveStage={stage.id === editPos.stageId}
                activeFrameIndex={editPos.frameIndex}
                onToggle={() => toggleStage(stage.id)}
                onFrameSelect={i => handleFrameSelect(stage.id, i)}
                onFrameChange={(i, f) => handleFrameChange(stage.id, i, f)}
                onFrameNav={handleFrameNav}
                onStageMenu={() => {/* TODO: stage menu */}}
              />
            </div>
          ))}
        </div>

        {/* Legend + estimated bee count */}
        <Legend estimated={estimated} />

        {/* Queen status */}
        <QueenStatusSelector value={queenStatus} onChange={setQueenStatus} />

        {/* Observations */}
        <ObservationChips values={observations} onChange={setObservations} />

        {/* Inline session info */}
        <div className={styles.sessionInfo}>
          <span className={styles.sessionItem}>📅 {session.inspDate}</span>
          <span className={styles.sessionItem}>🌤 {session.weather}</span>
        </div>

      </main>

      {/* ===== Fixed CTA ===== */}
      <div className={styles.ctaWrap}>
        {!allFilled && (
          <p className={styles.ctaHint} data-testid="cta-hint">
            {totalFrames - allRecorded}枠が未入力です
          </p>
        )}
        <button
          className={`${styles.ctaBtn} ${canSave ? styles.ctaBtnActive : ''}`}
          disabled={!canSave}
          onClick={handleSave}
          type="button"
          data-testid="save-cta"
        >
          {isSaving ? '保存中...' : '保存して確認'}
        </button>
      </div>

    </div>
  )
}
