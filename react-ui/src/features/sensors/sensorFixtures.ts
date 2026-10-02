// SCR-017 センサー詳細 — テスト用フィクスチャ
// 実データは window.HoneyDB 経由で取得する

import type { SensorMetric, SensorDetailColony } from './sensorTypes'

export const COLONY_A03: SensorDetailColony = {
  id: 'a3',
  name: 'A-03',
  apiaryName: '宮田養蜂場',
}

export const COLONY_LONG: SensorDetailColony = {
  id: 'b99',
  name: 'B-99・奥山第三区画養蜂群北側',
  apiaryName: '奥山養蜂場・新拡張エリア第二農場',
}

// 通常状態の温度履歴（上昇傾向）
const TEMP_HISTORY_HIGH = [32.1, 33.4, 33.8, 34.2, 34.9, 35.2, 35.5, 35.8].map((v, i) => ({
  measuredAt: `2024-07-01T${String(i + 2).padStart(2, '0')}:00:00`,
  value: v,
}))
// 通常温度履歴
const TEMP_HISTORY_NORMAL = [33.0, 33.2, 33.4, 33.1, 33.3, 33.2, 33.4, 33.2].map((v, i) => ({
  measuredAt: `2024-07-01T${String(i + 2).padStart(2, '0')}:00:00`,
  value: v,
}))
const HUMIDITY_HISTORY = [72, 71, 70, 69, 69, 68, 68, 68].map((v, i) => ({
  measuredAt: `2024-07-01T${String(i + 2).padStart(2, '0')}:00:00`,
  value: v,
}))
const WEIGHT_HISTORY = [41.0, 41.2, 41.5, 41.8, 42.0, 42.2, 42.4, 42.6].map((v, i) => ({
  measuredAt: `2024-07-01T${String(i + 2).padStart(2, '0')}:00:00`,
  value: v,
}))
const SOUND_HISTORY = [44, 45, 46, 46, 47, 46, 46, 46].map((v, i) => ({
  measuredAt: `2024-07-01T${String(i + 2).padStart(2, '0')}:00:00`,
  value: v,
}))

export const NORMAL_METRICS: SensorMetric[] = [
  {
    id: 's1', colonyId: 'a3', kind: 'temperature',
    label: '温度', value: 35.8, unit: '℃', previousDelta: 1.2,
    status: 'warning', statusLabel: '高め',
    measuredAt: '2024-07-01T09:40:00', history: TEMP_HISTORY_HIGH,
  },
  {
    id: 's2', colonyId: 'a3', kind: 'humidity',
    label: '湿度', value: 68, unit: '%', previousDelta: -4,
    status: 'normal', statusLabel: '適正',
    measuredAt: '2024-07-01T09:40:00', history: HUMIDITY_HISTORY,
  },
  {
    id: 's3', colonyId: 'a3', kind: 'weight',
    label: '重量', value: 42.6, unit: 'kg', previousDelta: 0.8,
    status: 'normal', statusLabel: undefined,
    measuredAt: '2024-07-01T09:40:00', history: WEIGHT_HISTORY,
  },
  {
    id: 's4', colonyId: 'a3', kind: 'sound',
    label: '音響', value: 46, unit: 'dB', previousDelta: 0,
    status: 'normal', statusLabel: '通常',
    measuredAt: '2024-07-01T09:40:00', history: SOUND_HISTORY,
  },
  {
    id: 's5', colonyId: 'a3', kind: 'vibration',
    label: '振動', value: null, unit: '', previousDelta: null,
    status: 'uninstalled', statusLabel: 'センサー未設置',
    measuredAt: null, history: [],
  },
]

export const ALL_NORMAL_METRICS: SensorMetric[] = NORMAL_METRICS.map(m =>
  m.kind === 'temperature'
    ? { ...m, value: 33.2, previousDelta: 0.1, status: 'normal', statusLabel: '適正', history: TEMP_HISTORY_NORMAL }
    : m
)

export const HIGH_TEMP_METRICS: SensorMetric[] = NORMAL_METRICS.map(m =>
  m.kind === 'temperature'
    ? { ...m, value: 38.5, previousDelta: 2.7, status: 'critical', statusLabel: '要注意' }
    : { ...m, status: 'normal' }
)

export const LONG_CONTENT_METRICS: SensorMetric[] = NORMAL_METRICS.map(m => ({
  ...m,
  colonyId: 'b99',
  statusLabel: m.status === 'warning' ? '通常範囲を超過しています' :
               m.status === 'uninstalled' ? 'センサーが未設置の状態です' : m.statusLabel,
  value: m.kind === 'weight' ? 142.6 : m.kind === 'sound' ? 9846 : m.value,
  unit: m.kind === 'weight' ? 'kg' : m.unit,
}))

export const PARTIAL_ERROR_METRICS: SensorMetric[] = NORMAL_METRICS.map((m, i) =>
  i === 2 ? { ...m, value: null, status: 'offline', statusLabel: '取得失敗' } : m
)

export const STALE_METRICS: SensorMetric[] = NORMAL_METRICS.map(m => ({
  ...m, measuredAt: '2024-06-29T08:15:00',
}))
