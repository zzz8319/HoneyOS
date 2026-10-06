import type { WorkHistoryRecord, WorkHistoryApiary, WorkHistoryWorkType } from './types'

interface RawWork {
  id: string
  type: string
  colony: string
  colonyIds?: string[]
  date: string
  time?: string
  memo?: string
  yieldKg?: number
  harvestMethod?: string
  feedType?: string
  feedAmount?: number
  medicationName?: string
  nextTreatmentDate?: string
  swarmType?: string
  photoUrls?: string[]
  [k: string]: unknown
}

interface RawFarm { id: string; name: string; [k: string]: unknown }
interface RawColony { id: string; name: string; farmId: string | null; [k: string]: unknown }

const TYPE_LABEL: Record<string, string> = {
  harvest: '採蜜', feeding: '給餌', treatment: '投薬・治療', swarming: '分蜂対応', wintering: '越冬準備',
}
const VALID_TYPES: WorkHistoryWorkType[] = ['harvest', 'feeding', 'treatment', 'swarming', 'wintering']

function toWorkType(raw: string): WorkHistoryWorkType {
  return (VALID_TYPES.includes(raw as WorkHistoryWorkType) ? raw : 'harvest') as WorkHistoryWorkType
}

export function buildWorkHistoryData(
  farms: unknown[],
  colonies: unknown[],
  workRecords: unknown[],
): { records: WorkHistoryRecord[]; apiaries: WorkHistoryApiary[] } {
  const farmList = farms as RawFarm[]
  const colonyList = colonies as RawColony[]
  const recList = workRecords as RawWork[]

  const farmMap = new Map(farmList.map(f => [String(f.id), f.name]))
  const colonyMap = new Map(colonyList.map(c => [c.id, { name: c.name, farmId: c.farmId ? String(c.farmId) : null }]))

  const records: WorkHistoryRecord[] = recList.map(r => {
    const ids = r.colonyIds?.length ? r.colonyIds : (r.colony ? [r.colony] : [])
    const labels = ids.map(id => colonyMap.get(id)?.name ?? id)
    const firstColonyFarmId = ids[0] ? colonyMap.get(ids[0])?.farmId ?? null : null
    const wt = toWorkType(r.type)
    return {
      id: r.id,
      workType: wt,
      title: TYPE_LABEL[wt] ?? wt,
      performedDate: r.date,
      performedTime: r.time ?? '',
      apiaryId: firstColonyFarmId ?? undefined,
      apiaryName: firstColonyFarmId ? (farmMap.get(firstColonyFarmId) ?? undefined) : undefined,
      colonyIds: ids,
      colonyLabels: labels,
      memo: r.memo,
      photoUrls: r.photoUrls,
      details: {
        harvestAmount: r.yieldKg,
        harvestUnit: r.harvestMethod,
        feedType: r.feedType ?? undefined,
        feedAmount: r.feedAmount ?? undefined,
        treatmentName: r.medicationName ?? undefined,
        nextTreatmentDate: r.nextTreatmentDate ?? undefined,
      },
    }
  })

  const apiaries: WorkHistoryApiary[] = farmList.map(f => ({ id: String(f.id), name: f.name }))
  return { records, apiaries }
}
