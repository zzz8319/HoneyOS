// SCR-018 センサーグラフ — 型定義

import type { SensorKind } from './sensorTypes'

export type SensorGraphKind = Exclude<SensorKind, 'vibration'>

export type PeriodMode = 'day' | 'week' | 'month' | 'custom'

export type SensorGraphViewState =
  | 'normal-day'
  | 'tooltip-active'
  | 'metric-selector-open'
  | 'week'
  | 'month'
  | 'custom-range'
  | 'loading'
  | 'empty'
  | 'partial-data'
  | 'error'
  | 'offline-cached'
  | 'offline-no-cache'

export interface SensorSeriesPoint {
  measuredAt: string
  value: number | null
  status?: 'normal' | 'warning' | 'critical' | 'missing'
}

export interface SensorEvent {
  id: string
  sensorKind: SensorGraphKind
  startedAt: string
  endedAt: string | null
  threshold?: number
  peakValue?: number
  message: string
}

export interface SensorThreshold {
  min?: number
  max?: number
}

export interface SensorGraphData {
  colonyId: string
  sensorKind: SensorGraphKind
  unit: string
  intervalMinutes: number
  threshold?: SensorThreshold
  current: SensorSeriesPoint[]
  comparison: SensorSeriesPoint[]
  events: SensorEvent[]
  fetchedAt: string
}

export interface SensorNavigateToGraphPayload {
  colonyId: string
  colonyName: string
  apiaryName: string
  kind: SensorGraphKind
  unit: string
  returnTo: string
}

export interface GraphColony {
  id: string
  name: string
  apiaryName: string
}
