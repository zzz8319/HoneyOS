import type { SensorSeriesPoint } from './sensorGraphTypes'

export function calcStats(points: SensorSeriesPoint[]) {
  const vals = points.map(p => p.value).filter((v): v is number => v !== null)
  if (vals.length === 0) return { min: null, max: null, avg: null, missing: points.length }
  const missing = points.filter(p => p.value === null).length
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length
  return { min, max, avg, missing }
}
