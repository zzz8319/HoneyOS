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

      {/* ── スクロール領域 ── */}
      <div className={styles.body}>
        {/* 見出し・説明 */}
        <h1 className={styles.heading}>養蜂管理を、ひとつに</h1>
        <p className={styles.subheading}>記録・分析・予定管理で、養蜂をもっとシンプルに。</p>

        {/* 機能イラスト */}
        <div className={styles.illustration} aria-hidden>
          {/* 背景アクセント楕円 */}
          <div className={styles.bgEllipse1} />
          <div className={styles.bgEllipse2} />
          <div className={styles.bgCircle} />

          {/* 左上バッジ：内検記録 */}
          <div className={`${styles.badge} ${styles.badgeTopLeft}`}>
            <div className={`${styles.badgeIcon} ${styles.badgeIconAmber}`}>
              <ClipboardList size={14} strokeWidth={2} />
            </div>
            <span className={styles.badgeLabel}>内検記録</span>
          </div>

          {/* 右上バッジ：センサーデータ */}
          <div className={`${styles.badge} ${styles.badgeTopRight}`}>
            <div className={`${styles.badgeIcon} ${styles.badgeIconBlue}`}>
              <BarChart2 size={14} strokeWidth={2} />
            </div>
            <span className={styles.badgeLabel}>センサーデータ</span>
          </div>

          {/* 中央スマートフォンカード */}
          <div className={styles.phoneCard}>
            <div className={styles.phoneCam} />
            <div className={styles.phoneScreen}>
              <div className={styles.phoneRow}>
                <div className={styles.phoneBar} style={{ width: '60%' }} />
                <div className={styles.phoneBar} style={{ width: '40%', background: 'var(--color-primary-soft)' }} />
              </div>
              <div className={styles.phoneChartArea}>
                {[40, 65, 50, 75, 55, 80, 60].map((h, i) => (
                  <div key={i} className={styles.phoneChartBar} style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className={styles.phoneRow} style={{ marginTop: 6 }}>
                <div className={styles.phoneBar} style={{ width: '80%' }} />
              </div>
            </div>
          </div>

          {/* 下中央バッジ：作業・予定 */}
          <div className={`${styles.badge} ${styles.badgeBottom}`}>
            <div className={`${styles.badgeIcon} ${styles.badgeIconGreen}`}>
              <CalendarDays size={14} strokeWidth={2} />
            </div>
            <span className={styles.badgeLabel}>作業・予定</span>
          </div>
        </div>

        {/* 機能リスト */}
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
      </div>

      {/* ── 下部操作 ── */}
      <footer className={styles.footer}>
        <button className={styles.nextBtn} onClick={onNext}>次へ</button>
        <div className={styles.dots} aria-hidden>
          <span className={`${styles.dot} ${styles.dotActive}`} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
      </footer>
    </div>
  )
}
