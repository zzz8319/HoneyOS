// SCR-011 内検開始用ダミーデータ
// 実データは将来 window.HoneyDB 経由で取得する

export type ColonyStatus = 'overdue' | 'danger' | 'warn' | 'good'

export interface SelectableColony {
  id: string
  colonyId: string        // 表示用 "A-05"
  apiaryName: string
  apiaryKey: string       // タブフィルタ用
  status: ColonyStatus
  statusLabel: string
  lastInspDaysAgo: number | null   // null = 未内検
  lastInspDateLabel: string        // "3日前" | "16日未内検" など
  bee: number
  brood: number
  honey: number
  empty: number
  prevBee: number
  prevBrood: number
  prevHoney: number
  prevEmpty: number
  prevInspDate: string   // "2026/8/22"
  cached?: boolean       // オフライン時にキャッシュ済みかどうか
}

export const MOCK_COLONIES: SelectableColony[] = [
  {
    id: 'a05',
    colonyId: 'A-05',
    apiaryName: '宮田養蜂場',
    apiaryKey: 'miyata',
    status: 'overdue',
    statusLabel: '未内検',
    lastInspDaysAgo: null,
    lastInspDateLabel: '16日未内検',
    bee: 28, brood: 20, honey: 30, empty: 22,
    prevBee: 30, prevBrood: 22, prevHoney: 28, prevEmpty: 20,
    prevInspDate: '2026/8/23',
    cached: true,
  },
  {
    id: 'a03',
    colonyId: 'A-03',
    apiaryName: '宮田養蜂場',
    apiaryKey: 'miyata',
    status: 'danger',
    statusLabel: '！ 要確認',
    lastInspDaysAgo: 11,
    lastInspDateLabel: '11日前',
    bee: 22, brood: 14, honey: 34, empty: 30,
    prevBee: 30, prevBrood: 20, prevHoney: 32, prevEmpty: 18,
    prevInspDate: '2026/8/28',
    cached: true,
  },
  {
    id: 'a01',
    colonyId: 'A-01',
    apiaryName: '宮田養蜂場',
    apiaryKey: 'miyata',
    status: 'good',
    statusLabel: '✓ 良好',
    lastInspDaysAgo: 3,
    lastInspDateLabel: '3日前',
    bee: 40, brood: 28, honey: 22, empty: 10,
    prevBee: 38, prevBrood: 26, prevHoney: 24, prevEmpty: 12,
    prevInspDate: '2026/9/5',
    cached: true,
  },
  {
    id: 'b02',
    colonyId: 'B-02',
    apiaryName: '川東養蜂場',
    apiaryKey: 'kawahigashi',
    status: 'warn',
    statusLabel: '！ 注意',
    lastInspDaysAgo: 10,
    lastInspDateLabel: '10日前',
    bee: 32, brood: 18, honey: 28, empty: 22,
    prevBee: 36, prevBrood: 22, prevHoney: 26, prevEmpty: 16,
    prevInspDate: '2026/8/29',
    cached: false,
  },
]

export const APIARIES = [
  { key: 'all',          label: '全て' },
  { key: 'miyata',       label: '宮田' },
  { key: 'kawahigashi',  label: '川東' },
]

// おすすめ順: overdue → danger → warn → good, 次に lastInspDaysAgo 降順
export function sortColonies(colonies: SelectableColony[]): SelectableColony[] {
  const order: ColonyStatus[] = ['overdue', 'danger', 'warn', 'good']
  return [...colonies].sort((a, b) => {
    const oa = order.indexOf(a.status)
    const ob = order.indexOf(b.status)
    if (oa !== ob) return oa - ob
    const da = a.lastInspDaysAgo ?? 999
    const db = b.lastInspDaysAgo ?? 999
    return db - da
  })
}
