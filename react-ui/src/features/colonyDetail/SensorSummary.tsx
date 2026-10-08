import { Thermometer, Droplets, Scale } from 'lucide-react'
import type { SensorData } from './mockData'
import styles from './SensorSummary.module.css'

interface Props {
  sensor: SensorData
  onDetailClick?: () => void
}

interface KpiProps {
  icon: React.ReactNode
  label: string
  value: string | null
  delta: number | null
  unit: string
}

function Kpi({ icon, label, value, delta, unit }: KpiProps) {
  const isUp = (delta ?? 0) >= 0
  return (
    <div className={styles.kpi}>
      <span className={styles.kpiIcon}>{icon}</span>
      <span className={styles.kpiLabel}>{label}</span>
      <span className={styles.kpiValue}>
        {value != null
          ? <>{value}<span className={styles.kpiUnit}>{unit}</span></>
          : '—'}
      </span>
      {delta != null && (
        <span className={isUp ? styles.deltaUp : styles.deltaDown}>
          {isUp ? '↑' : '↓'} {isUp ? '+' : ''}{delta}
        </span>
      )}
    </div>
  )
}

export function SensorSummary({ sensor, onDetailClick }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>センサー情報</h2>
          {sensor.fetchedAt
            ? <span className={styles.timestamp}>{sensor.fetchedAt} 時点</span>
            : <span className={styles.timestamp}>取得なし</span>}
        </div>
        <button className={styles.detailLink} onClick={onDetailClick} aria-label="センサー詳細を見る">
          詳細を見る ›
        </button>
      </div>
      <div className={styles.kpiRow}>
        <Kpi
          icon={<Thermometer size={16} />}
          label="温度"
          value={sensor.temperature != null ? sensor.temperature.toFixed(1) : null}
          delta={sensor.temperatureDelta}
          unit="℃"
        />
        <div className={styles.divider} />
        <Kpi
          icon={<Droplets size={16} />}
          label="湿度"
          value={sensor.humidity != null ? String(sensor.humidity) : null}
          delta={sensor.humidityDelta}
          unit="%"
        />
        <div className={styles.divider} />
        <Kpi
          icon={<Scale size={16} />}
          label="重量"
          value={sensor.weight != null ? sensor.weight.toFixed(1) : null}
          delta={sensor.weightDelta}
          unit="kg"
        />
      </div>
    </div>
  )
}
