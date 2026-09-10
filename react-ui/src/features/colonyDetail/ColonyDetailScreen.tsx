import { useState } from 'react'
import { ChevronLeft, X } from 'lucide-react'
import { ErrorBanner } from '../../components'
import { CompositionTrendChart } from './CompositionTrendChart'
import { StrengthTrendChart } from './StrengthTrendChart'
import { SensorSummary } from './SensorSummary'
import { QuickLinkCard } from './QuickLinkCard'
import { mockColonyDetail } from './mockData'
import type { InspectionPoint } from './mockData'
import styles from './ColonyDetailScreen.module.css'

export type ColonyDetailViewState = 'normal' | 'empty' | 'loading' | 'error' | 'offline'

interface Props {
  colonyId?: string
  viewState?: ColonyDetailViewState
  onBack?: () => void
  onStartInspection?: (colonyId: string) => void
}

const STATUS_STYLE: Record<string, string> = {
  good: 'badge_good', warn: 'badge_warn', danger: 'badge_danger',
}

function shortDateLabel(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function Skeleton({ h = 16, w = '100%' }: { h?: number; w?: string }) {
  return <div className={styles.skel} style={{ height: h, width: w }} />
}

function CardSkeleton({ height = 120 }: { height?: number }) {
  return (
    <div className={styles.skelCard} style={{ height }}>
      <Skeleton h={14} w="40%" />
      <Skeleton h={height - 40} />
    </div>
  )
}

export function ColonyDetailScreen({
  colonyId,
  viewState = 'normal',
  onBack,
  onStartInspection,
}: Props) {
  const colony = mockColonyDetail

  // 8/28 内検を初期選択状態にしてポップアップを表示する
  const defaultActive = colony.inspections.find(i => i.date === '2026-08-28') ?? null
  const [activeInsp, setActiveInsp] = useState<InspectionPoint | null>(
    viewState === 'normal' ? defaultActive : null,
  )

  const isLoading = viewState === 'loading'
  const isError   = viewState === 'error'
  const isEmpty   = viewState === 'empty'
  const isOffline = viewState === 'offline'
  const showData  = !isLoading && !isError && !isEmpty

  const handlePointClick = (insp: InspectionPoint) => {
    setActiveInsp(prev => prev?.id === insp.id ? null : insp)
  }

  return (
    <div className={styles.shell}>
      {/* ===== 詳細ヘッダー ===== */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="戻る">
          <ChevronLeft size={20} aria-hidden />
        </button>
        <div className={styles.headerInfo}>
          <h1 className={styles.colonyName}>{colony.name}</h1>
          <span className={styles.location}>{colony.apiaryName}・{colony.hiveName}</span>
        </div>
        <span className={`${styles.badge} ${styles[STATUS_STYLE[colony.status]]}`}>
          {colony.statusLabel}
        </span>
      </header>

      {isOffline && (
        <ErrorBanner
          message={`オフラインです。最終同期: ${colony.lastSyncAt}`}
          severity="minor"
        />
      )}
      {isError && (
        <ErrorBanner
          message="一部のデータ取得に失敗しました。"
          severity="critical"
        />
      )}

      <main className={styles.content}>

        {/* ===== 空状態 ===== */}
        {isEmpty && (
          <div className={styles.emptyWrap}>
            <span className={styles.emptyEmoji}>📋</span>
            <p className={styles.emptyTitle}>内検記録がありません</p>
            <p className={styles.emptyDesc}>最初の内検を記録して、蜂群の状態を管理しましょう。</p>
          </div>
        )}

        {/* ===== 内訳の推移カード ===== */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>内訳の推移</h2>
          </div>
          {/* 凡例 */}
          <div className={styles.legend}>
            {[
              { label: '蜂',   color: '#16A34A' },
              { label: '育児', color: '#EAB308' },
              { label: '貯蜜', color: '#E39A16' },
            ].map(({ label, color }) => (
              <span key={label} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: color }} />
                {label}
              </span>
            ))}
            <span className={styles.legendNote}>（全巣枠の平均構成比）</span>
          </div>

          {isLoading ? (
            <CardSkeleton height={170} />
          ) : (
            <CompositionTrendChart
              inspections={showData || isOffline ? colony.inspections : []}
              onPointClick={handlePointClick}
              activeId={activeInsp?.id}
            />
          )}

          {/* データポイントポップアップ */}
          {activeInsp && !isLoading && (
            <div className={styles.popover} role="dialog" aria-label="内検詳細">
              <button className={styles.popoverClose} onClick={() => setActiveInsp(null)}
                aria-label="閉じる"><X size={14} /></button>
              <p className={styles.popoverDate}>
                {shortDateLabel(activeInsp.date)} {activeInsp.time} {activeInsp.weather}
              </p>
              <p className={styles.popoverNote}>{activeInsp.note}</p>
              <button
                className={styles.popoverBtn}
                onClick={() => alert(`枠ビューア → SCR-013 colonyId: ${colony.id} inspectionId: ${activeInsp.id}（未実装）`)}
              >
                ▣ 枠ビューアで見る
              </button>
            </div>
          )}

          <button className={styles.historyLink}
            onClick={() => alert('内検履歴 → SCR-012（未実装）')}>
            内検履歴を見る ›
          </button>
        </section>

        {/* ===== 強さスコア推移カード ===== */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleRow}>
              <h2 className={styles.cardTitle}>強さスコア推移</h2>
              <span className={styles.betaBadge}>簡易指標 β</span>
            </div>
            <div className={styles.scoreWrap}>
              <span className={styles.scoreVal}>
                現在 {colony.strengthScore}
              </span>
              <span className={colony.strengthScoreDelta >= 0 ? styles.deltaUp : styles.deltaDown}>
                {colony.strengthScoreDelta >= 0 ? '↑' : '↓'} {Math.abs(colony.strengthScoreDelta)}（前回比）
              </span>
            </div>
          </div>

          {isLoading ? (
            <CardSkeleton height={148} />
          ) : (
            <StrengthTrendChart
              history={showData || isOffline ? colony.strengthHistory : []}
            />
          )}

          <button className={styles.betaNote}
            onClick={() => alert('簡易指標β 算出方法の説明（未実装）')}>
            簡易指標β・季節補正なし — 算出方法を確認 ›
          </button>
        </section>

        {/* ===== センサー情報カード ===== */}
        {isLoading ? (
          <CardSkeleton height={120} />
        ) : isError ? (
          <div className={styles.errorSection}>
            <span className={styles.errorMsg}>センサー情報の取得に失敗しました。</span>
            <button className={styles.retryBtn}
              onClick={() => alert('再試行（未実装）')}>再試行</button>
          </div>
        ) : (
          <SensorSummary
            sensor={colony.sensor}
            onDetailClick={() => alert('センサー詳細 → SCR-017（未実装）')}
          />
        )}

        {/* ===== クイック導線 ===== */}
        {isLoading ? (
          <div className={styles.quickRow}>
            <CardSkeleton height={100} />
            <CardSkeleton height={100} />
            <CardSkeleton height={100} />
          </div>
        ) : (
          <div className={styles.quickRow}>
            <QuickLinkCard
              icon="📋"
              title="作業記録"
              subtitle={`直近 ${colony.workRecordCount}件`}
              onClick={() => alert('作業履歴（未実装）')}
            />
            <QuickLinkCard
              icon="📷"
              title="カメラ画像"
              subtitle={`最新 ${colony.latestCameraDate}`}
              onClick={() => alert(`カメラ画像 → SCR-021 colonyId: ${colony.id}（未実装）`)}
            />
            <QuickLinkCard
              icon="🤖"
              title="AI診断"
              subtitle={colony.aiDiagnosisLabel}
              onClick={() => alert('AI診断（未実装）')}
            />
          </div>
        )}

      </main>

      {/* ===== 固定CTAボタン ===== */}
      <div className={styles.ctaWrap}>
        <button
          className={styles.ctaBtn}
          onClick={() => onStartInspection?.(colonyId ?? colony.id)}
          aria-label="内検を始める"
        >
          ▷ 内検を始める
        </button>
      </div>
    </div>
  )
}
