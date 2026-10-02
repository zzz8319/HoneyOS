import { ChevronRight } from 'lucide-react'
import type { SensorMetric, SensorNavigateToGraphPayload } from './sensorTypes'
import { SensorSparkline } from './SensorSparkline'
import styles from './SensorMetricCard.module.css'

interface Props {
  metric: SensorMetric
  onNavigateToGraph?: (payload: SensorNavigateToGraphPayload) => void
  returnTo?: string
}

function getSparklineColors(metric: SensorMetric): { color: string; bg: string } {
  if (metric.status === 'critical') return { color: '#DC2626', bg: '#FEE2E2' }
  if (metric.status === 'warning')  return { color: '#DC2626', bg: '#FEE2E2' }
  if (metric.kind === 'sound')      return { color: '#525E6A', bg: '#F1F3F5' }
  return { color: '#16A34A', bg: '#DCFCE7' }
}

function getDeltaClass(metric: SensorMetric): string {
  if (metric.kind === 'weight') return styles.deltaPositive
  if (metric.status === 'warning' || metric.status === 'critical') return styles.deltaNegative
  return styles.deltaNeutral
}

function StatusBadge({ status, label }: { status: SensorMetric['status']; label?: string }) {
  if (!label) return null
  const cls =
    status === 'critical' ? styles.badgeCritical :
    status === 'warning'  ? styles.badgeWarning :
    status === 'normal'   ? styles.badgeNormal :
    styles.badgeNeutral
  return <span className={`${styles.badge} ${cls}`}>{label}</span>
}

export function SensorMetricCard({ metric, onNavigateToGraph, returnTo = 'sensor-detail' }: Props) {
  const { color, bg } = getSparklineColors(metric)

  if (metric.status === 'uninstalled') {
    return (
      <div className={`${styles.card} ${styles.cardUninstalled}`} aria-label={`${metric.label}：センサー未設置`}>
        <span className={`${styles.iconWrap} ${styles.iconNeutral}`} aria-hidden>
          <VibrationIcon />
        </span>
        <span className={styles.body}>
          <span className={styles.kindLabel}>{metric.label}</span>
          <span className={styles.uninstalledText}>センサー未設置</span>
        </span>
        <button
          className={styles.setupBtn}
          aria-label="振動センサーの設置方法を見る"
          data-action="show-setup"
        >
          設置方法 <ChevronRight size={14} aria-hidden />
        </button>
      </div>
    )
  }

  if (metric.status === 'offline' && metric.value === null) {
    return (
      <div className={`${styles.card} ${styles.cardError}`} aria-label={`${metric.label}：取得失敗`}>
        <span className={`${styles.iconWrap} ${styles.iconNeutral}`} aria-hidden>
          <SensorKindIcon kind={metric.kind} />
        </span>
        <span className={styles.body}>
          <span className={styles.kindLabel}>{metric.label}</span>
          <span className={styles.errorText}>データを取得できませんでした</span>
        </span>
        <button
          className={styles.retryBtn}
          aria-label={`${metric.label}を再取得`}
          data-action="retry-metric"
          data-kind={metric.kind}
        >
          再取得
        </button>
      </div>
    )
  }

  const deltaSign = metric.previousDelta === null ? '' :
    metric.previousDelta > 0 ? '↑ +' :
    metric.previousDelta < 0 ? '↓ ' : '± '

  const sparkLabel =
    metric.kind === 'temperature' ? `温度の推移。最新値 ${metric.value}℃` :
    metric.kind === 'humidity'    ? `湿度の推移。最新値 ${metric.value}%` :
    metric.kind === 'weight'      ? `重量の推移。最新値 ${metric.value}kg` :
    metric.kind === 'sound'       ? `音響レベルの推移。最新値 ${metric.value}dB` :
    `${metric.label}の推移`

  function handleClick() {
    if (!onNavigateToGraph) return
    onNavigateToGraph({
      colonyId: metric.colonyId,
      kind: metric.kind,
      unit: metric.unit,
      returnTo,
    })
  }

  return (
    <button
      className={`${styles.card} ${metric.status === 'warning' || metric.status === 'critical' ? styles.cardWarning : ''}`}
      onClick={handleClick}
      aria-label={`${metric.label} ${metric.value}${metric.unit}${metric.statusLabel ? '・' + metric.statusLabel : ''}。グラフを見る`}
    >
      <span className={`${styles.iconWrap} ${getIconColorClass(metric)}`} aria-hidden>
        <SensorKindIcon kind={metric.kind} />
      </span>
      <span className={styles.body}>
        <span className={styles.kindLabel}>{metric.label}</span>
        <span className={styles.valueRow}>
          <span className={styles.value}>{metric.value}</span>
          <span className={styles.unit}>{metric.unit}</span>
          {metric.previousDelta !== null && (
            <span className={getDeltaClass(metric)}>
              {deltaSign}{metric.kind === 'temperature' || metric.kind === 'weight' || metric.kind === 'humidity'
                ? Math.abs(metric.previousDelta).toFixed(1)
                : Math.abs(metric.previousDelta)}
              {metric.unit}
            </span>
          )}
        </span>
        {metric.statusLabel && (
          <StatusBadge status={metric.status} label={metric.statusLabel} />
        )}
      </span>
      <span className={styles.sparklineWrap}>
        <SensorSparkline
          data={metric.history}
          color={color}
          bgColor={bg}
          ariaLabel={sparkLabel}
        />
      </span>
      <span className={styles.chevron} aria-hidden>
        <ChevronRight size={16} />
      </span>
    </button>
  )
}

function getIconColorClass(metric: SensorMetric): string {
  if (metric.kind === 'temperature') return styles.iconRed
  if (metric.kind === 'humidity')    return styles.iconBlue
  if (metric.kind === 'weight')      return styles.iconGreen
  if (metric.kind === 'sound')       return styles.iconGray
  return styles.iconNeutral
}

function SensorKindIcon({ kind }: { kind: SensorMetric['kind'] }) {
  switch (kind) {
    case 'temperature': return <ThermometerIcon />
    case 'humidity':    return <DropletIcon />
    case 'weight':      return <ScaleIcon />
    case 'sound':       return <SoundIcon />
    case 'vibration':   return <VibrationIcon />
  }
}

function ThermometerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
    </svg>
  )
}

function DropletIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
    </svg>
  )
}

function ScaleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/>
      <path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/>
      <path d="M7 21h10"/>
      <path d="M12 3v18"/>
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
    </svg>
  )
}

function SoundIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    </svg>
  )
}

function VibrationIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 13a2 2 0 0 0 2-2V7a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0V4a2 2 0 0 1 4 0v13a2 2 0 0 0 2 2"/>
    </svg>
  )
}
