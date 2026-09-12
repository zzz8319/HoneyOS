import { useState, useMemo } from 'react'
import {
  X, Calendar, Sun, ChevronRight,
  Search, SlidersHorizontal,
} from 'lucide-react'
import {
  MOCK_COLONIES, APIARIES, sortColonies,
  type SelectableColony,
} from './mockData'
import styles from './InspectionStartScreen.module.css'

export type InspectionStartViewState =
  | 'normal' | 'selected' | 'empty' | 'loading' | 'error' | 'offline'

interface Props {
  viewState?: InspectionStartViewState
  initialColonyId?: string   // SCR-009のCTAから来た場合は選択済みで開く
  onClose?: () => void
  onStart?: (params: {
    colonyId: string
    inspDate: string
    weather: string
    temperature: number
  }) => void
}

// 状態バッジの配色
const BADGE_CLASS: Record<string, string> = {
  overdue: 'badgeOverdue',
  danger:  'badgeDanger',
  warn:    'badgeWarn',
  good:    'badgeGood',
}

// 構成比バー色
const BAR_COLORS = {
  bee:   '#3D4551',
  brood: '#E07B6A',
  honey: '#D97706',
  empty: '#D1D5DB',
}

interface CompositionBarProps {
  bee: number; brood: number; honey: number; empty: number
}
function CompositionBar({ bee, brood, honey, empty }: CompositionBarProps) {
  const total = bee + brood + honey + empty || 1
  const pct = (v: number) => `${Math.round((v / total) * 100)}%`
  const segs = [
    { key: 'bee',   color: BAR_COLORS.bee,   val: bee },
    { key: 'brood', color: BAR_COLORS.brood, val: brood },
    { key: 'honey', color: BAR_COLORS.honey, val: honey },
    { key: 'empty', color: BAR_COLORS.empty, val: empty },
  ]
  return (
    <div className={styles.compBar} aria-hidden>
      {segs.map(s => (
        <div
          key={s.key}
          className={styles.compSeg}
          style={{ flex: s.val, background: s.color }}
        >
          {Math.round((s.val / total) * 100) >= 12 && (
            <span className={styles.compPct}>{pct(s.val)}</span>
          )}
        </div>
      ))}
    </div>
  )
}

function deltaPct(curr: number, prev: number): string {
  const d = curr - prev
  return (d >= 0 ? '+' : '') + d + '%'
}

interface ColonyCardProps {
  colony: SelectableColony
  selected: boolean
  onSelect: () => void
  disabled?: boolean
}
function ColonyCard({ colony, selected, onSelect, disabled }: ColonyCardProps) {
  const beeD  = colony.bee   - colony.prevBee
  const totalPrev = colony.prevBee + colony.prevBrood + colony.prevHoney + colony.prevEmpty
  const beeTotal = totalPrev ? Math.round((beeD / totalPrev) * 100) : 0

  return (
    <button
      className={`${styles.colonyCard} ${selected ? styles.colonyCardSelected : ''}`}
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
    >
      {/* ラジオ */}
      <div className={`${styles.radio} ${selected ? styles.radioSelected : ''}`}>
        {selected && <div className={styles.radioDot} />}
      </div>

      <div className={styles.cardBody}>
        {/* 上段: ID / 養蜂場 / バッジ・経過 */}
        <div className={styles.cardTop}>
          <div className={styles.cardIds}>
            <span className={styles.colonyIdText}>{colony.colonyId}</span>
            <span className={styles.apiaryText}>{colony.apiaryName}</span>
          </div>
          <div className={styles.cardRight}>
            <span className={`${styles.badge} ${styles[BADGE_CLASS[colony.status]]}`}>
              {colony.statusLabel}
            </span>
            <span className={styles.daysAgo}>{colony.lastInspDateLabel}</span>
          </div>
        </div>

        {/* 中段: 構成比バー */}
        <CompositionBar
          bee={colony.bee}
          brood={colony.brood}
          honey={colony.honey}
          empty={colony.empty}
        />

        {/* 下段: 前回比 */}
        <div className={styles.cardBottom}>
          <span className={styles.prevLabel}>前回比</span>
          <span className={beeTotal >= 0 ? styles.deltaUp : styles.deltaDown}>
            {deltaPct(colony.bee, colony.prevBee)}（蜂）
          </span>
          <span className={styles.prevSep}>前回</span>
          <span className={styles.prevDate}>{colony.prevInspDate}</span>
        </div>
      </div>
    </button>
  )
}

// スケルトンカード
function SkeletonCard() {
  return (
    <div className={styles.skelCard}>
      <div className={`${styles.skel} ${styles.skelRadio}`} />
      <div className={styles.skelBody}>
        <div className={`${styles.skel} ${styles.skelLine}`} style={{ width: '60%' }} />
        <div className={`${styles.skel} ${styles.skelBar}`} />
        <div className={`${styles.skel} ${styles.skelLine}`} style={{ width: '40%' }} />
      </div>
    </div>
  )
}

// 凡例
function Legend() {
  return (
    <div className={styles.legend}>
      {[
        { color: BAR_COLORS.bee,   label: '蜂' },
        { color: BAR_COLORS.brood, label: '育児' },
        { color: BAR_COLORS.honey, label: '貯蜜' },
        { color: BAR_COLORS.empty, label: '空間' },
      ].map(({ color, label }) => (
        <span key={label} className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: color }} />
          {label}
        </span>
      ))}
    </div>
  )
}

export function InspectionStartScreen({
  viewState = 'normal',
  initialColonyId,
  onClose,
  onStart,
}: Props) {
  const isLoading = viewState === 'loading'
  const isError   = viewState === 'error'
  const isOffline = viewState === 'offline'
  const isEmpty   = viewState === 'empty'

  const [selectedId, setSelectedId]   = useState<string | null>(
    viewState === 'selected' ? (initialColonyId ?? 'a03') : (initialColonyId ?? null),
  )
  const [apiaryFilter, setApiaryFilter] = useState('all')
  const [searchQuery, setSearchQuery]   = useState('')

  const inspDate = '2026年9月8日（火）'
  const weather  = '晴れ'
  const temperature = 28

  const filtered = useMemo(() => {
    let list = sortColonies(MOCK_COLONIES)
    if (apiaryFilter !== 'all') list = list.filter(c => c.apiaryKey === apiaryFilter)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(c =>
        c.colonyId.toLowerCase().includes(q) || c.apiaryName.includes(q),
      )
    }
    // offlineは cached のみ
    if (isOffline) list = list.filter(c => c.cached)
    return list
  }, [apiaryFilter, searchQuery, isOffline])

  const selectedColony = MOCK_COLONIES.find(c => c.id === selectedId) ?? null

  const handleStart = () => {
    if (!selectedColony) return
    onStart?.({
      colonyId: selectedColony.id,
      inspDate,
      weather,
      temperature,
    })
  }

  return (
    <div className={styles.shell}>
      {/* ===== ヘッダー ===== */}
      <header className={styles.header}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="閉じる">
          <X size={20} aria-hidden />
        </button>
        <h1 className={styles.headerTitle}>内検を始める</h1>
        <div className={styles.headerSpacer} />
      </header>

      {/* ===== 進捗インジケータ ===== */}
      <div className={styles.progress}>
        <div className={styles.progressMeta}>
          <span className={styles.progressStep}>1 / 2</span>
          <span className={styles.progressLabel}>蜂群を選択</span>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: '50%' }} />
        </div>
      </div>

      {/* ===== スクロールコンテンツ ===== */}
      <main className={styles.content}>

        {/* 養蜂場タブ */}
        <div className={styles.apiaryTabs} role="tablist">
          {APIARIES.map(a => (
            <button
              key={a.key}
              role="tab"
              aria-selected={apiaryFilter === a.key}
              className={`${styles.apiaryTab} ${apiaryFilter === a.key ? styles.apiaryTabActive : ''}`}
              onClick={() => setApiaryFilter(a.key)}
            >
              {a.label}
            </button>
          ))}
        </div>

        {/* 検索・ソート */}
        <div className={styles.searchRow}>
          <div className={styles.searchInputWrap}>
            <Search size={15} className={styles.searchIcon} aria-hidden />
            <input
              className={styles.searchInput}
              type="search"
              placeholder="蜂群ID・メモで検索"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button className={styles.filterBtn} aria-label="フィルター">
            <SlidersHorizontal size={18} aria-hidden />
          </button>
        </div>
        <div className={styles.sortRow}>
          <span className={styles.sortLabel}>並び替え</span>
          <div className={styles.sortSelectWrap}>
            <select className={styles.sortSelect} defaultValue="recommended">
              <option value="recommended">最終内検順（新しい順） ▼</option>
            </select>
          </div>
        </div>

        {/* オフラインバナー */}
        {isOffline && (
          <div className={styles.offlineBanner}>
            オフラインです。キャッシュ済み蜂群から選択できます。
          </div>
        )}

        {/* エラー */}
        {isError && (
          <div className={styles.errorSection}>
            <span className={styles.errorMsg}>データの取得に失敗しました。</span>
            <button className={styles.retryBtn}>再試行</button>
          </div>
        )}

        {/* 空状態 */}
        {!isLoading && !isError && isEmpty && (
          <div className={styles.emptyWrap}>
            <span className={styles.emptyEmoji}>🐝</span>
            <p className={styles.emptyTitle}>条件に合う蜂群がありません</p>
            <button className={styles.clearBtn} onClick={() => { setApiaryFilter('all'); setSearchQuery('') }}>
              フィルターを解除
            </button>
          </div>
        )}

        {/* スケルトン */}
        {isLoading && (
          <div className={styles.cardList}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* 蜂群リスト */}
        {!isLoading && !isError && !isEmpty && (
          <>
            <div className={styles.cardList} role="radiogroup" aria-label="蜂群選択">
              {filtered.map(colony => (
                <ColonyCard
                  key={colony.id}
                  colony={colony}
                  selected={selectedId === colony.id}
                  onSelect={() => setSelectedId(colony.id)}
                  disabled={isOffline && !colony.cached}
                />
              ))}
            </div>
            <Legend />
          </>
        )}

        {/* ===== 内検準備情報 ===== */}
        {!isLoading && !isError && (
          <div className={styles.prepSection}>
            <button className={styles.prepRow}>
              <Calendar size={18} className={styles.prepIcon} aria-hidden />
              <span className={styles.prepKey}>内検日</span>
              <span className={styles.prepVal}>{inspDate}</span>
              <ChevronRight size={16} className={styles.prepChevron} aria-hidden />
            </button>
            <div className={styles.prepDivider} />
            <button className={styles.prepRow}>
              <Sun size={18} className={styles.prepIcon} aria-hidden />
              <span className={styles.prepKey}>天気</span>
              <span className={styles.prepVal}>{weather} {temperature}℃ （自動取得）</span>
              <ChevronRight size={16} className={styles.prepChevron} aria-hidden />
            </button>
          </div>
        )}

      </main>

      {/* ===== 固定CTAボタン ===== */}
      <div className={styles.ctaWrap}>
        <button
          className={`${styles.ctaBtn} ${selectedId ? styles.ctaBtnActive : ''}`}
          disabled={!selectedId}
          onClick={handleStart}
          data-testid="inspection-cta"
        >
          {selectedId ? 'この蜂群で始める' : '蜂群を選択'}
        </button>
      </div>
    </div>
  )
}
