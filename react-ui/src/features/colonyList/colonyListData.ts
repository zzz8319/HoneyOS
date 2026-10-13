/**
 * HoneyDB からの生データを ColonyListData 形式へ変換するユーティリティ
 */
import type { ColonyListData, ColonyListItem, ColonyStatus, Composition, CompositionDelta } from './mockData'

interface RawColony {
  id: string
  name: string
  farmId: string | null
  [key: string]: unknown
}

interface RawFarm {
  id: string
  name: string
  [key: string]: unknown
}

interface RawFrame {
  bee: number
  brood: number
  honey: number
}

interface RawInspRecord {
  id: string
  colony: string
  date: string
  frames?: RawFrame[]
  [key: string]: unknown
}

function calcComposition(frames: RawFrame[]): Composition {
  const filled = frames.filter(f => f && (f.bee + f.brood + f.honey) > 0)
  if (!filled.length) return { bee: 0, brood: 0, honey: 0, empty: 100 }
  const sum = filled.reduce((acc, f) => ({
    bee: acc.bee + f.bee,
    brood: acc.brood + f.brood,
    honey: acc.honey + f.honey,
  }), { bee: 0, brood: 0, honey: 0 })
  const n = filled.length
  const bee = Math.round(sum.bee / n)
  const brood = Math.round(sum.brood / n)
  const honey = Math.round(sum.honey / n)
  return { bee, brood, honey, empty: Math.max(0, 100 - bee - brood - honey) }
}

function colonyStatus(comp: Composition): ColonyStatus {
  if (comp.bee < 25 || comp.brood < 10) return 'danger'
  if (comp.bee < 35 || comp.brood < 18) return 'warn'
  return 'good'
}

export function buildColonyListData(
  farms: unknown[],
  colonies: unknown[],
  inspRecords: unknown[],
): ColonyListData {
  const farmList = farms as RawFarm[]
  const colonyList = colonies as RawColony[]
  const recordList = inspRecords as RawInspRecord[]

  const farmMap = new Map<string, string>(farmList.map(f => [String(f.id), f.name]))

  // 蜂群ごとに最新2件の内検記録を取得（compositionDelta 計算用）
  const byColony = new Map<string, RawInspRecord[]>()
  for (const r of recordList) {
    const key = r.colony
    if (!byColony.has(key)) byColony.set(key, [])
    byColony.get(key)!.push(r)
  }
  // date 降順ソート済みと仮定（loadInspRecords は created_at 降順）
  for (const recs of byColony.values()) {
    recs.sort((a, b) => b.date.localeCompare(a.date))
  }

  // 養蜂場ごとにグループ化
  const apiaryMap = new Map<string, ColonyListItem[]>()
  for (const colony of colonyList) {
    const farmId = colony.farmId ? String(colony.farmId) : 'unknown'
    const farmName = farmMap.get(farmId) ?? '養蜂場なし'

    const recs = byColony.get(colony.id) ?? []
    const latest = recs[0]
    const prev = recs[1]

    const latestFrames: RawFrame[] = latest?.frames ?? []
    const prevFrames: RawFrame[] = prev?.frames ?? []
    const composition = calcComposition(latestFrames)
    const prevComp = calcComposition(prevFrames)
    const compositionDelta: CompositionDelta = {
      bee:   composition.bee   - prevComp.bee,
      brood: composition.brood - prevComp.brood,
      honey: composition.honey - prevComp.honey,
      empty: composition.empty - prevComp.empty,
    }

    const item: ColonyListItem = {
      id: colony.id,
      name: colony.name,
      apiaryId: farmId,
      apiaryName: farmName,
      status: colonyStatus(composition),
      lastInspectedAt: latest?.date ?? '',
      composition,
      compositionDelta,
    }

    if (!apiaryMap.has(farmId)) apiaryMap.set(farmId, [])
    apiaryMap.get(farmId)!.push(item)
  }

  const apiaries = farmList
    .filter(f => apiaryMap.has(String(f.id)))
    .map(f => ({
      id: String(f.id),
      name: f.name,
      colonies: apiaryMap.get(String(f.id)) ?? [],
    }))

  // 農場なしの蜂群
  const unknownColonies = apiaryMap.get('unknown')
  if (unknownColonies?.length) {
    apiaries.push({ id: 'unknown', name: '養蜂場なし', colonies: unknownColonies })
  }

  return {
    apiaries,
    fetchedAt: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
  }
}
