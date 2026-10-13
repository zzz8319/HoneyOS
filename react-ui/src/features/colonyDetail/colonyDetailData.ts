/**
 * HoneyDB からの生データを ColonyDetail 形式へ変換するユーティリティ
 */
import type { ColonyDetail, InspectionPoint } from './mockData'

interface RawColony { id: string; name: string; farmId: string | null; [k: string]: unknown }
interface RawFarm   { id: string; name: string; [k: string]: unknown }
interface RawFrame  { bee: number; brood: number; honey: number }
interface RawInspRecord {
  id: string; colony: string; date: string; time: string
  weather: string; frameMemo: string; frames?: RawFrame[]
  queenStatus: string | null; queenPresent: boolean | null
  [k: string]: unknown
}

function avgComp(frames: RawFrame[]) {
  const filled = frames.filter(f => f && (f.bee + f.brood + f.honey) > 0)
  if (!filled.length) return { bee: 0, brood: 0, honey: 0, empty: 100 }
  const s = filled.reduce((a, f) => ({ bee: a.bee + f.bee, brood: a.brood + f.brood, honey: a.honey + f.honey }), { bee: 0, brood: 0, honey: 0 })
  const n = filled.length
  const bee = Math.round(s.bee / n), brood = Math.round(s.brood / n), honey = Math.round(s.honey / n)
  return { bee, brood, honey, empty: Math.max(0, 100 - bee - brood - honey) }
}

function strengthScore(comp: { bee: number; brood: number }): number {
  return Math.round(comp.bee * 0.6 + comp.brood * 0.4)
}

function detailStatus(score: number): 'good' | 'warn' | 'danger' {
  if (score >= 50) return 'good'
  if (score >= 35) return 'warn'
  return 'danger'
}

export function buildColonyDetail(
  colonyId: string,
  farms: unknown[],
  colonies: unknown[],
  inspRecords: unknown[],
): ColonyDetail | null {
  const colony = (colonies as RawColony[]).find(c => c.id === colonyId)
  if (!colony) return null

  const farmList = farms as RawFarm[]
  const farmName = farmList.find(f => String(f.id) === String(colony.farmId))?.name ?? '養蜂場なし'

  const recs = (inspRecords as RawInspRecord[])
    .filter(r => r.colony === colonyId)
    .sort((a, b) => b.date.localeCompare(a.date))

  const inspections: InspectionPoint[] = recs.map(r => {
    const comp = avgComp(r.frames ?? [])
    return {
      id: r.id,
      date: r.date,
      time: r.time,
      weather: r.weather,
      note: r.frameMemo || '',
      bee: comp.bee,
      brood: comp.brood,
      honey: comp.honey,
      empty: comp.empty,
      strengthScore: strengthScore(comp),
    }
  })

  const latest = inspections[0]
  const prev   = inspections[1]
  const score: number | null  = latest ? latest.strengthScore : null
  const scoreDelta: number | null = latest && prev ? latest.strengthScore - prev.strengthScore : null

  const strengthHistory = [...inspections]
    .reverse()
    .map(i => ({ date: i.date, score: i.strengthScore }))

  return {
    id: colony.id,
    name: colony.name,
    apiaryName: farmName,
    hiveName: '',
    status: score != null ? detailStatus(score) : 'warn',
    statusLabel: score != null ? (detailStatus(score) === 'good' ? '✓ 良好' : detailStatus(score) === 'warn' ? '！ 注意' : '！ 要確認') : '—',
    strengthScore: score,
    strengthScoreDelta: scoreDelta,
    inspections,
    strengthHistory,
    sensor: { fetchedAt: null, temperature: null, temperatureDelta: null, humidity: null, humidityDelta: null, weight: null, weightDelta: null },
    workRecordCount: 0,
    latestCameraDate: '',
    aiDiagnosisLabel: '',
    lastSyncAt: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
  }
}
