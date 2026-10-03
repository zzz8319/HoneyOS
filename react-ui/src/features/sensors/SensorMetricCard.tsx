import { ChevronRight } from 'lucide-react'
import type { SensorMetric, SensorNavigateToGraphPayload } from './sensorTypes'
import { SensorSparkline } from './SensorSparkline'
import styles from './SensorMetricCard.module.css'

interface Props {
  metric: SensorMetric
  onNavigateToGraph?: (payload: SensorNavigateToGraphPayload) => void
  returnTo?: string
}

function getSparklineColor(metric: SensorMetric): { color: string; bg: string } {
  if (metric.status === 'critical') return { color: '#DC2626', bg: '#FEE2E2' }
  if (metric.status === 'warning')  return { color: '#DC2626', bg: '#FEE2E2' }
  if (metric.kind === 'sound')      return { color: '#525E6A', bg: '#F1F3F5' }
  if (metric.kind === 'temperature') return { color: '#16A34A', bg: '#DCFCE7' }
  if (metric.kind === 'humidity')    return { color: '#16A34A', bg: '#DCFCE7' }
  if (metric.kind === 'weight')      return { color: '#16A34A', bg: '#DCFCE7' }
  return { color: '#525E6A', bg: '#F1F3F5' }
}

function getDeltaColorClass(metric: SensorMetric): string {
  if (metric.previousDelta === null) return styles.deltaNeutral
  // 温度上昇は赤、温度下降は中性
  if (metric.kind === 'temperature') {
    if (metric.previousDelta > 0 && (metric.status === 'warning' || metric.status === 'critical'))
      return styles.deltaNegative
    return styles.deltaNeutral
  }
  // 重量増加は緑（採蜜増加）
  if (metric.kind === 'weight') {
    if (metric.previousDelta > 0) return styles.deltaPositive
    if (metric.previousDelta < 0) return styles.deltaNeutral
    return styles.deltaNeutral
  }
  // 湿度・音響は変化なし→中性、異常なら赤
  if (metric.status === 'warning' || metric.status === 'critical') return styles.deltaNegative
  if (metric.previousDelta === 0) return styles.deltaNeutral
  return styles.deltaNeutral
}

function getDeltaText(metric: SensorMetric): string | null {
  if (metric.previousDelta === null) return null
  const abs = (metric.kind === 'temperature' || metric.kind === 'weight' || metric.kind === 'humidity')
    ? Math.abs(metric.previousDelta).toFixed(1)
    : String(Math.abs(metric.previousDelta))
  const sign = metric.previousDelta > 0 ? '↑ +' : metric.previousDelta < 0 ? '↓ ' : '± '
  return `前回比 ${sign}${abs}${metric.unit}`
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
  const { color, bg } = getSparklineColor(metric)

  if (metric.status === 'uninstalled') {
    return (
      <div className={`${styles.card} ${styles.cardUninstalled}`} aria-label={`${metric.label}：センサー未設置`}>
        <span className={styles.iconWrap} aria-hidden>
          <SensorKindIcon kind={metric.kind} colorClass={styles.iconNeutral} size={36} />
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
        <span className={styles.iconWrap} aria-hidden>
          <SensorKindIcon kind={metric.kind} colorClass={styles.iconNeutral} size={36} />
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

  const deltaText = getDeltaText(metric)
  const deltaColorClass = getDeltaColorClass(metric)

  const sparkLabel =
    metric.kind === 'temperature' ? `温度の推移。最新値 ${metric.value}℃` :
    metric.kind === 'humidity'    ? `湿度の推移。最新値 ${metric.value}%` :
    metric.kind === 'weight'      ? `重量の推移。最新値 ${metric.value}kg` :
    metric.kind === 'sound'       ? `音響レベルの推移。最新値 ${metric.value}dB` :
    `${metric.label}の推移`

  const iconColorClass =
    metric.kind === 'temperature' && (metric.status === 'warning' || metric.status === 'critical')
      ? styles.iconRed :
    metric.kind === 'temperature' ? styles.iconOrange :
    metric.kind === 'humidity'    ? styles.iconBlue :
    metric.kind === 'weight'      ? styles.iconGray :
    metric.kind === 'sound'       ? styles.iconGray :
    styles.iconNeutral

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
      className={styles.card}
      onClick={handleClick}
      aria-label={`${metric.label} ${metric.value}${metric.unit}${metric.statusLabel ? '・' + metric.statusLabel : ''}。グラフを見る`}
    >
      {/* 左列：アイコン（背景なし） */}
      <span className={styles.iconWrap} aria-hidden>
        <SensorKindIcon kind={metric.kind} colorClass={iconColorClass} size={36} />
      </span>

      {/* 中央列：ラベル・数値・前回比 */}
      <span className={styles.body}>
        <span className={styles.kindLabel}>{metric.label}</span>
        <span className={styles.valueRow}>
          <span className={styles.value}>{metric.value}</span>
          <span className={styles.unit}>{metric.unit}</span>
        </span>
        {deltaText && (
          <span className={`${styles.delta} ${deltaColorClass}`}>{deltaText}</span>
        )}
      </span>

      {/* 右列：バッジ + スパークライン */}
      <span className={styles.rightCol}>
        {metric.statusLabel && (
          <StatusBadge status={metric.status} label={metric.statusLabel} />
        )}
        <SensorSparkline
          data={metric.history}
          color={color}
          bgColor={bg}
          ariaLabel={sparkLabel}
          width={120}
          height={40}
        />
      </span>

      {/* 右端：シェブロン */}
      <span className={styles.chevron} aria-hidden>
        <ChevronRight size={16} />
      </span>
    </button>
  )
}

interface IconProps {
  kind: SensorMetric['kind']
  colorClass: string
  size: number
}

function SensorKindIcon({ kind, colorClass, size }: IconProps) {
  switch (kind) {
    case 'temperature': return <ThermometerIcon size={size} className={colorClass} />
    case 'humidity':    return <DropletIcon size={size} className={colorClass} />
    case 'weight':      return <ScaleIcon size={size} className={colorClass} />
    case 'sound':       return <SoundIcon size={size} className={colorClass} />
    case 'vibration':   return <VibrationIcon size={size} className={colorClass} />
  }
}

function ThermometerIcon({ size, className }: { size: number; className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
    </svg>
  )
}

function DropletIcon({ size, className }: { size: number; className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
    </svg>
  )
}

function ScaleIcon({ size, className }: { size: number; className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/>
      <path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/>
      <path d="M7 21h10"/>
      <path d="M12 3v18"/>
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
    </svg>
  )
}

function SoundIcon({ size, className }: { size: number; className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    </svg>
  )
}

function VibrationIcon({ size, className }: { size: number; className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M2 13a2 2 0 0 0 2-2V7a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0V4a2 2 0 0 1 4 0v13a2 2 0 0 0 2 2"/>
    </svg>
  )
}
