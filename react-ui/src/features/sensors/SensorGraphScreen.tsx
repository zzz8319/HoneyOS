import { useState, useRef } from 'react'
import {
  ChevronLeft, ChevronRight, MoreVertical,
  AlertTriangle, WifiOff, Download,
  Settings, Clock,
} from 'lucide-react'
import type { SensorGraphViewState, SensorGraphKind, PeriodMode, SensorGraphData } from './sensorGraphTypes'
import type { GraphColony, SensorEvent } from './sensorGraphTypes'
import {
  GRAPH_FIXTURE_PARTIAL,
  GRAPH_FIXTURE_EMPTY,
  getFixtureForKind,
} from './sensorGraphFixtures'
import { SensorTimeSeriesChart } from './SensorTimeSeriesChart'
import { SensorEventSheet } from './SensorEventSheet'
import { CustomRangeSheet } from './CustomRangeSheet'
import styles from './SensorGraphScreen.module.css'

// ── Config per sensor kind ──────────────────────────────────────────────────
const KIND_CONFIG: Record<SensorGraphKind, {
  label: string; color: string; colorSoft: string; compColor: string
}> = {
  temperature: { label: '温度',   color: '#E39A16', colorSoft: '#FFF3D8', compColor: '#9CA3AF' },
  humidity:    { label: '湿度',   color: '#2563EB', colorSoft: '#DBEAFE', compColor: '#9CA3AF' },
  weight:      { label: '重量',   color: '#16A34A', colorSoft: '#DCFCE7', compColor: '#9CA3AF' },
  sound:       { label: '音響',   color: '#525E6A', colorSoft: '#F1F3F5', compColor: '#9CA3AF' },
}
const ALL_KINDS: SensorGraphKind[] = ['temperature', 'humidity', 'weight', 'sound']

interface Props {
  viewState?: SensorGraphViewState
  colony?: GraphColony
  initialKind?: SensorGraphKind
  onBack: () => void
  onSensorSettings?: () => void
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function resolveData(
  vs: SensorGraphViewState,
  kind: SensorGraphKind,
  period: PeriodMode,
): SensorGraphData | null {
  if (vs === 'loading') return null
  if (vs === 'error')   return null
  if (vs === 'offline-no-cache') return null
  if (vs === 'empty')   return GRAPH_FIXTURE_EMPTY
  if (vs === 'partial-data') return GRAPH_FIXTURE_PARTIAL
  if (vs === 'week'  || period === 'week')  return getFixtureForKind(kind, 'week')
  if (vs === 'month' || period === 'month') return getFixtureForKind(kind, 'month')
  return getFixtureForKind(kind, 'day')
}

function formatDateNav(date: Date, mode: PeriodMode): string {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  if (mode === 'day') return `${y}年${m}月${d}日`
  if (mode === 'week') {
    const end = new Date(date); end.setDate(end.getDate() + 6)
    return `${y}年${m}月${d}日〜${end.getMonth()+1}月${end.getDate()}日`
  }
  if (mode === 'month') return `${y}年${m}月`
  return `${y}年${m}月${d}日`
}

function comparisonLabel(mode: PeriodMode): string {
  if (mode === 'week')  return '前週との比較'
  if (mode === 'month') return '前月との比較'
  if (mode === 'custom') return '直前同期間との比較'
  return '前日との比較'
}

function todayLabel(date: Date, mode: PeriodMode): string {
  const m = date.getMonth()+1, d = date.getDate(), y = date.getFullYear()
  if (mode === 'week') {
    const end = new Date(date); end.setDate(end.getDate() + 6)
    return `${m}/${d}〜${end.getMonth()+1}/${end.getDate()}（今週）`
  }
  if (mode === 'month') return `${y}年${m}月（今月）`
  return `${y}/${m}/${d}（今日）`
}

function prevLabel(date: Date, mode: PeriodMode): string {
  if (mode === 'week') {
    const start = new Date(date); start.setDate(start.getDate() - 7)
    const end = new Date(date); end.setDate(end.getDate() - 1)
    return `${start.getMonth()+1}/${start.getDate()}〜${end.getMonth()+1}/${end.getDate()}（前週）`
  }
  if (mode === 'month') {
    const prev = new Date(date); prev.setMonth(prev.getMonth() - 1)
    return `${prev.getFullYear()}年${prev.getMonth()+1}月（前月）`
  }
  const prev = new Date(date); prev.setDate(prev.getDate() - 1)
  const m = prev.getMonth()+1, d = prev.getDate(), y = prev.getFullYear()
  return `${y}/${m}/${d}（前日）`
}

function graphTitle(mode: PeriodMode, kind: SensorGraphKind): string {
  const kl = KIND_CONFIG[kind].label
  if (mode === 'day')   return `24時間の${kl}推移`
  if (mode === 'week')  return `7日間の${kl}推移`
  if (mode === 'month') return `月間の${kl}推移`
  return `${kl}推移`
}

const PERIOD_LABELS: Record<PeriodMode, string> = {
  day: '日', week: '週', month: '月', custom: 'カスタム',
}

// ── Component ────────────────────────────────────────────────────────────────
export function SensorGraphScreen({
  viewState = 'normal-day',
  colony = { id: 'a3', name: 'A-03', apiaryName: '宮田養蜂場' },
  initialKind = 'temperature',
  onBack,
  onSensorSettings,
}: Props) {
  const isLoading        = viewState === 'loading'
  const isError          = viewState === 'error'
  const isOfflineNoCache = viewState === 'offline-no-cache'
  const isOfflineCached  = viewState === 'offline-cached'
  const isOffline        = isOfflineNoCache || isOfflineCached

  const [kind, setKind] = useState<SensorGraphKind>(initialKind)
  const [period, setPeriod] = useState<PeriodMode>(() => {
    if (viewState === 'week') return 'week'
    if (viewState === 'month') return 'month'
    if (viewState === 'custom-range') return 'custom'
    return 'day'
  })
  const [navDate, setNavDate] = useState<Date>(() => {
    if (viewState === 'month') return new Date('2026-09-01')
    return new Date('2026-09-08')
  })
  const [selectorOpen, setSelectorOpen] = useState(viewState === 'metric-selector-open')
  const [customRangeOpen, setCustomRangeOpen] = useState(viewState === 'custom-range')
  const [customStart, setCustomStart] = useState(() =>
    viewState === 'custom-range' ? '2026-09-01' : '',
  )
  const [customEnd, setCustomEnd] = useState(() =>
    viewState === 'custom-range' ? '2026-09-07' : '',
  )
  const [eventSheetEvent, setEventSheetEvent] = useState<SensorEvent | null>(null)
  const [retried, setRetried] = useState(false)
  const [liveMsg, setLiveMsg] = useState('')
  const [selectedPointIdx, setSelectedPointIdx] = useState<number | null>(
    viewState === 'tooltip-active' ? 14 : null,
  )
  const filterBtnRef = useRef<HTMLButtonElement>(null)

  const cfg  = KIND_CONFIG[kind]
  const vsForData = isError && retried ? 'normal-day' as SensorGraphViewState : viewState
  const data = resolveData(vsForData, kind, period)
  const missing = data ? data.current.filter(p => p.value === null).length : 0

  const isToday = (() => {
    const t = new Date(); t.setHours(0,0,0,0)
    const n = new Date(navDate); n.setHours(0,0,0,0)
    return n >= t
  })()

  function navigate(dir: 1 | -1) {
    setNavDate(prev => {
      const d = new Date(prev)
      if (period === 'week')  d.setDate(d.getDate() + dir * 7)
      else if (period === 'month') d.setMonth(d.getMonth() + dir)
      else d.setDate(d.getDate() + dir)
      return d
    })
  }

  function handlePeriodChange(p: PeriodMode) {
    if (p === 'custom') {
      setCustomRangeOpen(true)
      setPeriod('custom')
      return
    }
    setPeriod(p)
    setCustomRangeOpen(false)
  }

  function handleCustomApply(start: string, end: string) {
    setCustomStart(start); setCustomEnd(end)
    setPeriod('custom'); setCustomRangeOpen(false)
  }

  function handleKindSelect(k: SensorGraphKind) {
    setKind(k); setSelectorOpen(false)
    setSelectedPointIdx(null)
    filterBtnRef.current?.focus()
  }

  function handleCSV() {
    if (!data || data.current.length === 0) return
    const BOM = '﻿'
    const header = 'timestamp,sensor_type,value,unit,status\n'
    const rows = data.current.map(p =>
      `${p.measuredAt},${kind},${p.value ?? ''},${data.unit},${p.status ?? 'normal'}`,
    ).join('\n')
    const blob = new Blob([BOM + header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${colony.name}_${kind}_${navDate.toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setLiveMsg('CSVを出力しました')
    setTimeout(() => setLiveMsg(''), 3000)
  }

  const csvDisabled = isLoading || isOfflineNoCache || (isError && !retried) || !data || data.current.length === 0

  // ── Fixed header portion (always visible) ────────────────────────────────
  const fixedControls = (
    <>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="戻る">
          <ChevronLeft size={24} aria-hidden />
        </button>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>{cfg.label}</h1>
          <p className={styles.subtitle}>{colony.name} センサー</p>
        </div>
        <button className={styles.moreBtn} aria-label="メニュー" disabled>
          <MoreVertical size={20} aria-hidden />
        </button>
      </header>

      {/* Sensor kind selector */}
      <div className={styles.selectorRow}>
        <div className={styles.selectorWrap}>
          <button
            ref={filterBtnRef}
            className={styles.kindBtn}
            onClick={() => setSelectorOpen(v => !v)}
            aria-expanded={selectorOpen}
            aria-haspopup="listbox"
            aria-label={`センサー種別: ${cfg.label}。変更する`}
          >
            {cfg.label}
            <ChevronRight
              size={16}
              className={selectorOpen ? styles.chevronUp : styles.chevronDown}
              aria-hidden
            />
          </button>
          {selectorOpen && (
            <ul className={styles.kindList} role="listbox" aria-label="センサー種別を選択">
              {ALL_KINDS.map(k => (
                <li key={k} role="option" aria-selected={k === kind}>
                  <button
                    className={`${styles.kindOption}${k === kind ? ` ${styles.kindOptionSelected}` : ''}`}
                    onClick={() => handleKindSelect(k)}
                  >
                    {KIND_CONFIG[k].label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Period segment control */}
      <div className={styles.periodRow} role="group" aria-label="表示期間">
        {(['day', 'week', 'month', 'custom'] as PeriodMode[]).map(p => (
          <button
            key={p}
            className={`${styles.periodBtn}${period === p ? ` ${styles.periodBtnActive}` : ''}`}
            onClick={() => handlePeriodChange(p)}
            aria-pressed={period === p}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Date navigator */}
      <div className={styles.dateNav}>
        <button
          className={styles.dateNavBtn}
          onClick={() => navigate(-1)}
          aria-label="前の期間"
          disabled={isLoading}
        >
          <ChevronLeft size={20} aria-hidden />
        </button>
        <span className={styles.dateLabel}>
          {period === 'custom' && customStart
            ? `${customStart}〜${customEnd}`
            : formatDateNav(navDate, period)}
        </span>
        <button
          className={styles.dateNavBtn}
          onClick={() => navigate(1)}
          aria-label="次の期間"
          disabled={isLoading || isToday}
        >
          <ChevronRight size={20} aria-hidden />
        </button>
      </div>

      {/* Offline banner */}
      {isOffline && (
        <div className={styles.banner} role="alert">
          <WifiOff size={14} aria-hidden />
          <span>
            {isOfflineCached
              ? 'オフラインです。最終取得データを表示しています。'
              : 'オフラインのためセンサーデータを表示できません。'}
          </span>
        </div>
      )}

      {/* Live region */}
      <span role="status" aria-live="polite" className={styles.srOnly}>{liveMsg}</span>
    </>
  )

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={styles.screen}>
        {fixedControls}
        <div className={styles.skeletonBody} aria-busy="true" aria-label="センサーデータを読み込み中">
          <div className={styles.skeletonCard}>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonGraph} />
            <div className={styles.skeletonStats} />
          </div>
          <div className={styles.skeletonCard}>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonGraph} style={{ height: 120 }} />
          </div>
          <div className={styles.skeletonMeta} />
          <div className={styles.skeletonActions} />
        </div>
      </div>
    )
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (isError && !retried) {
    return (
      <div className={styles.screen}>
        {fixedControls}
        <div className={styles.body}>
          <div className={styles.errorState}>
            <AlertTriangle size={32} aria-hidden className={styles.errorIcon} />
            <p className={styles.errorMsg}>センサーデータの取得に失敗しました。</p>
            <button className={styles.retryBtn} onClick={() => setRetried(true)}>再読み込み</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Offline-no-cache ──────────────────────────────────────────────────────
  if (isOfflineNoCache) {
    return (
      <div className={styles.screen}>
        {fixedControls}
        <div className={styles.body}>
          <div className={styles.errorState}>
            <WifiOff size={32} aria-hidden className={styles.errorIcon} style={{ color: '#66707A' }} />
            <p className={styles.errorMsg}>オフラインのためセンサーデータを表示できません。</p>
            <p className={styles.errorHint}>接続が回復したら更新ボタンを押してください。</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!data || data.current.length === 0) {
    return (
      <div className={styles.screen}>
        {fixedControls}
        <div className={styles.body}>
          <div className={styles.emptyState}>
            <p className={styles.emptyMsg}>この期間のデータがありません。</p>
            <p className={styles.emptyHint}>日付ナビゲーションで別の期間を選択してください。</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Normal / data states ──────────────────────────────────────────────────
  return (
    <div className={styles.screen}>
      {fixedControls}

      <div className={styles.body}>
        {/* Main graph card */}
        <section className={styles.card} aria-label="センサーグラフ">
          <h2 className={styles.cardTitle}>{graphTitle(period, kind)}</h2>
          {isOfflineCached && (
            <p className={styles.cacheNotice}>
              <Clock size={11} aria-hidden />
              キャッシュ取得時刻: {new Date(data.fetchedAt).toLocaleString('ja-JP')}
            </p>
          )}
          <SensorTimeSeriesChart
            data={data.current}
            color={cfg.color}
            colorSoft={cfg.colorSoft}
            unit={data.unit}
            threshold={data.threshold}
            periodMode={period === 'custom' ? 'day' : period}
            initialSelectedIndex={selectedPointIdx}
            onSelectIndex={setSelectedPointIdx}
            ariaLabel={`${cfg.label}の推移グラフ`}
          />
        </section>

        {/* Abnormal events */}
        {data.events.length > 0 && (
          <section className={styles.eventsSection} aria-label="異常イベント">
            {data.events.map(ev => (
              <button
                key={ev.id}
                className={styles.eventCard}
                onClick={() => setEventSheetEvent(ev)}
                aria-label={`異常イベント: ${ev.message}。詳細を見る`}
              >
                <AlertTriangle size={18} className={styles.eventIcon} aria-hidden />
                <span className={styles.eventBody}>
                  <span className={styles.eventTime}>
                    {(period === 'week' || period === 'month')
                      ? (() => {
                          const s = new Date(ev.startedAt)
                          const prefix = `${s.getMonth()+1}/${s.getDate()} `
                          const startT = s.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
                          const endT = ev.endedAt
                            ? new Date(ev.endedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
                            : null
                          return `${prefix}${startT}${endT ? `〜${endT}` : ''}`
                        })()
                      : (() => {
                          const startT = new Date(ev.startedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
                          const endT = ev.endedAt
                            ? new Date(ev.endedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
                            : null
                          return `${startT}${endT ? ` 〜 ${endT}` : ''}`
                        })()
                    }
                  </span>
                  <span className={styles.eventMsg}>{ev.message}</span>
                </span>
                <ChevronRight size={16} className={styles.eventChevron} aria-hidden />
              </button>
            ))}
          </section>
        )}

        {/* Comparison graph card */}
        {data.comparison.length > 0 && (
          <section className={styles.card} aria-label={comparisonLabel(period)}>
            <h2 className={styles.cardTitle}>{comparisonLabel(period)}</h2>
            <div className={styles.legend}>
              <span className={styles.legendItem}>
                <span className={styles.legendLine} style={{ background: cfg.color }} />
                {todayLabel(navDate, period)}
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDash} style={{ borderColor: cfg.compColor }} />
                {prevLabel(navDate, period)}
              </span>
            </div>
            <SensorTimeSeriesChart
              data={data.current}
              comparisonData={data.comparison}
              color={cfg.color}
              colorSoft={cfg.colorSoft}
              compColor={cfg.compColor}
              unit={data.unit}
              threshold={data.threshold}
              periodMode={period === 'custom' ? 'day' : period}
              showComparison
              ariaLabel={`${comparisonLabel(period)}グラフ`}
            />
          </section>
        )}

        {/* Meta row */}
        <div className={styles.metaRow}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>更新間隔</span>
            <span className={styles.metaValue}>{data.intervalMinutes}分</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>欠損</span>
            <span className={`${styles.metaValue}${missing > 0 ? ` ${styles.metaWarn}` : ''}`}>
              {missing}件
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className={styles.actions}>
          <button
            className={styles.csvBtn}
            onClick={handleCSV}
            disabled={csvDisabled}
            aria-label="センサーデータをCSV出力"
          >
            <Download size={16} aria-hidden />
            CSV出力
          </button>
          <button
            className={styles.settingsBtn}
            onClick={onSensorSettings}
            disabled={!onSensorSettings}
            aria-label="センサー設定"
          >
            <Settings size={16} aria-hidden />
            センサー設定
            <ChevronRight size={14} aria-hidden />
          </button>
        </div>
      </div>

      {/* Sheets */}
      {eventSheetEvent && (
        <SensorEventSheet
          event={eventSheetEvent}
          unit={data.unit}
          onClose={() => setEventSheetEvent(null)}
        />
      )}
      {customRangeOpen && (
        <CustomRangeSheet
          initialStart={customStart}
          initialEnd={customEnd}
          onApply={handleCustomApply}
          onCancel={() => setCustomRangeOpen(false)}
        />
      )}
    </div>
  )
}
