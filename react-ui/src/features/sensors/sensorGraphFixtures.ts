// SCR-018 センサーグラフ — テスト用フィクスチャ

import type { SensorGraphData, SensorSeriesPoint, SensorEvent, SensorGraphKind } from './sensorGraphTypes'

// 2026-09-08 の時刻ラベル（0〜23時、10分間隔ではなく1時間ごと）
function makeHourlyPoints(values: (number | null)[]): SensorSeriesPoint[] {
  return values.map((v, i) => ({
    measuredAt: `2026-09-08T${String(i).padStart(2, '0')}:00:00`,
    value: v,
    status: (v === null ? 'missing' : v > 35 ? 'warning' : 'normal') as SensorSeriesPoint['status'],
  }))
}

function makePrevDayPoints(values: (number | null)[]): SensorSeriesPoint[] {
  return values.map((v, i) => ({
    measuredAt: `2026-09-07T${String(i).padStart(2, '0')}:00:00`,
    value: v,
    status: 'normal' as const,
  }))
}

// 24時間温度データ（添付デザイン準拠）
const TEMP_CURRENT_VALUES: (number | null)[] = [
  31.8, 32.0, 32.3, 32.1, 32.4, 32.8,
  33.1, 33.4, 33.8, 34.2, 34.6, 34.9,
  35.2, 35.5, 35.8, 36.2, 35.9, 35.5,
  35.1, 34.8, 34.4, 34.1, 33.8, 33.5,
]
const TEMP_PREV_VALUES: (number | null)[] = [
  30.5, 30.8, 31.0, 30.9, 31.2, 31.5,
  31.8, 32.1, 32.4, 32.7, 33.0, 33.3,
  33.6, 33.9, 34.2, 34.5, 34.3, 34.0,
  33.7, 33.5, 33.2, 33.0, 32.8, 32.6,
]

const TEMP_EVENTS: SensorEvent[] = [
  {
    id: 'ev1',
    sensorKind: 'temperature',
    startedAt: '2026-09-08T14:20:00',
    endedAt: '2026-09-08T15:10:00',
    threshold: 35,
    peakValue: 36.2,
    message: '高温状態が50分継続',
  },
]

// 湿度データ
const HUMID_CURRENT_VALUES: (number | null)[] = [
  72, 71, 71, 70, 70, 69, 69, 68, 68, 67, 67, 66,
  65, 65, 64, 63, 63, 64, 65, 66, 67, 68, 69, 70,
]
const HUMID_PREV_VALUES: (number | null)[] = [
  74, 73, 73, 72, 72, 71, 70, 70, 69, 68, 68, 67,
  67, 66, 66, 65, 65, 66, 67, 68, 69, 70, 71, 72,
]

// 重量データ
const WEIGHT_CURRENT_VALUES: (number | null)[] = [
  41.0, 41.0, 41.1, 41.1, 41.2, 41.3,
  41.5, 41.8, 42.0, 42.2, 42.4, 42.5,
  42.6, 42.6, 42.7, 42.8, 42.8, 42.7,
  42.6, 42.5, 42.4, 42.3, 42.2, 42.1,
]
const WEIGHT_PREV_VALUES: (number | null)[] = [
  40.5, 40.5, 40.6, 40.6, 40.7, 40.8,
  41.0, 41.2, 41.4, 41.5, 41.6, 41.7,
  41.8, 41.8, 41.9, 42.0, 42.0, 41.9,
  41.8, 41.7, 41.6, 41.5, 41.4, 41.3,
]

// 音響データ
const SOUND_CURRENT_VALUES: (number | null)[] = [
  44, 44, 43, 43, 44, 45, 46, 46, 47, 47, 46, 46,
  46, 47, 48, 47, 46, 46, 45, 45, 44, 44, 43, 43,
]
const SOUND_PREV_VALUES: (number | null)[] = [
  43, 43, 42, 42, 43, 44, 45, 45, 46, 46, 45, 45,
  45, 46, 47, 46, 45, 45, 44, 44, 43, 43, 42, 42,
]

// 欠損あり温度データ（partial-data用）
const TEMP_PARTIAL_VALUES: (number | null)[] = [
  31.8, 32.0, 32.3, null, null, 32.8,
  33.1, 33.4, 33.8, 34.2, 34.6, 34.9,
  35.2, 35.5, 35.8, 36.2, 35.9, 35.5,
  35.1, 34.8, 34.4, 34.1, 33.8, 33.5,
]

// 週間データ（7日×1点/日）
function makeWeeklyPoints(values: number[], endDate = '2026-09-08'): SensorSeriesPoint[] {
  const end = new Date(endDate)
  return values.map((v, i) => {
    const d = new Date(end)
    d.setDate(d.getDate() - (6 - i))
    return {
      measuredAt: d.toISOString().slice(0, 10) + 'T12:00:00',
      value: v,
      status: 'normal' as const,
    }
  })
}

const TEMP_WEEK_CURRENT = makeWeeklyPoints([33.8, 34.2, 34.5, 33.9, 34.8, 35.2, 35.8])
const TEMP_WEEK_PREV    = makeWeeklyPoints([32.5, 33.0, 33.3, 32.8, 33.5, 33.8, 34.1], '2026-09-01')

// 月間データ（30日×1点/日）
function makeMonthlyPoints(seed: number, endDate = '2026-09-08'): SensorSeriesPoint[] {
  const end = new Date(endDate)
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(end)
    d.setDate(d.getDate() - (29 - i))
    return {
      measuredAt: d.toISOString().slice(0, 10) + 'T12:00:00',
      value: parseFloat((seed + Math.sin(i * 0.3) * 1.5 + i * 0.05).toFixed(1)),
      status: 'normal' as const,
    }
  })
}

function buildData(
  kind: SensorGraphKind,
  current: SensorSeriesPoint[],
  comparison: SensorSeriesPoint[],
  events: SensorEvent[],
  threshold?: { min?: number; max?: number },
): SensorGraphData {
  const units: Record<SensorGraphKind, string> = {
    temperature: '℃',
    humidity: '%',
    weight: 'kg',
    sound: 'dB',
  }
  return {
    colonyId: 'a3',
    sensorKind: kind,
    unit: units[kind],
    intervalMinutes: 10,
    threshold,
    current,
    comparison,
    events,
    fetchedAt: '2026-09-08T15:30:00',
  }
}

export const GRAPH_FIXTURE_NORMAL_DAY: SensorGraphData = buildData(
  'temperature',
  makeHourlyPoints(TEMP_CURRENT_VALUES),
  makePrevDayPoints(TEMP_PREV_VALUES),
  TEMP_EVENTS,
  { max: 35 },
)

export const GRAPH_FIXTURE_PARTIAL: SensorGraphData = buildData(
  'temperature',
  makeHourlyPoints(TEMP_PARTIAL_VALUES),
  makePrevDayPoints(TEMP_PREV_VALUES),
  TEMP_EVENTS,
  { max: 35 },
)

export const GRAPH_FIXTURE_EMPTY: SensorGraphData = buildData(
  'temperature',
  [],
  [],
  [],
  { max: 35 },
)

export const GRAPH_FIXTURE_WEEK: SensorGraphData = {
  ...buildData('temperature', TEMP_WEEK_CURRENT, TEMP_WEEK_PREV, TEMP_EVENTS, { max: 35 }),
  intervalMinutes: 1440,
}

export const GRAPH_FIXTURE_MONTH: SensorGraphData = {
  ...buildData(
    'temperature',
    makeMonthlyPoints(33),
    makeMonthlyPoints(32, '2026-08-09'),
    TEMP_EVENTS,
    { max: 35 },
  ),
  intervalMinutes: 1440,
}

export function getFixtureForKind(kind: SensorGraphKind, period: 'day' | 'week' | 'month'): SensorGraphData {
  const units: Record<SensorGraphKind, string> = {
    temperature: '℃',
    humidity: '%',
    weight: 'kg',
    sound: 'dB',
  }
  const thresholds: Partial<Record<SensorGraphKind, { min?: number; max?: number }>> = {
    temperature: { max: 35 },
    humidity:    { min: 40, max: 80 },
  }
  if (period === 'week') {
    const vals: Record<SensorGraphKind, number[]> = {
      temperature: [33.8, 34.2, 34.5, 33.9, 34.8, 35.2, 35.8],
      humidity:    [68, 67, 66, 65, 64, 63, 64],
      weight:      [41.2, 41.5, 41.8, 42.0, 42.2, 42.4, 42.6],
      sound:       [45, 46, 46, 47, 46, 46, 45],
    }
    const prevVals: Record<SensorGraphKind, number[]> = {
      temperature: [32.5, 33.0, 33.3, 32.8, 33.5, 33.8, 34.1],
      humidity:    [70, 69, 68, 67, 66, 65, 66],
      weight:      [40.5, 40.8, 41.0, 41.2, 41.4, 41.6, 41.8],
      sound:       [44, 45, 45, 46, 45, 45, 44],
    }
    return {
      colonyId: 'a3', sensorKind: kind, unit: units[kind], intervalMinutes: 1440,
      threshold: thresholds[kind],
      current: makeWeeklyPoints(vals[kind]),
      comparison: makeWeeklyPoints(prevVals[kind], '2026-09-01'),
      events: kind === 'temperature' ? TEMP_EVENTS : [],
      fetchedAt: '2026-09-08T15:30:00',
    }
  }
  if (period === 'month') {
    const seeds: Record<SensorGraphKind, number> = {
      temperature: 33, humidity: 67, weight: 41, sound: 45,
    }
    return {
      colonyId: 'a3', sensorKind: kind, unit: units[kind], intervalMinutes: 1440,
      threshold: thresholds[kind],
      current: makeMonthlyPoints(seeds[kind]),
      comparison: makeMonthlyPoints(seeds[kind] - 1, '2026-08-09'),
      events: kind === 'temperature' ? TEMP_EVENTS : [],
      fetchedAt: '2026-09-08T15:30:00',
    }
  }
  const currentVals: Record<SensorGraphKind, (number | null)[]> = {
    temperature: TEMP_CURRENT_VALUES,
    humidity: HUMID_CURRENT_VALUES,
    weight: WEIGHT_CURRENT_VALUES,
    sound: SOUND_CURRENT_VALUES,
  }
  const prevVals: Record<SensorGraphKind, (number | null)[]> = {
    temperature: TEMP_PREV_VALUES,
    humidity: HUMID_PREV_VALUES,
    weight: WEIGHT_PREV_VALUES,
    sound: SOUND_PREV_VALUES,
  }
  return buildData(
    kind,
    makeHourlyPoints(currentVals[kind]),
    makePrevDayPoints(prevVals[kind]),
    kind === 'temperature' ? TEMP_EVENTS : [],
    thresholds[kind],
  )
}
