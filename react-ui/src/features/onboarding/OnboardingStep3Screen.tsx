import { useState } from 'react'
import { ChevronLeft, User, MapPin, Layers, Check, WifiOff, AlertTriangle } from 'lucide-react'
import type { OnboardingStep3ViewState } from './types'
import styles from './OnboardingStep3Screen.module.css'

interface ProfileData {
  name: string
  farmName: string
  location: string
  colonyCount: number
}

interface Props {
  viewState?: OnboardingStep3ViewState
  onBack: () => void
  onStartInspection: () => void
  onDashboard: () => void
  onAddApiary: () => void
  onAddColony: () => void
  /** Called before navigating away from this screen. Should persist onboarding_completed=true. */
  onComplete?: () => Promise<void>
}

const FIXTURE: ProfileData = {
  name: '川添 良太',
  farmName: '宮田養蜂場',
  location: '静岡県磐田市宮田',
  colonyCount: 3,
}

const LONG_FIXTURE: ProfileData = {
  name: '山田 太郎 テスト長い名前 テスト長い名前 テスト',
  farmName: '静岡県西部養蜂組合第一支部宮田養蜂場分場',
  location: '静岡県浜松市浜名区引佐町奥山特別地域長い住所テスト',
  colonyCount: 20,
}

function buildData(vs: OnboardingStep3ViewState): ProfileData | null {
  if (vs === 'loading') return null
  if (vs === 'offline-no-cache') return null
  if (vs === 'no-apiary') return { name: '川添 良太', farmName: '', location: '', colonyCount: 0 }
  if (vs === 'no-colony') return { name: '川添 良太', farmName: '宮田養蜂場', location: '静岡県磐田市宮田', colonyCount: 0 }
  if (vs === 'long-content') return LONG_FIXTURE
  // error: no data initially — shown only after retry
  if (vs === 'error') return null
  return FIXTURE
}

/* 蜂アイコン (SVG インライン) */
function BeeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      {/* 胴体 */}
      <ellipse cx="9" cy="9.5" rx="3.5" ry="4.5" stroke="currentColor" strokeWidth="1.4" />
      {/* 縞 */}
      <line x1="5.5" y1="8.5" x2="12.5" y2="8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="5.5" y1="10.5" x2="12.5" y2="10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      {/* 翅 */}
      <ellipse cx="6.5" cy="6" rx="2.2" ry="1.3" stroke="currentColor" strokeWidth="1.2" transform="rotate(-20 6.5 6)" />
      <ellipse cx="11.5" cy="6" rx="2.2" ry="1.3" stroke="currentColor" strokeWidth="1.2" transform="rotate(20 11.5 6)" />
      {/* 触角 */}
      <path d="M7.5 5 C7 3.5 6 3 5.5 2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M10.5 5 C11 3.5 12 3 12.5 2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

export function OnboardingStep3Screen({
  viewState = 'normal',
  onBack,
  onStartInspection,
  onDashboard,
  onAddApiary,
  onAddColony,
  onComplete,
}: Props) {
  const [isNavigating, setIsNavigating] = useState(false)
  const [retried, setRetried] = useState(false)
  const [completeError, setCompleteError] = useState('')

  const isLoading    = viewState === 'loading'
  const isOffline    = viewState === 'offline-cached' || viewState === 'offline-no-cache'
  const hasNoCache   = viewState === 'offline-no-cache'
  const isErrorState = viewState === 'error'

  // After retry, show fixture data to simulate successful reload
  const data: ProfileData | null = (isErrorState && retried) ? FIXTURE : buildData(viewState)

  const hasApiary = data ? data.farmName !== '' : false
  const hasColony = data ? data.colonyCount > 0 : false

  // Primary button disabled: loading, no-cache offline, error without confirmed data, or navigating
  const primaryDisabled = isLoading || hasNoCache || (isErrorState && !retried) || isNavigating

  let primaryLabel = '最初の内検を始める'
  if (data !== null && !hasApiary) primaryLabel = '養蜂場を追加する'
  else if (data !== null && !hasColony) primaryLabel = '蜂群を追加する'

  async function handlePrimary() {
    if (primaryDisabled) return
    setIsNavigating(true)
    setCompleteError('')
    try {
      if (onComplete) await onComplete()
    } catch {
      setCompleteError('完了処理に失敗しました。もう一度お試しください。')
      setIsNavigating(false)
      return
    }
    if (!hasApiary) { onAddApiary(); return }
    if (!hasColony) { onAddColony(); return }
    onStartInspection()
  }

  async function handleDashboard() {
    if (isNavigating) return
    setIsNavigating(true)
    setCompleteError('')
    try {
      if (onComplete) await onComplete()
    } catch {
      setCompleteError('完了処理に失敗しました。もう一度お試しください。')
      setIsNavigating(false)
      return
    }
    onDashboard()
  }

  function handleRetry() {
    setRetried(true)
  }

  // Show card: has data, or error after retry
  const showCard     = data !== null
  const showNoData   = !isLoading && data === null  // no-cache or error-not-retried

  return (
    <div className={styles.screen}>
      {/* ── ヘッダー ── */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="戻る">
          <ChevronLeft size={24} aria-hidden />
        </button>
        <span className={styles.stepLabel}>3 / 3</span>
        {/* スキップなし */}
        <span className={styles.headerSpacer} aria-hidden />
      </header>

      {/* ── 進行インジケーター（3/3完了） ── */}
      <div className={styles.progress} aria-hidden>
        <div className={`${styles.progressBar} ${styles.progressBarActive}`} />
        <div className={`${styles.progressBar} ${styles.progressBarActive}`} />
        <div className={`${styles.progressBar} ${styles.progressBarActive}`} />
      </div>

      {/* ── オフラインバナー ── */}
      {isOffline && (
        <div className={styles.offlineBanner} role="alert">
          <WifiOff size={16} aria-hidden />
          <span>
            オフラインです。
            {hasNoCache ? '登録情報を取得できません。' : 'キャッシュされた情報を表示しています。'}
          </span>
        </div>
      )}

      {/* ── エラーバナー（未リトライ時のみ） ── */}
      {isErrorState && !retried && (
        <div className={styles.errorBanner} role="alert">
          <AlertTriangle size={16} aria-hidden />
          <span>情報の読み込みに失敗しました。</span>
          <button className={styles.retryBtn} onClick={handleRetry}>再読み込み</button>
        </div>
      )}
      {/* ── 完了処理エラー ── */}
      {completeError && (
        <div className={styles.errorBanner} role="alert" data-testid="onboarding-complete-error">
          <AlertTriangle size={16} aria-hidden />
          <span>{completeError}</span>
        </div>
      )}

      {/* ── スクロール可能本文 ── */}
      <div className={styles.body}>

        {/* 完了表示 */}
        <div className={styles.completeSection}>
          <div className={styles.checkCircle} aria-hidden>
            <Check size={32} strokeWidth={3} className={styles.checkIcon} />
          </div>
          <h1 className={styles.heading}>準備ができました</h1>
          <p className={styles.subheading}>HoneyOSのご利用準備が完了しました。</p>
        </div>

        {/* ── 登録内容カード ── */}
        {isLoading ? (
          /* スケルトン4行 */
          <div className={styles.card} aria-busy="true" aria-label="登録内容を読み込み中">
            <div className={styles.skeletonRow}>
              <div className={styles.skeletonIcon} />
              <div className={styles.skeletonLine} style={{ width: '55%' }} />
            </div>
            <div className={styles.divider} />
            <div className={styles.skeletonRow}>
              <div className={styles.skeletonIcon} />
              <div className={styles.skeletonLine} style={{ width: '65%' }} />
            </div>
            <div className={styles.divider} />
            <div className={styles.skeletonRow}>
              <div className={styles.skeletonIcon} />
              <div className={styles.skeletonLine} style={{ width: '75%' }} />
            </div>
            <div className={styles.divider} />
            <div className={styles.skeletonRow}>
              <div className={styles.skeletonIcon} />
              <div className={styles.skeletonLine} style={{ width: '35%' }} />
            </div>
          </div>
        ) : showNoData ? (
          /* データなし（オフライン無キャッシュ or エラー未リトライ） */
          <div className={styles.card}>
            <p className={styles.noDataMsg}>登録情報を取得できませんでした。</p>
          </div>
        ) : showCard ? (
          /* 4行カード */
          <div className={styles.card}>
            <div className={styles.cardRow}>
              <span className={styles.cardIconWrap}><User size={18} aria-hidden /></span>
              <span className={styles.cardValue}>{data!.name}</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.cardRow}>
              <span className={styles.cardIconWrap}><Layers size={18} aria-hidden /></span>
              <span className={styles.cardValue}>{data!.farmName || '未設定'}</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.cardRow}>
              <span className={styles.cardIconWrap}><MapPin size={18} aria-hidden /></span>
              <span className={styles.cardValue}>{data!.location || '未設定'}</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.cardRow}>
              <span className={styles.cardIconWrap}><BeeIcon /></span>
              <span className={styles.cardValue}>{data!.colonyCount} 群</span>
            </div>
          </div>
        ) : null}

        {/* ── はじめにやってみましょう ── */}
        <div className={styles.stepsSection}>
          <h2 className={styles.stepsHeading}>はじめにやってみましょう</h2>
          <ol className={styles.stepList} aria-label="はじめてのステップ">
            <li className={styles.stepItem}>
              <div className={styles.stepLeft}>
                <div className={styles.stepBadge}>1</div>
                <div className={styles.stepLine} aria-hidden />
              </div>
              <div className={styles.stepContent}>
                <p className={styles.stepTitle}>蜂群を選ぶ</p>
                <p className={styles.stepDesc}>管理する蜂群を選択します。</p>
              </div>
            </li>
            <li className={styles.stepItem}>
              <div className={styles.stepLeft}>
                <div className={styles.stepBadge}>2</div>
                <div className={styles.stepLine} aria-hidden />
              </div>
              <div className={styles.stepContent}>
                <p className={styles.stepTitle}>枠の状態を記録</p>
                <p className={styles.stepDesc}>写真やメモで内検の内容を記録します。</p>
              </div>
            </li>
            <li className={styles.stepItem}>
              <div className={styles.stepLeft}>
                <div className={styles.stepBadge}>3</div>
              </div>
              <div className={styles.stepContent}>
                <p className={styles.stepTitle}>変化を確認</p>
                <p className={styles.stepDesc}>記録やセンサーデータから蜂群の状態を見てみましょう。</p>
              </div>
            </li>
          </ol>
        </div>

        {/* ── 下部操作 ── */}
        <div className={styles.footer}>
          <button
            className={styles.primaryBtn}
            onClick={handlePrimary}
            disabled={primaryDisabled}
          >
            {primaryLabel}
          </button>
          <button
            className={styles.secondaryBtn}
            onClick={handleDashboard}
            disabled={isNavigating}
          >
            ダッシュボードを見る
          </button>
          <p className={styles.footerNote}>内検データはあとから編集できます。</p>
        </div>
      </div>
    </div>
  )
}
