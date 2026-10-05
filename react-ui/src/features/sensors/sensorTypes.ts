// SCR-017 センサー詳細 — 型定義
// 実データは将来 window.HoneyDB 経由で取得する

export type SensorKind =
  | 'temperature'
  | 'humidity'
  | 'weight'
  | 'sound'
  | 'vibration'

export type SensorStatus =
  | 'normal'
  | 'warning'
  | 'critical'
  | 'offline'
  | 'uninstalled'
  | 'unknown'

export interface SensorHistoryPoint {
  measuredAt: string
  value: number
}

export interface SensorMetric {
  id: string
  colonyId: string
  kind: SensorKind
  label: string
  value: number | null
  unit: string
  previousDelta: number | null
  status: SensorStatus
  statusLabel?: string
  measuredAt: string | null
  history: SensorHistoryPoint[]
}

export interface SensorDetailColony {
  id: string
  name: string
  apiaryName: string
}

export type SensorDetailViewState =
  | 'normal'
  | 'high-temperature'
  | 'all-normal'
  | 'filter-open'
  | 'refreshing'
  | 'loading'
  | 'error'
  | 'partial-error'
  | 'offline-cached'
  | 'offline-no-cache'
  | 'stale-data'
  | 'long-content'

export interface SensorNavigateToGraphPayload {
  colonyId: string
  kind: SensorKind
  unit: string
  returnTo: string
}
