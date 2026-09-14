import { useState } from 'react'
import {
  Search,
  MoreVertical,
  Calendar,
  List,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Plus,
  Check,
  WifiOff,
  ClipboardList,
  AlertCircle,
} from 'lucide-react'
import { BottomNav } from '../../components'
import type { TabId } from '../../components'
import type { WorkListViewState, WorkTask } from './types'
import { MOCK_TASKS } from './mockData'
import styles from './WorkListScreen.module.css'

interface Props {
  viewState: WorkListViewState
  onTabChange?: (tab: TabId) => void
  onAddTask?: () => void
  onTaskClick?: (id: string) => void
}

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']
const WEEK_DAYS = ['月', '火', '水', '木', '金', '土', '日']

// 2026-09-08..14 week strip
const WEEK_STRIP = [
  { month: '9月', day: 8, dayName: '月', dots: ['#DC2626'] },
  { month: '9月', day: 9, dayName: '火', dots: [] },
  { month: '9月', day: 10, dayName: '水', dots: ['#16A34A'] },
  { month: '9月', day: 11, dayName: '木', dots: ['#16A34A'] },
  { month: '9月', day: 12, dayName: '金', dots: [] },
  { month: '9月', day: 13, dayName: '土', dots: [] },
  { month: '9月', day: 14, dayName: '日', dots: ['#DC2626', '#D97706'] },
]

function getStatusTag(task: WorkTask) {
  switch (task.status) {
    case 'overdue':   return { label: '期限切れ', cls: styles.tagOverdue }
    case 'today':     return { label: '今日', cls: styles.tagToday }
    case 'tomorrow':  return { label: '明日', cls: styles.tagTomorrow }
    case 'upcoming':  return { label: '3日後', cls: styles.tagUpcoming }
    default:          return null
  }
}

function CheckButton({ checked, loading, onClick }: { checked: boolean; loading: boolean; onClick: () => void }) {
  return (
    <button
      className={`${styles.checkCircle} ${checked ? styles.checkCircleChecked : ''} ${loading ? styles.checkCircleLoading : ''}`}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      aria-label={checked ? '未完了に戻す' : '完了にする'}
    >
      {checked && <Check size={12} color="#fff" strokeWidth={3} />}
      {loading && <span className={styles.spinnerSmall} />}
    </button>
  )
}

function TaskCard({ task, onToggle, loading }: { task: WorkTask; onToggle: (id: string) => void; loading: boolean }) {
  const tag = getStatusTag(task)
  const completed = task.status === 'completed'
  return (
    <button className={`${styles.taskCard} ${completed ? styles.taskCardCompleted : ''}`}>
      <CheckButton checked={completed} loading={loading} onClick={() => onToggle(task.id)} />
      <div className={styles.taskBody}>
        <div className={styles.taskTitleRow}>
          <span className={`${styles.taskTitle} ${completed ? styles.taskTitleCompleted : ''}`}>{task.title}</span>
        </div>
        {task.colonyName && (
          <div className={styles.taskMeta}>{task.apiaryName} · {task.colonyName}</div>
        )}
        {!task.colonyName && task.apiaryName && (
          <div className={styles.taskMeta}>{task.apiaryName}</div>
        )}
        <div className={styles.taskTagRow}>
          {tag && <span className={`${styles.tag} ${tag.cls}`}>{tag.label}</span>}
          <span className={`${styles.tag} ${styles.tagCategory}`}>{task.category}</span>
        </div>
      </div>
    </button>
  )
}

function CalendarGrid() {
  // September 2026 — starts on Tuesday (index 1 in Mon-first grid)
  const startOffset = 1 // Tuesday
  const daysInMonth = 30
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className={styles.calendarGrid}>
      <div className={styles.calendarWeekHeader}>
        {WEEK_DAYS.map(d => <div key={d} className={styles.calendarWeekDay}>{d}</div>)}
      </div>
      <div className={styles.calendarDays}>
        {cells.map((day, i) => (
          <button
            key={i}
            className={`${styles.calendarDay} ${day === 14 ? styles.calendarDayActive : ''} ${day === null ? styles.calendarDayOtherMonth : ''}`}
          >
            {day ?? ''}
            {(day === 7 || day === 14) && <span className={styles.calendarDayDot} />}
          </button>
        ))}
      </div>
    </div>
  )
}

function Header({ onAdd }: { onAdd?: () => void }) {
  return (
    <div className={styles.header}>
      <div className={styles.headerRow}>
        <span className={styles.headerTitle}>作業</span>
        <button className={styles.iconBtn} aria-label="検索">
          <Search size={20} />
        </button>
        <button className={styles.iconBtn} aria-label="メニュー">
          <MoreVertical size={20} />
        </button>
      </div>
    </div>
  )
}

function OfflineBanner({ hasCache }: { hasCache: boolean }) {
  return (
    <div className={styles.offlineBanner}>
      <WifiOff size={14} />
      {hasCache
        ? 'オフラインです。キャッシュされたデータを表示しています。'
        : 'オフラインです。データを表示できません。'}
    </div>
  )
}

export function WorkListScreen({ viewState, onTabChange, onAddTask, onTaskClick }: Props) {
  const isCalendar = viewState === 'calendar-view'
  const [view, setView] = useState<'list' | 'calendar'>(isCalendar ? 'calendar' : 'list')
  const [completedOpen, setCompletedOpen] = useState(viewState === 'completed-expanded')
  const [updatingId, setUpdatingId] = useState<string | null>(
    viewState === 'updating-completion' ? 'task-2' : null,
  )
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

  const handleToggle = (id: string) => {
    if (updatingId) return
    setUpdatingId(id)
    setTimeout(() => {
      setUpdatingId(null)
      setCompletedIds(prev => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id); else next.add(id)
        return next
      })
    }, 800)
  }

  // Loading state
  if (viewState === 'loading') {
    return (
      <div className={styles.stateScreen}>
        <Header />
        <div className={styles.stateBody}>
          <div className={styles.spinner} />
          <p className={styles.stateDesc}>作業データを読み込み中…</p>
        </div>
        <BottomNav activeTab="work" onTabChange={onTabChange ?? (() => {})} />
      </div>
    )
  }

  // Error state
  if (viewState === 'error') {
    return (
      <div className={styles.stateScreen}>
        <Header />
        <div className={styles.stateBody}>
          <AlertCircle size={40} className={styles.stateIcon} />
          <p className={styles.stateTitle}>読み込みに失敗しました</p>
          <p className={styles.stateDesc}>ネットワーク接続を確認してから再試行してください。</p>
          <button className={styles.retryBtn}>再試行</button>
        </div>
        <BottomNav activeTab="work" onTabChange={onTabChange ?? (() => {})} />
      </div>
    )
  }

  // Offline, no cache
  if (viewState === 'offline-no-cache') {
    return (
      <div className={styles.stateScreen}>
        <Header />
        <div className={styles.stateBody}>
          <WifiOff size={40} className={styles.stateIcon} />
          <p className={styles.stateTitle}>オフラインです</p>
          <p className={styles.stateDesc}>表示できるキャッシュデータがありません。接続後に再読み込みしてください。</p>
        </div>
        <BottomNav activeTab="work" onTabChange={onTabChange ?? (() => {})} />
      </div>
    )
  }

  // Empty state
  if (viewState === 'empty') {
    return (
      <div className={styles.stateScreen}>
        <Header />
        <div className={styles.stateBody}>
          <ClipboardList size={40} className={styles.stateIcon} />
          <p className={styles.stateTitle}>作業がありません</p>
          <p className={styles.stateDesc}>「+ 作業を追加」から新しい作業を登録してください。</p>
        </div>
        <button className={styles.fab} onClick={onAddTask}>
          <Plus size={18} />
          作業を追加
        </button>
        <BottomNav activeTab="work" onTabChange={onTabChange ?? (() => {})} />
      </div>
    )
  }

  // Determine tasks to show
  const tasks = MOCK_TASKS.map(t =>
    completedIds.has(t.id) ? { ...t, status: 'completed' as const } : t,
  )

  const isOverdueFilter = viewState === 'overdue-filtered'

  const todayTasks = isOverdueFilter
    ? tasks.filter(t => t.status === 'overdue')
    : tasks.filter(t => t.status === 'overdue' || t.status === 'today')

  const weekTasks = isOverdueFilter
    ? []
    : tasks.filter(t => t.status === 'tomorrow' || t.status === 'upcoming')

  const completedTasks = tasks.filter(t => t.status === 'completed')

  const todaySectionLabel = isOverdueFilter ? '期限切れ' : '今日'

  const isOffline = viewState === 'offline'

  return (
    <div className={styles.screen}>
      <Header onAdd={onAddTask} />

      {/* Segment control */}
      <div className={styles.segmentRow}>
        <div className={styles.segmentControl}>
          <button
            className={`${styles.segmentBtn} ${view === 'calendar' ? styles.segmentBtnActive : ''}`}
            onClick={() => setView('calendar')}
          >
            <Calendar size={13} />
            カレンダー
          </button>
          <button
            className={`${styles.segmentBtn} ${view === 'list' ? styles.segmentBtnActive : ''}`}
            onClick={() => setView('list')}
          >
            <List size={13} />
            リスト
          </button>
        </div>
        <span className={styles.segmentLabel}>前回の表示を保持</span>
      </div>

      {/* Offline banner */}
      {isOffline && <OfflineBanner hasCache />}

      {/* Calendar view */}
      {view === 'calendar' ? (
        <CalendarGrid />
      ) : (
        <>
          {/* Month + date strip */}
          <div className={styles.calendarSection}>
            <div className={styles.monthRow}>
              <button className={styles.monthNavBtn}><ChevronLeft size={16} /></button>
              <span className={styles.monthLabel}>2026年9月</span>
              <Calendar size={16} color="var(--color-text-secondary, #66707A)" />
              <button className={styles.monthNavBtn}><ChevronRight size={16} /></button>
            </div>
            <div className={styles.dateStrip}>
              {WEEK_STRIP.map((d, i) => (
                <button key={i} className={`${styles.dateCell} ${d.day === 14 ? styles.dateCellActive : ''}`}>
                  <span className={styles.dateDayName}>{d.dayName}</span>
                  <span className={styles.dateNum}>{d.day}</span>
                  <div className={styles.dateDots}>
                    {d.dots.map((color, j) => (
                      <span key={j} className={styles.dateDot} style={{ background: color }} />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Filter chips */}
          <div className={styles.filterRow}>
            <button className={`${styles.filterChip} ${isOverdueFilter ? styles.filterChipActive : ''}`}>
              {isOverdueFilter ? '期限切れ' : '未完了'} <ChevronDown size={12} />
            </button>
            <button className={styles.filterChip}>
              全養蜂場 <ChevronDown size={12} />
            </button>
            <button className={styles.filterChip}>
              期限順 <ChevronDown size={12} />
            </button>
          </div>
        </>
      )}

      {/* Main content */}
      <div className={styles.content}>
        {/* Overdue banner */}
        {!isOverdueFilter && (
          <div className={styles.overdueBanner}>
            <AlertTriangle size={16} className={styles.overdueIcon} />
            <span className={styles.overdueText}>期限切れ 1件</span>
            <ChevronRight size={16} className={styles.overdueChevron} />
          </div>
        )}

        {/* Today section */}
        <div className={styles.taskSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>{todaySectionLabel}（{todayTasks.length}件）</span>
          </div>
          <div className={styles.taskList}>
            {todayTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={handleToggle}
                loading={updatingId === task.id}
              />
            ))}
          </div>
        </div>

        {/* This week section */}
        {weekTasks.length > 0 && (
          <div className={styles.taskSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>今週（{weekTasks.length}件）</span>
            </div>
            <div className={styles.taskList}>
              {weekTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  loading={updatingId === task.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed section */}
        <button className={styles.completedToggle} onClick={() => setCompletedOpen(o => !o)}>
          {completedOpen
            ? <ChevronDown size={16} color="var(--color-text-secondary, #66707A)" />
            : <ChevronRight size={16} color="var(--color-text-secondary, #66707A)" />}
          <span className={styles.completedToggleLabel}>完了済み {completedTasks.length}件</span>
        </button>
        {completedOpen && (
          <div className={styles.taskSection}>
            <div className={styles.taskList}>
              {completedTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  loading={updatingId === task.id}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button className={styles.fab} onClick={onAddTask}>
        <Plus size={18} />
        作業を追加
      </button>

      <BottomNav activeTab="work" onTabChange={onTabChange ?? (() => {})} />
    </div>
  )
}
