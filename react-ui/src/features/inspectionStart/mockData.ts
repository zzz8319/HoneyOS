// SCR-011 内検開始用ダミーデータ
// 実データは将来 window.HoneyDB 経由で取得する

export type ColonyStatus = 'overdue' | 'danger' | 'warn' | 'good'
export type SortMode = 'recommended' | 'oldest' | 'newest'

export interface SelectableColony {
  id: string
  colonyId: string        // 表示用 "A-05"
  apiaryName: string
  apiaryKey: string       // タブフィルタ用
  status: ColonyStatus
  statusLabel: string     // バッジ表示文言（"！ 要確認" など）
  lastInspDaysAgo: number | null   // null = 一度も記録なし
  lastInspDateLabel: string        // "3日前" | "16日未内検" | "内検記録なし"
  bee: number
  brood: number
  honey: number
  empty: number
  prevBee: number
  prevBrood: number
  prevHoney: number
  prevEmpty: number
  prevInspDate: string      // "2026/8/22" (前回内検日)
  prevInspRelLabel: string  // "16日前" など
  previousInspectionMode?: 'frame' | 'ratio'  // 直近確定内検の記録方式
  cached?: boolean
}


export const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'recommended', label: 'おすすめ順' },
  { value: 'oldest',      label: '最終内検が古い順' },
  { value: 'newest',      label: '最終内検が新しい順' },
]

export function sortColonies(
  colonies: SelectableColony[],
  mode: SortMode = 'recommended',
): SelectableColony[] {
  const list = [...colonies]
  if (mode === 'recommended') {
    // overdue → danger → warn → good、同一ステータス内は経過日数 降順
    const order: ColonyStatus[] = ['overdue', 'danger', 'warn', 'good']
    list.sort((a, b) => {
      const oa = order.indexOf(a.status)
      const ob = order.indexOf(b.status)
      if (oa !== ob) return oa - ob
      const da = a.lastInspDaysAgo ?? 999
      const db = b.lastInspDaysAgo ?? 999
      return db - da
    })
  } else if (mode === 'oldest') {
    // 最終内検が古い順（日数大 → 小の逆順、未内検最上位）
    list.sort((a, b) => {
      const da = a.lastInspDaysAgo ?? 999
      const db = b.lastInspDaysAgo ?? 999
      return db - da
    })
  } else {
    // 最終内検が新しい順（日数小 → 大、未内検最下位）
    list.sort((a, b) => {
      const da = a.lastInspDaysAgo ?? 999
      const db = b.lastInspDaysAgo ?? 999
      return da - db
    })
  }
  return list
}
