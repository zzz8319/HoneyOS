import { useState, useMemo, useEffect } from 'react'
import {
  X, Calendar, Sun, ChevronRight,
  Search, SlidersHorizontal,
} from 'lucide-react'
import {
  APIARIES, SORT_OPTIONS, sortColonies,
  type SelectableColony, type SortMode,
} from './mockData'
import styles from './InspectionStartScreen.module.css'

export type InspectionStartViewState =
  | 'normal' | 'selected' | 'empty' | 'loading' | 'error' | 'offline'

interface Props {
  viewState?: InspectionStartViewState
  initialColonyId?: string   // SCR-009 CTAから来た場合は選択済みで開く
  onClose?: () => void
  onStart?: (params: {
    colonyId: string
    colonyLabel: string
    apiaryName: string
    statusLabel: string
    inspDate: string
    weather: string
    temperature: number
    previousMode?: 'frame' | 'ratio'
  }) => void
}

// 構成比バー色
const BAR_COLORS = {
  bee:   '#3D4551',
  brood: '#E07B6A',
  honey: '#D97706',
  empty: '#D1D5DB',
}

// 状態バッジスタイル
const BADGE_CLASS: Record<string, string> = {
  overdue: 'badgeOverdue',
  danger:  'badgeDanger',
  warn:    'badgeWarn',
  good:    'badgeGood',
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

function beeDeltaPct(curr: number, prev: number): string {
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
  const beeD = colony.bee - colony.prevBee
  const isUp = beeD >= 0

  return (
    <button
      className={`${styles.colonyCard} ${selected ? styles.colonyCardSelected : ''}`}
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      data-colony-id={colony.id}
    >
      {/* ラジオ */}
      <div className={`${styles.radio} ${selected ? styles.radioSelected : ''}`} aria-hidden>
        {selected && <div className={styles.radioDot} />}
      </div>

      <div className={styles.cardBody}>
        {/* 上段 */}
        <div className={styles.cardTop}>
          <div className={styles.cardIds}>
            <div className={styles.cardNameRow}>
              <span className={styles.colonyIdText}>{colony.colonyId}</span>
              <span className={styles.apiaryText}>{colony.apiaryName}</span>
            </div>
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

        {/* 下段: 蜂量前回比 / 前回内検日 */}
        <div className={styles.cardBottom}>
          <span className={styles.prevLabel}>蜂量の前回比</span>
          <span className={isUp ? styles.deltaUp : styles.deltaDown}>
            {beeDeltaPct(colony.bee, colony.prevBee)}
          </span>
          <span className={styles.prevSep}>前回</span>
          <span className={styles.prevDate}>
            {colony.prevInspDate}（{colony.prevInspRelLabel}）
          </span>
        </div>
      </div>
    </button>
  )
}

function SkeletonCard() {
  return (
    <div className={styles.skelCard}>
      <div className={`${styles.skel} ${styles.skelRadio}`} />
      <div className={styles.skelBody}>
        <div className={`${styles.skel} ${styles.skelLine}`} style={{ width: '60%' }} />
        <div className={`${styles.skel} ${styles.skelBar}`} />
        <div className={`${styles.skel} ${styles.skelLine}`} style={{ width: '45%' }} />
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className={styles.legendWrap}>
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
      <span className={styles.legendNote}>全巣枠の平均構成比</span>
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

  // selected状態: A-05を確実に選択済みにする
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (viewState === 'selected') return initialColonyId ?? 'a5'
    return initialColonyId ?? null
  })

  const [apiaryFilter, setApiaryFilter] = useState('all')
  const [searchQuery, setSearchQuery]   = useState('')
  const [sortMode, setSortMode]         = useState<SortMode>('recommended')
  const [dbColonies, setDbColonies] = useState<SelectableColony[] | null>(null)

  useEffect(() => {
    if (isLoading || isError || isEmpty) return
    const db = window.HoneyDB
    if (!db?.loadColonies) return
    let cancelled = false
    Promise.all([db.loadFarms(), db.loadColonies(), db.loadInspRecords()])
      .then(([farms, colonies, inspRecords]) => {
        if (cancelled) return
        type RawFarm = Record<string, unknown>
        type RawColony = Record<string, unknown>
        type RawInsp = Record<string, unknown>
        const farmMap = new Map((farms as RawFarm[]).map(f => [String(f.id), String(f.name)]))
        const lastInspMap = new Map<string, RawInsp>()
        for (const r of (inspRecords as RawInsp[])) {
          const cid = String(r.colony)
          const prev = lastInspMap.get(cid)
          if (!prev || String(r.date) > String(prev.date)) lastInspMap.set(cid, r)
        }
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const mapped: SelectableColony[] = (colonies as RawColony[]).map(c => {
          const id = String(c.id)
          const name = String(c.name)
          const farmId = c.farmId != null ? String(c.farmId) : null
          const farmName = farmId ? (farmMap.get(farmId) ?? '不明') : '不明'
          const farmKey = farmId ?? 'unknown'
          const lastInsp = lastInspMap.get(id)
          let daysAgo: number | null = null
          let lastLabel = '内検記録なし'
          if (lastInsp?.date) {
            const d = new Date(String(lastInsp.date)); d.setHours(0, 0, 0, 0)
            daysAgo = Math.round((today.getTime() - d.getTime()) / 86400000)
            lastLabel = daysAgo === 0 ? '今日' : `${daysAgo}日前`
          }
          const status = daysAgo === null ? 'overdue' : daysAgo >= 14 ? 'overdue' : daysAgo >= 7 ? 'warn' : 'good'
          const statusLabel = status === 'overdue' ? '期限超過' : status === 'warn' ? '注意' : '良好'
          return {
            id, colonyId: name, apiaryName: farmName, apiaryKey: farmKey,
            status, statusLabel,
            lastInspDaysAgo: daysAgo, lastInspDateLabel: lastLabel,
            bee: 0, brood: 0, honey: 0, empty: 0,
            prevBee: 0, prevBrood: 0, prevHoney: 0, prevEmpty: 0,
            prevInspDate: '', prevInspRelLabel: '',
          } satisfies SelectableColony
        })
        setDbColonies(mapped)
      })
      .catch(() => { if (!cancelled) setDbColonies([]) })
    return () => { cancelled = true }
  }, [viewState, isLoading, isError, isEmpty])

  const colonies = useMemo(() => dbColonies ?? [], [dbColonies])

  const inspDate    = '2026年9月8日（火）'
  const weather     = '晴れ'
  const temperature = 28

  const filtered = useMemo(() => {
    let list = sortColonies(colonies, sortMode)
    if (apiaryFilter !== 'all') list = list.filter(c => c.apiaryKey === apiaryFilter)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(c =>
        c.colonyId.toLowerCase().includes(q) || c.apiaryName.includes(q),
      )
    }
    if (isOffline) list = list.filter(c => c.cached)
    return list
  }, [colonies, apiaryFilter, searchQuery, sortMode, isOffline])

  const selectedColony = colonies.find(c => c.id === selectedId) ?? null

  const handleStart = () => {
    if (!selectedColony) return
    onStart?.({ colonyId: selectedColony.id, colonyLabel: selectedColony.colonyId, apiaryName: selectedColony.apiaryName, statusLabel: selectedColony.statusLabel, inspDate, weather, temperature, previousMode: selectedColony.previousInspectionMode })
  }

  const showList = !isLoading && !isError && !isEmpty

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

      {/* ===== 進捗 ===== */}
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
            <select
              className={styles.sortSelect}
              value={sortMode}
              onChange={e => setSortMode(e.target.value as SortMode)}
              data-testid="sort-select"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
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
            <button
              className={styles.clearBtn}
              onClick={() => { setApiaryFilter('all'); setSearchQuery('') }}
            >
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
        {showList && (
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

        {/* 内検準備情報（loading / error以外は常時表示） */}
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
              <span className={styles.prepVal}>{weather} {temperature}℃（自動取得）</span>
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
