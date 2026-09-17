import { useState, useMemo } from 'react'
import type { WorkHistoryViewState, WorkHistoryWorkType, WorkHistoryRecord, WorkHistoryFilters, PeriodOption } from './types'
import { MOCK_RECORDS, MOCK_APIARIES, MOCK_COLONIES } from './mockData'
import { BottomNav } from '../../components'
import styles from './WorkHistoryScreen.module.css'

// ── SVG Icons ──────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="5" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function BarChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function Spinner() {
  return <div className={styles.spinner} role="status" aria-label="読み込み中" />
}

// ── Work type icons ────────────────────────────────────────────────────────

function HarvestSvg({ stroke, fill }: { stroke: string; fill: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="12" y="5" width="8" height="4" rx="1.5" fill={fill} stroke={stroke} strokeWidth="1.7" />
      <rect x="13" y="9" width="6" height="2.5" fill={fill} stroke={stroke} strokeWidth="1.5" />
      <path d="M10 12 Q9 14 9 18 Q9 25 16 25 Q23 25 23 18 Q23 14 22 12 Z"
        fill={fill} stroke={stroke} strokeWidth="1.7" strokeLinejoin="round" />
      <line x1="12" y1="18" x2="20" y2="18" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="12" y1="21" x2="20" y2="21" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function FeedSvg({ stroke, fill }: { stroke: string; fill: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="12" y="6" width="8" height="13" rx="3" fill={fill} stroke={stroke} strokeWidth="1.7" />
      <rect x="14" y="19" width="4" height="2.5" fill={fill} stroke={stroke} strokeWidth="1.5" />
      <path d="M8 22 Q8 26 16 26 Q24 26 24 22 Z" fill={fill} stroke={stroke} strokeWidth="1.7" strokeLinejoin="round" />
      <line x1="13" y1="13" x2="19" y2="13" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function TreatmentSvg({ stroke, fill, bulbFill }: { stroke: string; fill: string; bulbFill: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="14" y="5" width="4" height="16" rx="2" fill={fill} stroke={stroke} strokeWidth="1.7" />
      <rect x="15.2" y="10" width="1.6" height="10" rx="0.8" fill={bulbFill} />
      <circle cx="16" cy="23" r="4" fill={bulbFill} stroke={stroke} strokeWidth="1.7" />
      <line x1="18" y1="9" x2="20" y2="9" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="18" y1="12" x2="20" y2="12" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="18" y1="15" x2="20" y2="15" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function SwarmSvg({ stroke, fill }: { stroke: string; fill: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <line x1="16" y1="26" x2="16" y2="16" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16 16 Q12 12 10 8" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" fill="none" />
      <path d="M16 16 Q20 12 22 8" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" fill="none" />
      <ellipse cx="9" cy="7" rx="3.5" ry="2.5" fill={fill} stroke={stroke} strokeWidth="1.5"
        transform="rotate(-20 9 7)" />
      <ellipse cx="23" cy="7" rx="3.5" ry="2.5" fill={fill} stroke={stroke} strokeWidth="1.5"
        transform="rotate(20 23 7)" />
    </svg>
  )
}

function WinterSvg({ stroke, fill }: { stroke: string; fill: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <line x1="16" y1="5" x2="16" y2="27" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
      <line x1="5" y1="16" x2="27" y2="16" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
      <line x1="8.5" y1="8.5" x2="23.5" y2="23.5" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
      <line x1="23.5" y1="8.5" x2="8.5" y2="23.5" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
      <line x1="13" y1="9" x2="16" y2="12" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="19" y1="9" x2="16" y2="12" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="13" y1="23" x2="16" y2="20" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="19" y1="23" x2="16" y2="20" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="16" cy="16" r="2.5" fill={fill} stroke={stroke} strokeWidth="1.5" />
    </svg>
  )
}

// Color config per work type
const WORK_TYPE_CONFIG: Record<WorkHistoryWorkType, {
  bgColor: string
  stroke: string
  fill: string
  bulbFill?: string
}> = {
  harvest:   { bgColor: '#FEF3C7', stroke: '#D97706', fill: '#FEF9EE' },
  feeding:   { bgColor: '#FEF3C7', stroke: '#D97706', fill: '#FEF9EE' },
  treatment: { bgColor: '#FEE2E2', stroke: '#DC2626', fill: '#FFF5F5', bulbFill: '#F87171' },
  swarming:  { bgColor: '#DCFCE7', stroke: '#16A34A', fill: '#F0FDF4' },
  wintering: { bgColor: '#DBEAFE', stroke: '#1D4ED8', fill: '#EFF6FF' },
}

function WorkTypeCircleIcon({ workType }: { workType: WorkHistoryWorkType }) {
  const cfg = WORK_TYPE_CONFIG[workType]
  return (
    <div className={styles.iconCircle} style={{ background: cfg.bgColor }}>
      {workType === 'harvest'   && <HarvestSvg stroke={cfg.stroke} fill={cfg.fill} />}
      {workType === 'feeding'   && <FeedSvg stroke={cfg.stroke} fill={cfg.fill} />}
      {workType === 'treatment' && <TreatmentSvg stroke={cfg.stroke} fill={cfg.fill} bulbFill={cfg.bulbFill!} />}
      {workType === 'swarming'  && <SwarmSvg stroke={cfg.stroke} fill={cfg.fill} />}
      {workType === 'wintering' && <WinterSvg stroke={cfg.stroke} fill={cfg.fill} />}
    </div>
  )
}

// ── Date helpers ──────────────────────────────────────────────────────────

function toMonthKey(date: string): string {
  const parts = date.split('-')
  return `${parts[0]}-${parts[1]}`
}

function formatMonthLabel(key: string): string {
  const [y, m] = key.split('-')
  return `${y}年${parseInt(m)}月`
}

function formatDayTime(date: string, time: string): string {
  const parts = date.split('-')
  const m = parseInt(parts[1])
  const d = parseInt(parts[2])
  return `${m}月${d}日 ${time}`
}

function formatAmount(amount: number, unit: string): string {
  // Always show one decimal place so "1.0 L" not "1 L"
  return `${amount % 1 === 0 ? amount.toFixed(1) : amount} ${unit}`
}

// Full-width space (U+3000) separator used between work type and detail text
const FS = String.fromCharCode(0x3000)

function buildSubtitle(rec: WorkHistoryRecord): string {
  const d = rec.details
  if (!d) return rec.title
  if (rec.workType === 'harvest' && d.harvestAmount != null) {
    return rec.title + FS + formatAmount(d.harvestAmount, d.harvestUnit ?? '')
  }
  if (rec.workType === 'feeding') {
    const parts: string[] = []
    if (d.feedType) parts.push(d.feedType)
    if (d.feedAmount != null) parts.push(formatAmount(d.feedAmount, d.feedUnit ?? ''))
    return parts.length > 0 ? rec.title + FS + parts.join(' ') : rec.title
  }
  if (rec.workType === 'treatment' && d.treatmentName) {
    return rec.title + FS + d.treatmentName
  }
  return rec.title
}

function buildMeta(rec: WorkHistoryRecord): string | null {
  const d = rec.details
  if (!d) return null
  if (rec.workType === 'harvest' && d.process) return d.process
  if (rec.workType === 'treatment' && d.nextTreatmentDate) {
    const parts = d.nextTreatmentDate.split('-')
    return `次回 ${parseInt(parts[1])}月${parseInt(parts[2])}日`
  }
  if (rec.workType === 'swarming' && d.newColonyId) return `新群 ${d.newColonyId}`
  return null
}

// ── Filter helpers ────────────────────────────────────────────────────────

function isWithinPeriod(date: string, period: PeriodOption, start: string, end: string): boolean {
  if (period === 'all') return true
  const d = new Date(date)
  const now = new Date('2026-09-16')
  if (period === '7d') {
    const ago = new Date(now); ago.setDate(ago.getDate() - 7)
    return d >= ago && d <= now
  }
  if (period === '30d') {
    const ago = new Date(now); ago.setDate(ago.getDate() - 30)
    return d >= ago && d <= now
  }
  if (period === '3m') {
    const ago = new Date(now); ago.setMonth(ago.getMonth() - 3)
    return d >= ago && d <= now
  }
  if (period === 'custom' && start && end) {
    return d >= new Date(start) && d <= new Date(end)
  }
  return true
}

function matchesSearch(rec: WorkHistoryRecord, q: string): boolean {
  if (!q) return true
  const lower = q.toLowerCase()
  const fields = [
    rec.title,
    rec.workType,
    rec.apiaryName ?? '',
    ...rec.colonyLabels,
    rec.memo ?? '',
    rec.details?.feedType ?? '',
    rec.details?.treatmentName ?? '',
    rec.details?.process ?? '',
    buildMeta(rec) ?? '',
  ]
  return fields.some(f => f.toLowerCase().includes(lower))
}

// ── Props ─────────────────────────────────────────────────────────────────

interface WorkHistoryScreenProps {
  viewState: WorkHistoryViewState
  onBack: () => void
  onAddRecord: () => void
  onRecordTap: (recordId: string) => void
  onAnalyze: () => void
  onTabChange: (tab: import('../../components').TabId) => void
}

// ── Main component ────────────────────────────────────────────────────────

export function WorkHistoryScreen({
  viewState,
  onBack,
  onAddRecord,
  onRecordTap,
  onAnalyze,
  onTabChange,
}: WorkHistoryScreenProps) {
  const isOffline = viewState === 'offline' || viewState === 'offline-no-cache'

  const initFilters = (): WorkHistoryFilters => {
    if (viewState === 'filtered-feeding') {
      return { workType: 'feeding', apiaryId: null, colonyId: null, period: 'all', periodStart: '', periodEnd: '', searchQuery: '' }
    }
    if (viewState === 'filtered-apiary') {
      return { workType: 'all', apiaryId: 'apiary-1', colonyId: null, period: 'all', periodStart: '', periodEnd: '', searchQuery: '' }
    }
    if (viewState === 'filtered-colony') {
      return { workType: 'all', apiaryId: 'apiary-1', colonyId: 'A-01', period: 'all', periodStart: '', periodEnd: '', searchQuery: '' }
    }
    if (viewState === 'filtered-period') {
      return { workType: 'all', apiaryId: null, colonyId: null, period: '30d', periodStart: '', periodEnd: '', searchQuery: '' }
    }
    if (viewState === 'search-results') {
      return { workType: 'all', apiaryId: null, colonyId: null, period: 'all', periodStart: '', periodEnd: '', searchQuery: '治療' }
    }
    return { workType: 'all', apiaryId: null, colonyId: null, period: 'all', periodStart: '', periodEnd: '', searchQuery: '' }
  }

  const [filters, setFilters] = useState<WorkHistoryFilters>(initFilters)
  const [searchOpen, setSearchOpen] = useState(
    viewState === 'search-results' || viewState === 'search-open'
  )
  const [menuOpen, setMenuOpen] = useState(viewState === 'filter-menu')
  const [sortDesc, setSortDesc] = useState(true)

  const setFilter = <K extends keyof WorkHistoryFilters>(key: K, value: WorkHistoryFilters[K]) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'apiaryId') next.colonyId = null
      return next
    })
  }

  const resetFilters = () => {
    setFilters({ workType: 'all', apiaryId: null, colonyId: null, period: 'all', periodStart: '', periodEnd: '', searchQuery: '' })
    setSearchOpen(false)
  }

  const availableColonies = filters.apiaryId
    ? MOCK_COLONIES.filter(c => c.apiaryId === filters.apiaryId)
    : MOCK_COLONIES

  const filteredRecords = useMemo(() => {
    if (viewState === 'empty') return []
    if (viewState === 'loading' || viewState === 'error' || viewState === 'offline-no-cache') return []
    if (viewState === 'no-results') return []

    let recs = [...MOCK_RECORDS]

    if (filters.workType !== 'all') {
      recs = recs.filter(r => r.workType === filters.workType)
    }
    if (filters.apiaryId) {
      recs = recs.filter(r => r.apiaryId === filters.apiaryId)
    }
    if (filters.colonyId) {
      recs = recs.filter(r => r.colonyIds.includes(filters.colonyId!))
    }
    recs = recs.filter(r => isWithinPeriod(r.performedDate, filters.period, filters.periodStart, filters.periodEnd))
    recs = recs.filter(r => matchesSearch(r, filters.searchQuery))

    recs.sort((a, b) => {
      const da = `${a.performedDate}T${a.performedTime}`
      const db = `${b.performedDate}T${b.performedTime}`
      return sortDesc ? db.localeCompare(da) : da.localeCompare(db)
    })

    return recs
  }, [filters, viewState, sortDesc])

  const monthGroups = useMemo(() => {
    const groups: { key: string; records: typeof filteredRecords }[] = []
    for (const rec of filteredRecords) {
      const key = toMonthKey(rec.performedDate)
      const existing = groups.find(g => g.key === key)
      if (existing) existing.records.push(rec)
      else groups.push({ key, records: [rec] })
    }
    return groups
  }, [filteredRecords])

  const WORK_TYPE_TABS: { id: WorkHistoryWorkType | 'all'; label: string }[] = [
    { id: 'all',       label: 'すべて' },
    { id: 'harvest',   label: '採蜜' },
    { id: 'feeding',   label: '給餌' },
    { id: 'treatment', label: '治療' },
    { id: 'swarming',  label: '分蜂' },
    { id: 'wintering', label: '越冬' },
  ]

  const PERIOD_LABELS: Record<PeriodOption, string> = {
    all: 'すべて',
    '7d': '過去7日',
    '30d': '過去30日',
    '3m': '過去3か月',
    custom: '期間指定',
  }

  // ── Special states ──────────────────────────────────────────────────────

  if (viewState === 'loading') {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <button className={styles.headerBtn} onClick={onBack} aria-label="戻る"><BackIcon /></button>
          <span className={styles.headerTitle}>作業履歴</span>
          <div className={styles.headerRight}>
            <button className={styles.headerBtn} aria-label="検索"><SearchIcon /></button>
            <button className={styles.headerBtn} aria-label="メニュー"><MoreIcon /></button>
          </div>
        </header>
        <div className={styles.loadingBody}>
          <Spinner />
          <p className={styles.loadingText}>作業履歴を読み込み中…</p>
        </div>
        <BottomNav activeTab="work" onTabChange={onTabChange} />
      </div>
    )
  }

  if (viewState === 'error') {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <button className={styles.headerBtn} onClick={onBack} aria-label="戻る"><BackIcon /></button>
          <span className={styles.headerTitle}>作業履歴</span>
          <div className={styles.headerRight}>
            <button className={styles.headerBtn} aria-label="検索"><SearchIcon /></button>
            <button className={styles.headerBtn} aria-label="メニュー"><MoreIcon /></button>
          </div>
        </header>
        <div className={styles.errorBody} role="alert">
          <p className={styles.errorTitle}>作業履歴を取得できませんでした</p>
          <p className={styles.errorText}>ネットワーク接続を確認してから再度お試しください。</p>
          <div className={styles.errorActions}>
            <button className={styles.retryBtn}>再試行</button>
            <button className={styles.backLinkBtn} onClick={onBack}>戻る</button>
          </div>
        </div>
        <BottomNav activeTab="work" onTabChange={onTabChange} />
      </div>
    )
  }

  if (viewState === 'offline-no-cache') {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <button className={styles.headerBtn} onClick={onBack} aria-label="戻る"><BackIcon /></button>
          <span className={styles.headerTitle}>作業履歴</span>
          <div className={styles.headerRight}>
            <button className={styles.headerBtn} aria-label="検索"><SearchIcon /></button>
            <button className={styles.headerBtn} aria-label="メニュー"><MoreIcon /></button>
          </div>
        </header>
        <div className={styles.errorBody}>
          <p className={styles.errorTitle}>保存済みの作業履歴がありません</p>
          <p className={styles.errorText}>オンライン時に作業履歴を表示しておくと、オフラインでも確認できます。</p>
          <button className={styles.backLinkBtn} onClick={onBack}>戻る</button>
        </div>
        <BottomNav activeTab="work" onTabChange={onTabChange} />
      </div>
    )
  }

  // ── Normal layout ───────────────────────────────────────────────────────

  const showEmpty = viewState === 'empty'
  const showNoResults = (filteredRecords.length === 0 || viewState === 'no-results') && !showEmpty

  return (
    <div className={styles.screen}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.headerBtn} onClick={onBack} aria-label="戻る"><BackIcon /></button>
        <span className={styles.headerTitle}>作業履歴</span>
        <div className={styles.headerRight}>
          <button
            className={`${styles.headerBtn} ${searchOpen ? styles.headerBtnActive : ''}`}
            aria-label="検索"
            aria-pressed={searchOpen}
            onClick={() => setSearchOpen(s => !s)}
          >
            <SearchIcon />
          </button>
          <div className={styles.menuWrap}>
            <button
              className={styles.headerBtn}
              aria-label="メニュー"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen(s => !s)}
            >
              <MoreIcon />
            </button>
            {menuOpen && (
              <>
                <div className={styles.menuBackdrop} onClick={() => setMenuOpen(false)} />
                <div className={styles.menuDropdown} role="menu">
                  <button
                    className={`${styles.menuItem} ${sortDesc ? styles.menuItemActive : ''}`}
                    role="menuitem"
                    onClick={() => { setSortDesc(true); setMenuOpen(false) }}
                  >
                    {sortDesc && <CheckIcon />}
                    <span>新しい順</span>
                  </button>
                  <div className={styles.menuDivider} />
                  <button
                    className={`${styles.menuItem} ${!sortDesc ? styles.menuItemActive : ''}`}
                    role="menuitem"
                    onClick={() => { setSortDesc(false); setMenuOpen(false) }}
                  >
                    {!sortDesc && <CheckIcon />}
                    <span>古い順</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Search bar */}
      {searchOpen && (
        <div className={styles.searchBar}>
          <SearchIcon />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="作業名・蜂群・メモを検索"
            value={filters.searchQuery}
            onChange={e => setFilter('searchQuery', e.target.value)}
            aria-label="作業名・蜂群・メモを検索"
            autoFocus
          />
          <button
            className={styles.searchClear}
            aria-label="検索を閉じる"
            onClick={() => { setFilter('searchQuery', ''); setSearchOpen(false) }}
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {/* Offline banner */}
      {isOffline && (
        <div className={styles.offlineBanner} role="status">
          オフライン — 保存済みの作業履歴を表示しています
        </div>
      )}

      {/* Work type filter tabs */}
      <div className={styles.typeTabs} role="group" aria-label="作業種別フィルター">
        {WORK_TYPE_TABS.map(tab => {
          const active = filters.workType === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={active}
              className={`${styles.typeTab} ${active ? styles.typeTabActive : ''}`}
              onClick={() => setFilter('workType', tab.id)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Apiary / Colony / Period filters */}
      <div className={styles.filterRow}>
        <div className={styles.filterSelect}>
          <select
            className={styles.filterNative}
            value={filters.apiaryId ?? ''}
            onChange={e => setFilter('apiaryId', e.target.value || null)}
            aria-label="養蜂場を選択"
          >
            <option value="">全養蜂場</option>
            {MOCK_APIARIES.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <ChevronDownIcon />
        </div>
        <div className={styles.filterSelect}>
          <select
            className={styles.filterNative}
            value={filters.colonyId ?? ''}
            onChange={e => setFilter('colonyId', e.target.value || null)}
            aria-label="蜂群を選択"
          >
            <option value="">全蜂群</option>
            {availableColonies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDownIcon />
        </div>
        <div className={styles.filterSelect}>
          <select
            className={styles.filterNative}
            value={filters.period}
            onChange={e => setFilter('period', e.target.value as PeriodOption)}
            aria-label="期間を選択"
          >
            {(Object.entries(PERIOD_LABELS) as [PeriodOption, string][]).map(([k, v]) =>
              <option key={k} value={k}>{v}</option>
            )}
          </select>
          <ChevronDownIcon />
        </div>
      </div>

      {/* Custom period inputs */}
      {filters.period === 'custom' && (
        <div className={styles.customPeriod}>
          <input type="date" className={styles.periodInput} value={filters.periodStart}
            onChange={e => setFilter('periodStart', e.target.value)} aria-label="開始日" />
          <span className={styles.periodSep}>〜</span>
          <input type="date" className={styles.periodInput} value={filters.periodEnd}
            onChange={e => setFilter('periodEnd', e.target.value)} aria-label="終了日" />
        </div>
      )}

      {/* Scrollable body */}
      <div className={styles.body} data-testid="work-history-body">

        {/* Empty state */}
        {showEmpty && (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>作業履歴がありません</p>
            <p className={styles.emptyText}>作業記録を追加すると、ここに履歴が表示されます。</p>
            <button className={styles.emptyAction} onClick={onAddRecord}>作業記録を追加</button>
          </div>
        )}

        {/* No-results state */}
        {showNoResults && (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>条件に一致する履歴がありません</p>
            <p className={styles.emptyText}>検索条件やフィルターを変更してください。</p>
            <button className={styles.emptyAction} onClick={resetFilters}>条件を解除</button>
          </div>
        )}

        {/* Month groups */}
        {monthGroups.map(({ key, records }) => (
          <div key={key} className={styles.monthGroup}>
            <h2 className={styles.monthLabel}>{formatMonthLabel(key)}</h2>
            <div className={styles.cardList}>
              {records.map(rec => {
                const subtitle = buildSubtitle(rec)
                const meta = buildMeta(rec)
                const colonyText = rec.colonyLabels.join('・')
                return (
                  <button
                    key={rec.id}
                    className={styles.card}
                    onClick={() => onRecordTap(rec.id)}
                    aria-label={`${subtitle} ${formatDayTime(rec.performedDate, rec.performedTime)}`}
                  >
                    <WorkTypeCircleIcon workType={rec.workType} />
                    <div className={styles.cardCenter}>
                      <span className={styles.cardTitle}>{subtitle}</span>
                      <span className={styles.cardDate}>{formatDayTime(rec.performedDate, rec.performedTime)}</span>
                      {colonyText && (
                        <div className={styles.cardTags}>
                          <span className={styles.cardTag}>{colonyText}</span>
                        </div>
                      )}
                    </div>
                    <div className={styles.cardRight}>
                      {meta && <span className={styles.cardMeta}>{meta}</span>}
                      <ChevronRightIcon />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        <div className={styles.bodyEnd} />
      </div>

      {/* Bottom actions — shown when records are visible */}
      {!showEmpty && !showNoResults && (
        <div className={styles.bottomActions}>
          <button className={styles.analyzeBtn} onClick={onAnalyze} aria-label="詳しく分析する">
            <BarChartIcon />
            <span>詳しく分析する</span>
            <ChevronRightIcon />
          </button>
          <button
            className={styles.fab}
            onClick={onAddRecord}
            aria-label="作業記録を追加"
            disabled={isOffline}
          >
            <PlusIcon />
            <span>作業記録を追加</span>
          </button>
        </div>
      )}

      {/* Spacer so fixed BottomNav (72px) doesn't cover the actions above */}
      <div className={styles.navSpacer} aria-hidden="true" />

      <BottomNav activeTab="work" onTabChange={onTabChange} />
    </div>
  )
}
