import { useState, useRef, useCallback, useMemo } from 'react'
import {
  Calendar, MapPin, ChevronRight, ChevronUp,
  AlertCircle, Info, WifiOff, RefreshCw, AlertTriangle,
} from 'lucide-react'
import { BottomNav } from '../../components'
import type { TabId } from '../../components'
import type {
  ColonyComparisonViewState, ComparisonTab, SortKey, SortDir,
} from './types'
import {
  COMPARISON_APIARIES, COLONY_HISTORIES,
  selectRowsForDate, buildWarnings, filterRows, sortRows,
} from './mockData'
import styles from './ColonyComparisonScreen.module.css'

// ── Inline SVG icons ──────────────────────────────────────────────────────
function IconMore() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
    </svg>
  )
}

function IconChevronDown({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 5l4 4 4-4"/>
    </svg>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────
interface ColonyComparisonScreenProps {
  viewState: ColonyComparisonViewState
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  onColonyDetail: (colonyId: string) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────
const APIARIES = COMPARISON_APIARIES

// ── Sort header cell (module-level to avoid react-hooks/static-components) ──
function SortTh({
  col, label, sortKey, sortDir, onToggle,
}: {
  col: SortKey; label: string
  sortKey: SortKey; sortDir: SortDir
  onToggle: (k: SortKey) => void
}) {
  const active = sortKey === col
  const aSort = active ? (sortDir === 'desc' ? 'descending' : 'ascending') : 'none'
  const colClass = col === 'lastInspection' ? styles.inspCol
    : col === 'strength' ? styles.strengthCol
    : col === 'bee' ? styles.beeCol
    : col === 'brood' ? styles.broodCol
    : styles.honeyCol
  return (
    <th className={colClass} aria-sort={aSort as 'ascending' | 'descending' | 'none'}>
      <button onClick={() => onToggle(col)} aria-label={`${label}で並び替え`}>
        {label}{active && (sortDir === 'desc' ? '↓' : '↑')}
      </button>
    </th>
  )
}

function formatDays(days: number | null): string {
  if (days === null) return '—'
  if (days === 0) return '今日'
  if (days === 1) return '1日前'
  return `${days}日前`
}

function formatPct(val: number | null): string {
  if (val === null) return '—'
  return `${val}%`
}

// ── Rank badge class ──────────────────────────────────────────────────────
function rankBadgeClass(rank: number): string {
  if (rank === 1) return styles.rank1
  if (rank === 2) return styles.rank2
  if (rank === 3) return styles.rank3
  return styles.rankN
}

// ── Main component ────────────────────────────────────────────────────────
export function ColonyComparisonScreen({
  viewState, onTabChange, onColonyDetail,
}: ColonyComparisonScreenProps) {

  // ── Comparison state ─────────────────────────────────────────────────────
  const [tab, setTab]               = useState<ComparisonTab>('table')
  const [refDate, setRefDate]       = useState('2026-09-08')
  const [topApiary, setTopApiary]   = useState<string | null>(null)  // null = 全養蜂場
  const [statusFilter, setStatusFilter] = useState('all')
  const [apiaryFilter, setApiaryFilter] = useState('all')  // filter row
  const [inspFilter, setInspFilter] = useState('all')
  const [sortKey, setSortKey]       = useState<SortKey>('strength')
  const [sortDir, setSortDir]       = useState<SortDir>('desc')
  const [retryKey, setRetryKey]     = useState(0)

  // dropdown open state
  const [openDropdown, setOpenDropdown] = useState<'date' | 'apiary' | 'status' | 'apiaryFilter' | 'insp' | null>(null)

  const rankingRef = useRef<HTMLDivElement>(null)

  // ── Derived data (all re-computed when refDate changes) ──────────────────
  const allRows = useMemo(() => selectRowsForDate(COLONY_HISTORIES, refDate), [refDate])

  const topApiaryRows = topApiary
    ? allRows.filter(r => r.apiaryId === topApiary)
    : allRows

  const resolvedApiaryFilter = topApiary
    ? (apiaryFilter !== 'all' ? apiaryFilter : topApiary)
    : (apiaryFilter !== 'all' ? apiaryFilter : null)

  const filtered = filterRows(topApiaryRows, {
    apiaryId: resolvedApiaryFilter,
    status: statusFilter,
    lastInspection: inspFilter,
  })

  const sorted = sortRows(filtered, sortKey, sortDir)
  const warnings = buildWarnings(sorted)
  const rankingRows = sortRows(filtered, 'strength', 'desc')

  // ── Sort toggle ───────────────────────────────────────────────────────────
  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const closeDropdown = useCallback(() => setOpenDropdown(null), [])

  // ── Switch to ranking tab and scroll ─────────────────────────────────────
  function goToRanking() {
    setTab('ranking')
    setTimeout(() => rankingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  // ── Header ────────────────────────────────────────────────────────────────
  const header = (
    <header className={styles.header}>
      <h1 className={styles.headerTitle}>蜂群比較</h1>
      <button
        className={styles.iconBtn}
        aria-label="その他のメニュー"
        onClick={() => alert('メニュー（未実装）')}
      >
        <IconMore />
      </button>
    </header>
  )

  // ── Controls row (date + apiary) ──────────────────────────────────────────
  const controls = (
    <div className={styles.controlsRow}>
      {/* Date selector */}
      <div style={{ position: 'relative', flex: 1 }}>
        <button
          className={styles.controlBtn}
          aria-label="基準日時を変更"
          data-testid="ref-date-btn"
          onClick={() => setOpenDropdown(o => o === 'date' ? null : 'date')}
        >
          <Calendar size={15} aria-hidden color="var(--color-text-secondary)" />
          <span className={styles.controlBtnLabel}>
            {refDate.replace(/^(\d+)-0?(\d+)-0?(\d+)$/, '$1年$2月$3日時点')}
          </span>
          <span className={styles.controlBtnChevron}><IconChevronDown /></span>
        </button>
        {openDropdown === 'date' && (
          <>
            <div className={styles.overlay} onClick={closeDropdown} />
            <div className={styles.dropdown} style={{ top: '100%', left: 0, minWidth: 200, zIndex: 21 }}>
              {['2026-09-08', '2026-08-31', '2026-09-01'].map(d => (
                <button
                  key={d}
                  className={`${styles.dropdownItem} ${refDate === d ? styles.dropdownItemActive : ''}`}
                  onClick={() => { setRefDate(d); closeDropdown() }}
                >
                  {d.replace(/^(\d+)-0?(\d+)-0?(\d+)$/, '$1年$2月$3日時点')}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Apiary selector */}
      <div style={{ position: 'relative', flex: 1 }}>
        <button
          className={styles.controlBtn}
          aria-label="養蜂場を選択"
          data-testid="top-apiary-btn"
          onClick={() => setOpenDropdown(o => o === 'apiary' ? null : 'apiary')}
        >
          <MapPin size={15} aria-hidden color="var(--color-text-secondary)" />
          <span className={styles.controlBtnLabel}>
            {topApiary ? APIARIES.find(a => a.id === topApiary)?.name : '全養蜂場'}
          </span>
          <span className={styles.controlBtnChevron}><IconChevronDown /></span>
        </button>
        {openDropdown === 'apiary' && (
          <>
            <div className={styles.overlay} onClick={closeDropdown} />
            <div className={styles.dropdown} style={{ top: '100%', right: 0, zIndex: 21 }}>
              <button
                className={`${styles.dropdownItem} ${topApiary === null ? styles.dropdownItemActive : ''}`}
                onClick={() => { setTopApiary(null); setApiaryFilter('all'); closeDropdown() }}
              >
                全養蜂場
              </button>
              {APIARIES.map(a => (
                <button
                  key={a.id}
                  className={`${styles.dropdownItem} ${topApiary === a.id ? styles.dropdownItemActive : ''}`}
                  onClick={() => { setTopApiary(a.id); setApiaryFilter('all'); closeDropdown() }}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )

  // ── Segment tabs ──────────────────────────────────────────────────────────
  const segment = (
    <div className={styles.segmentRow} role="tablist" aria-label="表示切り替え">
      <button
        role="tab"
        aria-selected={tab === 'table'}
        className={tab === 'table' ? styles.segBtnActive : styles.segBtn}
        onClick={() => setTab('table')}
      >
        表
      </button>
      <button
        role="tab"
        aria-selected={tab === 'ranking'}
        className={tab === 'ranking' ? styles.segBtnActive : styles.segBtn}
        onClick={() => setTab('ranking')}
      >
        ランキング
      </button>
    </div>
  )

  // ── Filter row ────────────────────────────────────────────────────────────
  const STATUS_OPTIONS = [
    { value: 'all',     label: '状態：すべて' },
    { value: 'good',    label: '良好' },
    { value: 'caution', label: '注意' },
    { value: 'alert',   label: '要対応' },
  ]
  const APIARY_OPTIONS = [
    { value: 'all', label: '養蜂場：すべて' },
    ...APIARIES.map(a => ({ value: a.id, label: a.name })),
  ]
  const INSP_OPTIONS = [
    { value: 'all',  label: '最終内検：すべて' },
    { value: '7d',   label: '7日以内' },
    { value: '14d',  label: '14日以内' },
    { value: '30d',  label: '30日以内' },
    { value: '30d+', label: '30日超' },
  ]

  const filterRow = (
    <div className={styles.filterRow} role="group" aria-label="絞り込みフィルター">
      {/* Status filter */}
      <div style={{ position: 'relative', flex: 1 }}>
        <button
          className={`${styles.filterBtn} ${statusFilter !== 'all' ? styles.filterBtnActive : ''}`}
          aria-label="状態フィルター"
          data-testid="status-filter-btn"
          onClick={() => setOpenDropdown(o => o === 'status' ? null : 'status')}
        >
          <span className={styles.filterBtnLabel}>
            {statusFilter === 'all' ? '状態' : STATUS_OPTIONS.find(o => o.value === statusFilter)?.label}
          </span>
          <IconChevronDown />
        </button>
        {openDropdown === 'status' && (
          <>
            <div className={styles.overlay} onClick={closeDropdown} />
            <div className={styles.dropdown} style={{ top: '100%', left: 0, zIndex: 21 }}>
              {STATUS_OPTIONS.map(o => (
                <button
                  key={o.value}
                  className={`${styles.dropdownItem} ${statusFilter === o.value ? styles.dropdownItemActive : ''}`}
                  onClick={() => { setStatusFilter(o.value); closeDropdown() }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Apiary filter */}
      <div style={{ position: 'relative', flex: 1 }}>
        <button
          className={`${styles.filterBtn} ${apiaryFilter !== 'all' ? styles.filterBtnActive : ''}`}
          aria-label="養蜂場フィルター"
          data-testid="apiary-filter-btn"
          onClick={() => setOpenDropdown(o => o === 'apiaryFilter' ? null : 'apiaryFilter')}
        >
          <span className={styles.filterBtnLabel}>
            {apiaryFilter === 'all' ? '養蜂場' : APIARIES.find(a => a.id === apiaryFilter)?.name}
          </span>
          <IconChevronDown />
        </button>
        {openDropdown === 'apiaryFilter' && (
          <>
            <div className={styles.overlay} onClick={closeDropdown} />
            <div className={styles.dropdown} style={{ top: '100%', left: 0, zIndex: 21 }}>
              {APIARY_OPTIONS.map(o => (
                <button
                  key={o.value}
                  className={`${styles.dropdownItem} ${apiaryFilter === o.value ? styles.dropdownItemActive : ''}`}
                  onClick={() => { setApiaryFilter(o.value); closeDropdown() }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Last inspection filter */}
      <div style={{ position: 'relative', flex: 1 }}>
        <button
          className={`${styles.filterBtn} ${inspFilter !== 'all' ? styles.filterBtnActive : ''}`}
          aria-label="最終内検フィルター"
          data-testid="insp-filter-btn"
          onClick={() => setOpenDropdown(o => o === 'insp' ? null : 'insp')}
        >
          <span className={styles.filterBtnLabel}>
            {inspFilter === 'all' ? '最終内検' : INSP_OPTIONS.find(o => o.value === inspFilter)?.label}
          </span>
          <IconChevronDown />
        </button>
        {openDropdown === 'insp' && (
          <>
            <div className={styles.overlay} onClick={closeDropdown} />
            <div className={styles.dropdown} style={{ top: '100%', right: 0, zIndex: 21 }}>
              {INSP_OPTIONS.map(o => (
                <button
                  key={o.value}
                  className={`${styles.dropdownItem} ${inspFilter === o.value ? styles.dropdownItemActive : ''}`}
                  onClick={() => { setInspFilter(o.value); closeDropdown() }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )

  // ── Comparison table ──────────────────────────────────────────────────────
  const comparisonTable = (
    <div className={styles.tableWrap} role="region" aria-label="蜂群比較表">
      <table className={styles.table}>
        <colgroup>
          <col className={styles.colonyCol} />
          <col className={styles.strengthCol} />
          <col className={styles.beeCol} />
          <col className={styles.broodCol} />
          <col className={styles.honeyCol} />
          <col className={styles.inspCol} />
        </colgroup>
        <thead>
          <tr>
            <th className={styles.colonyCol} style={{ textAlign: 'left', paddingLeft: 8 }}>蜂群</th>
            <SortTh col="strength" label="強さ" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
            <SortTh col="bee" label="蜂量" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
            <SortTh col="brood" label="育児" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
            <SortTh col="honey" label="貯蜜" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
            <SortTh col="lastInspection" label="最終内検" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '24px 8px', color: 'var(--color-text-secondary)', fontSize: 13 }}>
                該当する蜂群がありません
              </td>
            </tr>
          ) : sorted.map(row => (
            <tr
              key={row.colonyId}
              className={row.status === 'alert' ? styles.tableRowAlert : styles.tableRowNormal}
              tabIndex={0}
              role="button"
              aria-label={`${row.colonyName} 詳細を表示`}
              data-testid={`colony-row-${row.colonyId}`}
              onClick={() => onColonyDetail(row.colonyId)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onColonyDetail(row.colonyId) }}
            >
              <td>
                <div className={styles.colonyCell}>
                  <span className={styles.colonyDot} style={{ background: row.color }} aria-hidden />
                  <span className={styles.colonyName}>{row.colonyName}</span>
                </div>
              </td>
              <td>
                <span className={styles.strengthVal} data-testid={`strength-${row.colonyId}`}>
                  {row.strength ?? '—'}
                </span>
              </td>
              <td className={styles.metricVal}>{formatPct(row.bee)}</td>
              <td className={styles.metricVal}>{formatPct(row.brood)}</td>
              <td className={styles.metricVal}>{formatPct(row.honey)}</td>
              <td className={styles.inspVal}>{formatDays(row.daysSinceInspection)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  // ── Warning cards ──────────────────────────────────────────────────────────
  const warningCards = warnings.length > 0 ? (
    warnings.slice(0, 1).map(w => (
      <button
        key={w.colonyId}
        className={styles.warningCard}
        data-testid="warning-card"
        aria-label={w.message}
        onClick={() => onColonyDetail(w.colonyId)}
      >
        <span className={styles.warningIconWrap} aria-hidden>
          <AlertCircle size={14} />
        </span>
        <span className={styles.warningText}>{w.message}</span>
        <ChevronRight size={16} className={styles.warningChevron} aria-hidden />
      </button>
    ))
  ) : null

  // ── Ranking card (summary in table tab) ──────────────────────────────────
  const rankingCard = (
    <div className={styles.rankingCard} data-testid="ranking-card">
      <div className={styles.rankingHeader}>
        <span className={styles.rankingTitle}>強さランキング</span>
        <button className={styles.rankingLinkBtn} onClick={goToRanking} aria-label="ランキング表示へ切り替え">
          ランキング表示へ <ChevronUp size={12} aria-hidden />
        </button>
      </div>
      <div className={styles.rankingRows}>
        {rankingRows.map((row, i) => (
          <div key={row.colonyId} className={styles.rankingRow} data-testid={`ranking-row-${i + 1}`}>
            <div className={`${styles.rankBadge} ${rankBadgeClass(i + 1)}`} aria-label={`${i + 1}位`}>
              {i + 1}
            </div>
            <span className={styles.rankColonyName}>{row.colonyName}</span>
            <div className={styles.rankBarWrap}>
              <div
                className={styles.rankBar}
                style={{
                  width: `${Math.max(0, Math.min(100, (row.strength ?? 0) / 100 * 100))}%`,
                  background: row.color,
                }}
                aria-hidden
              />
            </div>
            <span className={styles.rankScore} data-testid={`rank-score-${row.colonyId}`}>
              {row.strength ?? '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  // ── Info row ──────────────────────────────────────────────────────────────
  const infoRow = (
    <div className={styles.infoRow}>
      <Info size={14} aria-hidden color="var(--color-text-secondary)" />
      <span className={styles.infoText}>同じ時点の最新記録を比較しています。</span>
    </div>
  )

  // ── Ranking tab full content ──────────────────────────────────────────────
  const rankingTabContent = (
    <div className={styles.rankingTabWrap} ref={rankingRef} data-testid="ranking-tab-content">
      <div className={styles.rankingTabHeader}>強さランキング</div>
      <div className={styles.rankingTabRows}>
        {rankingRows.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
            該当する蜂群がありません
          </p>
        ) : rankingRows.map((row, i) => (
          <div key={row.colonyId} className={styles.rankingRow} data-testid={`ranking-tab-row-${i + 1}`}>
            <div className={`${styles.rankBadge} ${rankBadgeClass(i + 1)}`} aria-label={`${i + 1}位`}>
              {i + 1}
            </div>
            <span className={styles.rankColonyName}>{row.colonyName}</span>
            <div className={styles.rankBarWrap}>
              <div
                className={styles.rankBar}
                style={{
                  width: `${Math.max(0, Math.min(100, (row.strength ?? 0) / 100 * 100))}%`,
                  background: row.color,
                }}
                aria-hidden
              />
            </div>
            <span className={styles.rankScore} data-testid={`rank-tab-score-${row.colonyId}`}>
              {row.strength ?? '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  // ── State screens ─────────────────────────────────────────────────────────
  if (viewState === 'loading') {
    return (
      <div className={styles.screen}>
        {header}
        <div className={styles.stateWrap}>
          <div className={styles.spinner} aria-hidden data-testid="spinner" />
          <span className={styles.stateDesc} aria-live="polite">蜂群データを読み込み中…</span>
        </div>
        <BottomNav activeTab="analytics" onTabChange={onTabChange} />
      </div>
    )
  }

  if (viewState === 'error') {
    return (
      <div className={styles.screen}>
        {header}
        <div className={styles.stateWrap}>
          <AlertTriangle size={48} className={styles.stateIcon} aria-hidden />
          <p className={styles.stateTitle}>蜂群データを取得できませんでした</p>
          <p className={styles.stateDesc}>ネットワーク接続を確認してから再度お試しください。</p>
          <button className={styles.stateBtn} onClick={() => setRetryKey(k => k + 1)} data-testid="retry-btn">
            <RefreshCw size={16} aria-hidden style={{ marginRight: 6, verticalAlign: 'middle' }} />
            再試行
          </button>
          <button className={styles.stateBtnSecondary} onClick={() => onTabChange('home')}>
            戻る
          </button>
        </div>
        <BottomNav activeTab="analytics" onTabChange={onTabChange} />
      </div>
    )
  }

  if (viewState === 'empty') {
    const hasAnyColonies = COLONY_HISTORIES.length > 0
    return (
      <div className={styles.screen}>
        {header}
        {controls}
        {segment}
        {filterRow}
        <div className={styles.stateWrap}>
          <Info size={48} className={styles.stateIcon} aria-hidden />
          {hasAnyColonies ? (
            <>
              <p className={styles.stateTitle}>比較できる蜂群がありません</p>
              <p className={styles.stateDesc}>選択した条件に一致する蜂群の記録がありません。</p>
              <button
                className={styles.stateBtn}
                data-testid="reset-btn"
                onClick={() => {
                  setTopApiary(null); setStatusFilter('all')
                  setApiaryFilter('all'); setInspFilter('all')
                }}
              >
                条件をリセット
              </button>
            </>
          ) : (
            <>
              <p className={styles.stateTitle}>蜂群がまだ登録されていません</p>
              <p className={styles.stateDesc}>蜂群を追加して内検を行うと比較できるようになります。</p>
            </>
          )}
        </div>
        <BottomNav activeTab="analytics" onTabChange={onTabChange} />
      </div>
    )
  }

  if (viewState === 'offline-no-cache') {
    return (
      <div className={styles.screen}>
        {header}
        <div className={styles.stateWrap}>
          <WifiOff size={48} className={styles.stateIcon} aria-hidden />
          <p className={styles.stateTitle}>保存済みの比較データがありません</p>
          <p className={styles.stateDesc}>オンライン時に蜂群比較を表示しておくと、オフラインでも確認できます。</p>
          <button className={styles.stateBtnSecondary} onClick={() => onTabChange('home')}>
            戻る
          </button>
        </div>
        <BottomNav activeTab="analytics" onTabChange={onTabChange} />
      </div>
    )
  }

  // ── Normal / Offline with cache ───────────────────────────────────────────
  return (
    <div className={styles.screen} key={retryKey}>
      {header}
      <div className={styles.scrollArea}>
        {viewState === 'offline' && (
          <div className={styles.offlineBanner} role="status">
            <WifiOff size={15} aria-hidden />
            オフライン — 保存済みの比較データを表示しています
          </div>
        )}
        {controls}
        {segment}
        {filterRow}

        {tab === 'table' ? (
          <>
            {comparisonTable}
            {warningCards}
            {rankingCard}
            {infoRow}
          </>
        ) : (
          <>
            {rankingTabContent}
            {infoRow}
          </>
        )}

        <div className={styles.sectionBottom} />
      </div>
      <BottomNav activeTab="analytics" onTabChange={onTabChange} />
    </div>
  )
}
