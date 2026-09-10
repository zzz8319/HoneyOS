import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal, Map, Plus } from 'lucide-react'
import { AppHeader, BottomNav, EmptyState, ErrorBanner } from '../../components'
import type { TabId } from '../../components'
import { ColonyCard } from './ColonyCard'
import { COMP_SEGMENTS } from './compositionConfig'
import { mockColonyList } from './mockData'
import type { ColonyListItem } from './mockData'
import styles from './ColonySummaryScreen.module.css'

export type ColonyListViewState = 'normal' | 'empty' | 'loading' | 'error' | 'offline'

type ApiaryTab = 'all' | string  // 'all' または apiaryId

type SortKey = 'inspection'      // 今後拡張可能

const SORT_LABELS: Record<SortKey, string> = {
  inspection: '最終内検順',
}

const STATUS_FILTER_OPTIONS = ['すべて', '良好', '注意', '危険'] as const
type StatusFilter = typeof STATUS_FILTER_OPTIONS[number]

interface ColonySummaryScreenProps {
  viewState?: ColonyListViewState
  activeTab?: TabId
  onTabChange?: (tab: TabId) => void
  onNotifClick?: () => void
  onColonyClick?: (colonyId: string) => void
}

function sortByOldestInspection(a: ColonyListItem, b: ColonyListItem) {
  return a.lastInspectedAt.localeCompare(b.lastInspectedAt)
}

// 凡例コンポーネント
function CompositionLegend() {
  return (
    <div className={styles.legend} aria-label="枠構成比凡例">
      {COMP_SEGMENTS.map(({ label, color }) => (
        <span key={label} className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: color }} aria-hidden />
          {label}
        </span>
      ))}
      <span className={styles.legendNote}>（全巣枠の平均構成比）</span>
    </div>
  )
}

// スケルトンカード
function SkeletonCard() {
  return (
    <div className={styles.skelCard}>
      <div className={styles.skelTop} />
      <div className={styles.skelDate} />
      <div className={styles.skelBar} />
      <div className={styles.skelDelta} />
    </div>
  )
}

export function ColonySummaryScreen({
  viewState = 'normal',
  activeTab = 'farms',
  onTabChange,
  onNotifClick,
  onColonyClick,
}: ColonySummaryScreenProps) {
  const [apiaryTab, setApiaryTab] = useState<ApiaryTab>('all')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('すべて')
  const [sortKey] = useState<SortKey>('inspection')
  const [searchOpen, setSearchOpen] = useState(false)

  const { apiaries, fetchedAt } = mockColonyList

  const apiaryTabOptions = [
    { id: 'all', label: '全て' },
    ...apiaries.map(a => ({
      id: a.id,
      label: a.name.replace(/養蜂場$/, ''),  // 「宮田」「川東」など短縮
    })),
  ]

  const allColonies = useMemo(
    () => apiaries.flatMap(a => a.colonies).sort(sortByOldestInspection),
    [apiaries],
  )

  const filtered = useMemo(() => {
    let list = allColonies
    if (apiaryTab !== 'all') list = list.filter(c => c.apiaryId === apiaryTab)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(c => c.name.toLowerCase().includes(q))
    }
    if (statusFilter !== 'すべて') {
      const map: Record<StatusFilter, string> = { 'すべて': '', '良好': 'good', '注意': 'warn', '危険': 'danger' }
      list = list.filter(c => c.status === map[statusFilter])
    }
    return list
  }, [allColonies, apiaryTab, query, statusFilter])

  // フィルタ済みを養蜂場ごとにグループ化
  const filteredApiaries = useMemo(() =>
    apiaries
      .map(a => ({ ...a, colonies: filtered.filter(c => c.apiaryId === a.id) }))
      .filter(a => a.colonies.length > 0),
    [apiaries, filtered],
  )

  const showContent = viewState === 'normal' || viewState === 'offline'
  const hasResults = filtered.length > 0

  return (
    <div className="app-shell">
      <AppHeader notifCount={0} onNotifClick={onNotifClick} />

      {viewState === 'error' && (
        <ErrorBanner
          message="データの取得に失敗しました。再度お試しください。"
          severity="critical"
        />
      )}
      {viewState === 'offline' && (
        <ErrorBanner
          message={`オフラインです。最終同期: ${fetchedAt}`}
          severity="minor"
        />
      )}

      <main className={styles.content} aria-label="蜂群一覧">

        {/* ===== コンテンツヘッダー ===== */}
        <div className={styles.contentHeader}>
          <div className={styles.titleRow}>
            <h1 className={styles.screenTitle}>蜂群一覧</h1>
            <div className={styles.headerActions}>
              <button
                className={styles.iconBtn}
                aria-label="検索"
                onClick={() => setSearchOpen(v => !v)}
              >
                <Search size={18} aria-hidden />
              </button>
              <button className={styles.iconBtn} aria-label="フィルター">
                <SlidersHorizontal size={18} aria-hidden />
              </button>
              <button className={styles.iconBtn} aria-label="養蜂場配置・地図">
                <Map size={18} aria-hidden />
              </button>
              <button className={styles.addBtn} aria-label="蜂群を追加">
                <Plus size={16} aria-hidden />
              </button>
            </div>
          </div>

          {/* 養蜂場タブ */}
          <div className={styles.apiaryTabs} role="tablist" aria-label="養蜂場選択">
            {apiaryTabOptions.map(({ id, label }) => (
              <button
                key={id}
                role="tab"
                aria-selected={apiaryTab === id}
                className={apiaryTab === id ? styles.tabActive : styles.tab}
                onClick={() => setApiaryTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 検索欄（トグル） */}
          {searchOpen && (
            <div className={styles.searchWrap}>
              <Search size={14} className={styles.searchIcon} aria-hidden />
              <input
                type="search"
                placeholder="蜂群名を検索"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className={styles.searchInput}
                aria-label="蜂群名を検索"
                autoFocus
              />
            </div>
          )}

          {/* 詳細フィルター + 並べ替え */}
          <div className={styles.filterRow}>
            <div className={styles.filterChips}>
              {STATUS_FILTER_OPTIONS.slice(1).map(opt => (
                <button
                  key={opt}
                  className={statusFilter === opt ? styles.filterActive : styles.filterChip}
                  onClick={() => setStatusFilter(statusFilter === opt ? 'すべて' : opt)}
                  aria-pressed={statusFilter === opt}
                >
                  {opt}
                </button>
              ))}
            </div>
            <div className={styles.sortLabel}>
              <span className={styles.sortKey}>並べ替え</span>
              <span className={styles.sortVal}>{SORT_LABELS[sortKey]}</span>
            </div>
          </div>
        </div>

        {/* ===== ローディング ===== */}
        {viewState === 'loading' && (
          <div className={styles.skeletonWrap} aria-busy aria-label="読み込み中">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* ===== 空状態 ===== */}
        {viewState === 'empty' && (
          <EmptyState
            emoji="🐝"
            title="蜂群がまだありません"
            description="最初の蜂群を追加して管理を始めましょう。"
            actionLabel="＋ 蜂群を追加"
            onAction={() => {}}
          />
        )}

        {/* ===== エラー状態 ===== */}
        {viewState === 'error' && (
          <EmptyState
            emoji="⚠️"
            title="データを読み込めません"
            description="ネットワーク接続を確認してから再試行してください。"
            actionLabel="再読み込み"
            onAction={() => window.location.reload()}
          />
        )}

        {/* ===== 通常 / オフライン ===== */}
        {showContent && (
          <>
            {!hasResults ? (
              <EmptyState
                emoji="🔍"
                title="条件に合う蜂群がありません"
                description="検索条件やフィルターを変更してください。"
              />
            ) : (
              filteredApiaries.map(apiary => (
                <section key={apiary.id} aria-label={apiary.name}>
                  <div className={styles.apiaryHeader}>
                    <span className={styles.apiaryName}>{apiary.name}</span>
                    <span className={styles.apiaryCount}>{apiary.colonies.length}群</span>
                  </div>
                  <div className={styles.grid}>
                    {apiary.colonies.map(colony => (
                      <ColonyCard
                        key={colony.id}
                        colony={colony}
                        onClick={onColonyClick}
                      />
                    ))}
                  </div>
                  <CompositionLegend />
                </section>
              ))
            )}
          </>
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={onTabChange ?? (() => {})} />
    </div>
  )
}
