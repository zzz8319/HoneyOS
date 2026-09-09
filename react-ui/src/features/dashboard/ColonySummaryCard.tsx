import type { ColonySummary, ColonySummaryItem } from './mockData'
import styles from './ColonySummaryCard.module.css'

const WARN_LINE = 60
const Y_LABELS  = [100, 60, 0]

// カタログに合わせた縦棒グラフ（CSS ベース）
function BarChart({ colonies }: { colonies: ColonySummaryItem[] }) {
  return (
    <div className={styles.chartWrap} role="img" aria-label="蜂群スコア棒グラフ">
      {/* Y軸 */}
      <div className={styles.yAxis} aria-hidden>
        {Y_LABELS.map(v => (
          <span
            key={v}
            className={styles.yLabel}
            style={{ bottom: `${v}%` }}
          >
            {v}
          </span>
        ))}
      </div>

      {/* プロットエリア */}
      <div className={styles.plotArea}>
        {/* 注意ライン（赤破線） */}
        <div
          className={styles.warnDash}
          style={{ bottom: `${WARN_LINE}%` }}
          aria-label={`注意ライン ${WARN_LINE}`}
        />

        {/* 棒グループ */}
        {colonies.map(c => {
          const barCls =
            c.status === 'good'   ? styles.barGood
            : c.status === 'warn' ? styles.barWarn
            : styles.barDanger
          const deltaUp = c.delta >= 0
          return (
            <div
              key={c.id}
              className={styles.barGroup}
              aria-label={`${c.name} スコア${c.score} 前回比${deltaUp ? '+' : ''}${c.delta}`}
            >
              {/* スコア値（バー上部） */}
              <span className={styles.scoreLabel}>{c.score}</span>
              {/* バー本体 */}
              <div
                className={`${styles.bar} ${barCls}`}
                style={{ height: `${c.score}%` }}
              />
              {/* X軸ラベル: 群名 */}
              <span className={styles.xName}>{c.name}</span>
              {/* 前回比 */}
              <span className={deltaUp ? styles.deltaUp : styles.deltaDown}>
                {deltaUp ? '↑' : '↓'}{Math.abs(c.delta)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface ColonySummaryCardProps {
  data: ColonySummary
  onMethodClick?: () => void
}

export function ColonySummaryCard({ data, onMethodClick }: ColonySummaryCardProps) {
  const { average, good, warn, danger, colonies } = data
  return (
    <div className={styles.card}>
      {/* ヘッダー */}
      <div className={styles.header}>
        <span className={styles.title}>蜂群の強さ</span>
        <span className={styles.beta}>簡易指標 β</span>
        <button className={styles.methodLink} onClick={onMethodClick} tabIndex={0}>
          算出方法 ›
        </button>
      </div>

      {/* 平均スコア + 集計 */}
      <div className={styles.summaryRow}>
        <div className={styles.avgBlock}>
          <span className={styles.avgLabel}>平均</span>
          <span className={styles.avgVal}>{average}</span>
        </div>
        <div className={styles.countRow}>
          <span className={styles.countItem}>
            <span className={styles.dot} data-s="good" aria-hidden />
            良好 {good}
          </span>
          <span className={styles.countItem}>
            <span className={styles.dot} data-s="warn" aria-hidden />
            注意 {warn}
          </span>
          <span className={styles.countItem}>
            <span className={styles.dot} data-s="danger" aria-hidden />
            危険 {danger}
          </span>
        </div>
      </div>

      <BarChart colonies={colonies} />

      <p className={styles.note}>
        注意ライン {WARN_LINE}（破線）／ スコアは合成指標・β版
      </p>
    </div>
  )
}
