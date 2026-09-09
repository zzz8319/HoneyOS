import { useState, useMemo } from 'react'
import { AppHeader, BottomNav, EmptyState, ErrorBanner } from '../../components'
import type { TabId } from '../../components'
import { ColonyCard } from './ColonyCard'
import { ColonySearch } from './ColonySearch'
import { FilterChip } from './FilterChip'
import type { FilterValue } from './FilterChip'
import { mockColonyList } from './mockData'
import type { ColonyListItem } from './mockData'
import styles from './ColonySummaryScreen.module.css'

export type ColonyListViewState = 'normal' | 'empty' | 'loading' | 'error' | 'offline'

interface ColonySummaryScreenProps {
  viewState?: ColonyListViewState
  activeTab?: TabId
  onTabChange?: (tab: TabId) => void
  onNotifClick?: () => void
  onColonyClick?: (colonyId: string) => void
}

const SKELETON_COUNT = 6

// 最終内検日が古い順（要注意・危険が先頭に来やすい）
function sortByOldestInspection(a: ColonyListItem, b: ColonyListItem) {
  return a.lastInspectedAt.localeCompare(b.lastInspectedAt)
}

const OVERDUE_DAYS = 14

function isOverdue(dateStr: string): boolean {
  const ms = Date.now() - new Date(dateStr).getTime()
  return ms / 86400000 > OVERDUE_DAYS
}

export function ColonySummaryScreen({
  viewState = 'normal',
  activeTab = 'farms',
  onTabChange,
  onNotifClick,
  onColonyClick,
}: ColonySummaryScreenProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterValue>('all')

  const { apiaries, fetchedAt } = mockColonyList

  const allColonies = useMemo(
    () => apiaries.flatMap(a => a.colonies).sort(sortByOldestInspection),
    [apiaries],
  )

  const filtered = useMemo(() => {
    let list = allColonies
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(c => c.name.toLowerCase().includes(q))
    }
    if (filter === 'alert') {
      list = list.filter(c => c.status === 'warn' || c.status === 'danger')
    } else if (filter === 'overdue') {
      list = list.filter(c => isOverdue(c.lastInspectedAt))
    }
    return list
  }, [allColonies, query, filter])

  // フィルタ済みの結果を養蜂場ごとにグループ化
  const filteredApiaries = useMemo(() => {
    return apiaries
      .map(a => ({
        ...a,
        colonies: filtered.filter(c => c.apiaryId === a.id),
      }))
      .filter(a => a.colonies.length > 0)
  }, [apiaries, filtered])

  const showContent = viewState === 'normal' || viewState === 'offline'

  return (
    <div className="app-shell">
      <AppHeader
        farmName="蜂群"
        notifCount={0}
        onNotifClick={onNotifClick}
      />

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

        {/* 検索・フィルター（コンテンツ表示時のみ） */}
        {showContent && (
          <div className={styles.controls}>
            <ColonySearch value={query} onChange={setQuery} />
            <FilterChip active={filter} onChange={setFilter} />
          </div>
        )}

        {/* ローディングスケルトン */}
        {viewState === 'loading' && (
          <div className={styles.skeletonWrap} aria-busy aria-label="読み込み中">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div key={i} className={styles.skelCard}>
                <div className={styles.skelHeader} />
                <div className={styles.skelMeta} />
                <div className={styles.skelBar} />
              </div>
            ))}
          </div>
        )}

        {/* 空状態 */}
        {viewState === 'empty' && (
          <EmptyState
            emoji="🐝"
            title="蜂群がまだありません"
            description="最初の蜂群を追加して管理を始めましょう。"
            actionLabel="＋ 蜂群を追加"
            onAction={() => {}}
          />
        )}

        {/* エラー状態 */}
        {viewState === 'error' && (
          <EmptyState
            emoji="⚠️"
            title="データを読み込めません"
            description="ネットワーク接続を確認してから再試行してください。"
            actionLabel="再読み込み"
            onAction={() => window.location.reload()}
          />
        )}

        {/* 通常 / オフライン: 蜂群一覧 */}
        {showContent && (
          <>
            {filtered.length === 0 ? (
              <EmptyState
                emoji="🔍"
                title="条件に合う蜂群がありません"
                description="検索条件やフィルターを変更してください。"
              />
            ) : (
              filteredApiaries.map(apiary => (
                <section key={apiary.id} aria-label={apiary.name}>
                  <h2 className={styles.apiaryHeading}>{apiary.name}</h2>
                  <div className={styles.cardList}>
                    {apiary.colonies.map(colony => (
                      <ColonyCard
                        key={colony.id}
                        colony={colony}
                        onClick={onColonyClick}
                      />
                    ))}
                  </div>
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
