import { useState, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Thermometer,
  RefreshCw,
  WifiOff,
  AlertTriangle,
} from 'lucide-react'
import type { NotificationItem, NotificationFilter, NotificationCenterViewState } from './notificationTypes'
import {
  NORMAL_NOTIFICATIONS,
  LONG_CONTENT_NOTIFICATIONS,
  EMPTY_NOTIFICATIONS,
} from './notificationMockData'
import styles from './NotificationCenterScreen.module.css'

interface Props {
  viewState?: NotificationCenterViewState
  onBack: () => void
  onNavigate: (target: NotificationItem['navigateTo'], colonyId?: string) => void
}

/* AI診断アイコン（脳/回路を想起させる） */
function AiIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      {/* 脳の輪郭 */}
      <path
        d="M10 3C7.5 3 5.5 4.8 5.5 7c0 .8.3 1.5.7 2.1C5.4 9.6 5 10.4 5 11.3c0 1.5 1 2.7 2.5 3.1V15a.5.5 0 001 0v-.5h3v.5a.5.5 0 001 0v-.6c1.5-.4 2.5-1.6 2.5-3.1 0-.9-.4-1.7-1.2-2.2.4-.6.7-1.3.7-2.1C14.5 4.8 12.5 3 10 3z"
        stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round"
      />
      {/* 中央の回路線 */}
      <line x1="10" y1="7" x2="10" y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="7.5" y1="9.5" x2="12.5" y2="9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      {/* 接続ノード */}
      <circle cx="10" cy="7" r="1" fill="currentColor" />
      <circle cx="10" cy="13" r="1" fill="currentColor" />
    </svg>
  )
}

function getIconEl(type: NotificationItem['type']) {
  switch (type) {
    case 'sensor':     return <Thermometer size={20} aria-hidden />
    case 'inspection': return <Calendar size={20} aria-hidden />
    case 'ai':         return <AiIcon />
    case 'system':     return <RefreshCw size={20} aria-hidden />
  }
}

function getIconColorClass(type: NotificationItem['type']): string {
  switch (type) {
    case 'sensor':     return styles.iconSensor
    case 'inspection': return styles.iconInspection
    case 'ai':         return styles.iconAi
    case 'system':     return styles.iconSystem
  }
}

function buildNotifications(vs: NotificationCenterViewState): NotificationItem[] | null {
  if (vs === 'loading') return null
  if (vs === 'error') return null
  if (vs === 'offline-no-cache') return null
  if (vs === 'empty') return EMPTY_NOTIFICATIONS
  if (vs === 'long-content') return LONG_CONTENT_NOTIFICATIONS
  return NORMAL_NOTIFICATIONS
}

function buildInitialFilter(vs: NotificationCenterViewState): NotificationFilter {
  if (vs === 'unread-filter') return 'unread'
  if (vs === 'inspection-filter') return 'inspection'
  if (vs === 'ai-filter') return 'ai'
  if (vs === 'sensor-filter') return 'sensor'
  return 'all'
}

export function NotificationCenterScreen({ viewState = 'normal', onBack, onNavigate }: Props) {
  const isLoading  = viewState === 'loading'
  const isError    = viewState === 'error'
  const isOffline  = viewState === 'offline-cached' || viewState === 'offline-no-cache'
  const hasNoCache = viewState === 'offline-no-cache'
  const isAllRead  = viewState === 'all-read'

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const initial = buildNotifications(viewState)
    if (initial === null) return []
    if (isAllRead) return initial.map(n => ({ ...n, read: true }))
    return initial
  })

  const [filter, setFilter] = useState<NotificationFilter>(() => buildInitialFilter(viewState))
  const [retried, setRetried] = useState(false)
  const [liveAnnouncement, setLiveAnnouncement] = useState('')

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])

  const filteredNotifications = useMemo(() => {
    switch (filter) {
      case 'unread':     return notifications.filter(n => !n.read)
      case 'inspection': return notifications.filter(n => n.type === 'inspection')
      case 'ai':         return notifications.filter(n => n.type === 'ai')
      case 'sensor':     return notifications.filter(n => n.type === 'sensor')
      default:           return notifications
    }
  }, [notifications, filter])

  const todaySectionItems = filteredNotifications.filter(n =>
    n.occurredAt.includes('前') || /^\d+:\d+$/.test(n.occurredAt)
  )
  const pastSectionItems = filteredNotifications.filter(n =>
    !n.occurredAt.includes('前') && !/^\d+:\d+$/.test(n.occurredAt)
  )

  function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function markAllRead() {
    if (unreadCount === 0) return
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setLiveAnnouncement('すべての通知を既読にしました')
  }

  function handleNotifClick(item: NotificationItem) {
    markRead(item.id)
    if (item.type === 'system' || !item.navigateTo) return
    onNavigate(item.navigateTo, item.colonyId)
  }

  const FILTER_CHIPS: { id: NotificationFilter; label: string }[] = [
    { id: 'all',        label: 'すべて' },
    { id: 'unread',     label: '未読' },
    { id: 'inspection', label: '内検' },
    { id: 'ai',         label: 'AI' },
    { id: 'sensor',     label: 'センサー' },
  ]

  function renderNotifCard(item: NotificationItem) {
    return (
      <button
        key={item.id}
        className={`${styles.notifCard} ${!item.read ? styles.notifCardUnread : ''}`}
        onClick={() => handleNotifClick(item)}
        aria-label={`${item.title}: ${item.message}${item.read ? '' : '（未読）'}`}
      >
        {!item.read && <span className={styles.unreadDot} aria-hidden />}
        <span className={`${styles.iconWrap} ${getIconColorClass(item.type)}`}>
          {getIconEl(item.type)}
        </span>
        <span className={styles.notifBody}>
          <span className={styles.notifTitle}>{item.title}</span>
          <span className={styles.notifMessage}>{item.message}</span>
          <span className={styles.notifTime}>{item.occurredAt}</span>
        </span>
        <span className={styles.chevronWrap}>
          <ChevronRight size={16} aria-hidden />
        </span>
      </button>
    )
  }

  function renderSection(label: string, items: NotificationItem[]) {
    if (items.length === 0) return null
    return (
      <section className={styles.section}>
        <h2 className={styles.sectionLabel}>{label}</h2>
        <div className={styles.cardList}>
          {items.map(renderNotifCard)}
        </div>
      </section>
    )
  }

  function renderEmptyState(label: string) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyText}>{label}</p>
      </div>
    )
  }

  function renderSkeleton() {
    return (
      <div className={styles.skeletonList} aria-busy="true" aria-label="通知を読み込み中">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={styles.skeletonCard}>
            <div className={styles.skeletonIcon} />
            <div className={styles.skeletonContent}>
              <div className={styles.skeletonLine} style={{ width: '68%' }} />
              <div className={styles.skeletonLine} style={{ width: '48%' }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const noData = (!isLoading && isError && !retried) || hasNoCache

  return (
    <div className={styles.screen}>
      {/* ── ヘッダー ── */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="戻る">
          <ChevronLeft size={24} aria-hidden />
        </button>
        <h1 className={styles.title}>通知</h1>
        <button
          className={styles.markAllBtn}
          onClick={markAllRead}
          disabled={unreadCount === 0}
          aria-label="すべて既読にする"
        >
          すべて既読
        </button>
      </header>

      {/* ── フィルターチップ ── */}
      <div className={styles.filterRow} role="toolbar" aria-label="通知フィルター">
        {FILTER_CHIPS.map(chip => (
          <button
            key={chip.id}
            className={`${styles.chip} ${filter === chip.id ? styles.chipActive : ''}`}
            onClick={() => setFilter(chip.id)}
            aria-pressed={filter === chip.id}
          >
            {chip.label}
            {chip.id === 'unread' && unreadCount > 0 && (
              <span className={styles.chipBadge} aria-label={`未読${unreadCount}件`}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── オフラインバナー ── */}
      {isOffline && (
        <div className={styles.offlineBanner} role="alert">
          <WifiOff size={16} aria-hidden />
          <span>
            {hasNoCache
              ? 'オフラインです。通知を取得できません。'
              : 'オフラインです。キャッシュされた通知を表示しています。'}
          </span>
        </div>
      )}

      {/* ── エラーバナー ── */}
      {isError && !retried && (
        <div className={styles.errorBanner} role="alert">
          <AlertTriangle size={16} aria-hidden />
          <span>通知の読み込みに失敗しました。</span>
          <button className={styles.retryBtn} onClick={() => setRetried(true)}>
            再読み込み
          </button>
        </div>
      )}

      {/* ── スクリーンリーダー通知 ── */}
      <span role="status" aria-live="polite" className={styles.srOnly}>
        {liveAnnouncement}
      </span>

      {/* ── 本文 ── */}
      {isLoading ? (
        renderSkeleton()
      ) : noData ? (
        <div className={styles.body}>
          {isError
            ? renderEmptyState('通知を取得できませんでした。')
            : renderEmptyState('オフラインのため通知を表示できません。')}
        </div>
      ) : (
        <div className={styles.body}>
          {filteredNotifications.length === 0 ? (
            renderEmptyState(
              filter === 'unread'     ? '未読の通知はありません。' :
              filter === 'inspection' ? '内検の通知はありません。' :
              filter === 'ai'         ? 'AI通知はありません。' :
              filter === 'sensor'     ? 'センサー通知はありません。' :
                                        '通知はありません。'
            )
          ) : (
            <>
              {renderSection('今日', todaySectionItems)}
              {renderSection('過去7日', pastSectionItems)}
            </>
          )}
        </div>
      )}
    </div>
  )
}
