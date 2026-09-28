import { ChevronLeft, ClipboardList, BarChart2, CalendarDays } from 'lucide-react'
import type { OnboardingStep1ViewState } from './types'
import styles from './OnboardingStep1Screen.module.css'

interface Props {
  viewState?: OnboardingStep1ViewState
  onBack: () => void
  onNext: () => void
  onSkip: () => void
}

export function OnboardingStep1Screen({ onBack, onNext, onSkip }: Props) {
  return (
    <div className={styles.screen}>
      {/* ── ヘッダー ── */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="戻る">
          <ChevronLeft size={24} aria-hidden />
        </button>
        <span className={styles.stepLabel}>1 / 3</span>
        <button className={styles.skipBtn} onClick={onSkip}>スキップ</button>
      </header>

      {/* ── 進行インジケーター ── */}
      <div className={styles.progress} aria-hidden>
        <div className={`${styles.progressBar} ${styles.progressBarActive}`} />
        <div className={styles.progressBar} />
        <div className={styles.progressBar} />
      </div>

      {/* ── メインコンテンツ ── */}
      <div className={styles.body}>
        {/* 見出し・説明 */}
        <h1 className={styles.heading}>養蜂管理を、ひとつに</h1>
        <p className={styles.subheading}>記録・分析・予定管理で、養蜂をもっとシンプルに。</p>

        {/* ── 機能イラスト ── */}
        <div className={styles.illustration} aria-hidden>
          {/* 背景アクセント円 */}
          <div className={styles.bgBlob1} />
          <div className={styles.bgBlob2} />
          <div className={styles.bgBlob3} />

          {/* 左上カード：内検記録 */}
          <div className={`${styles.floatCard} ${styles.floatCardTL}`}>
            <div className={`${styles.floatCardIcon} ${styles.floatCardIconAmber}`}>
              <ClipboardList size={16} strokeWidth={2} />
            </div>
            <span className={styles.floatCardLabel}>内検記録</span>
          </div>

          {/* 右上カード：センサーデータ */}
          <div className={`${styles.floatCard} ${styles.floatCardTR}`}>
            <div className={`${styles.floatCardIcon} ${styles.floatCardIconBlue}`}>
              <BarChart2 size={16} strokeWidth={2} />
            </div>
            <span className={styles.floatCardLabel}>センサー<br />データ</span>
          </div>

          {/* 中央スマートフォン */}
          <div className={styles.phone}>
            {/* ノッチ */}
            <div className={styles.phoneNotch} />
            {/* 画面内UI */}
            <div className={styles.phoneInner}>
              {/* ヘッダーバー */}
              <div className={styles.phoneHeader}>
                <div className={styles.phoneHeaderDot} />
                <div className={styles.phoneHeaderBar} />
              </div>
              {/* アンバーのミニボタン */}
              <div className={styles.phoneActionRow}>
                <div className={styles.phoneActionBtn} />
                <div className={styles.phoneActionBtnGhost} />
              </div>
              {/* カードリスト */}
              <div className={styles.phoneCardRow}>
                <div className={styles.phoneMiniCard} />
                <div className={styles.phoneMiniCard} />
              </div>
              {/* グラフエリア */}
              <div className={styles.phoneChart}>
                {[45, 70, 52, 80, 58, 75, 62].map((h, i) => (
                  <div key={i} className={styles.phoneChartCol} style={{ height: `${h}%` }} />
                ))}
              </div>
              {/* フッター行 */}
              <div className={styles.phoneFooterRow}>
                <div className={styles.phoneFooterBar} style={{ width: '70%' }} />
                <div className={styles.phoneFooterBar} style={{ width: '40%' }} />
              </div>
            </div>
          </div>

          {/* 下中央カード：作業・予定 */}
          <div className={`${styles.floatCard} ${styles.floatCardBC}`}>
            <div className={`${styles.floatCardIcon} ${styles.floatCardIconGreen}`}>
              <CalendarDays size={16} strokeWidth={2} />
            </div>
            <span className={styles.floatCardLabel}>作業・予定</span>
          </div>
        </div>

        {/* ── 機能リスト ── */}
        <ul className={styles.featureList}>
          <li className={styles.featureItem}>
            <div className={`${styles.featureIconWrap} ${styles.featureIconAmber}`}>
              <ClipboardList size={20} strokeWidth={2} aria-hidden />
            </div>
            <div className={styles.featureText}>
              <p className={styles.featureTitle}>内検をすばやく記録</p>
              <p className={styles.featureDesc}>写真やメモで、内検の内容を簡単に残せます。</p>
            </div>
          </li>
          <li className={styles.featureItem}>
            <div className={`${styles.featureIconWrap} ${styles.featureIconBlue}`}>
              <BarChart2 size={20} strokeWidth={2} aria-hidden />
            </div>
            <div className={styles.featureText}>
              <p className={styles.featureTitle}>蜂群の変化を見える化</p>
              <p className={styles.featureDesc}>センサーや記録から、蜂群の状態をグラフで確認できます。</p>
            </div>
          </li>
          <li className={styles.featureItem}>
            <div className={`${styles.featureIconWrap} ${styles.featureIconGreen}`}>
              <CalendarDays size={20} strokeWidth={2} aria-hidden />
            </div>
            <div className={styles.featureText}>
              <p className={styles.featureTitle}>作業と予定をまとめて管理</p>
              <p className={styles.featureDesc}>内検・給餌・治療などの予定を管理し、やるべき作業を見逃しません。</p>
            </div>
          </li>
        </ul>

        {/* ── 下部操作（フロー内配置） ── */}
        <div className={styles.footer}>
          <button className={styles.nextBtn} onClick={onNext}>次へ</button>
          <div className={styles.dots} aria-hidden>
            <span className={`${styles.dot} ${styles.dotActive}`} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </div>
        </div>
      </div>
    </div>
  )
}
