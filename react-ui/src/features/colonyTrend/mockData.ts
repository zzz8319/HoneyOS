// SCR-029 蜂群トレンド用ダミーデータ
// 実データは将来 window.HoneyDB 経由で取得する

export type ColonyTrendViewState =
  | 'normal'
  | 'empty'
  | 'loading'
  | 'error'
  | 'offline'

export type Metric = 'strength' | 'bee' | 'brood' | 'honey'
export type Period  = '3m' | '1y' | 'all'
export type CompareMode = 'individual' | 'average'
export type YearMode    = 'current' | 'compare'

export interface TrendPoint {
  date: string  // 'YYYY-MM-DD'
  value: number
}

export interface RadarData {
  bee:    number
  brood:  number
  honey:  number
  queen:  number
  latestDate: string
}

export interface ColonySeries {
  colonyId: string
  name:     string   // 'A-01', 'A-03', 'B-01'
  color:    string
  points:   Record<Metric, TrendPoint[]>
  prevYearPoints?: Record<Metric, TrendPoint[]>
  radar:    RadarData
}

export interface AvgSeries {
  points: Record<Metric, TrendPoint[]>
}

export interface SelectableColony {
  id:         string
  name:       string
  apiaryName: string
}

export interface ColonyTrendData {
  availableColonies: SelectableColony[]
  series:    ColonySeries[]
  average:   AvgSeries
  alertThreshold: number
}

// ── 系列カラー ────────────────────────────────────────────────────────────────
export const SERIES_COLORS = ['#3B82F6', '#EF4444', '#22C55E', '#A855F7', '#F59E0B'] as const

// ── デフォルト比較対象 ────────────────────────────────────────────────────────
export const DEFAULT_COLONY_IDS = ['a1', 'a3', 'b1'] as const

// ── Strength データ（2026-06〜09）────────────────────────────────────────────

function pts(pairs: [string, number][]): TrendPoint[] {
  return pairs.map(([date, value]) => ({ date, value }))
}

const A01_STRENGTH = pts([
  ['2026-06-10', 65], ['2026-06-24', 68],
  ['2026-07-08', 72], ['2026-07-22', 76],
  ['2026-08-05', 80], ['2026-08-19', 84], ['2026-08-28', 86],
  ['2026-09-07', 90],
])
const A03_STRENGTH = pts([
  ['2026-06-10', 68], ['2026-06-24', 62],
  ['2026-07-08', 55], ['2026-07-22', 50],
  ['2026-08-05', 47], ['2026-08-19', 43], ['2026-08-28', 42],
  ['2026-09-07', 25],
])
const B01_STRENGTH = pts([
  ['2026-06-10', 65], ['2026-06-24', 60],
  ['2026-07-08', 58], ['2026-07-22', 55],
  ['2026-08-05', 52], ['2026-08-19', 50], ['2026-08-28', 51],
  ['2026-09-07', 50],
])

// 蜂量・育児量・貯蜜量（ % スケール 0-100）
const A01_BEE    = pts([['2026-06-10',50],['2026-07-10',58],['2026-08-10',65],['2026-09-07',72]])
const A01_BROOD  = pts([['2026-06-10',40],['2026-07-10',48],['2026-08-10',54],['2026-09-07',60]])
const A01_HONEY  = pts([['2026-06-10',35],['2026-07-10',40],['2026-08-10',46],['2026-09-07',52]])

const A03_BEE    = pts([['2026-06-10',52],['2026-07-10',44],['2026-08-10',40],['2026-09-07',28]])
const A03_BROOD  = pts([['2026-06-10',55],['2026-07-10',48],['2026-08-10',60],['2026-09-07',62]])
const A03_HONEY  = pts([['2026-06-10',45],['2026-07-10',42],['2026-08-10',55],['2026-09-07',50]])

const B01_BEE    = pts([['2026-06-10',48],['2026-07-10',44],['2026-08-10',40],['2026-09-07',44]])
const B01_BROOD  = pts([['2026-06-10',42],['2026-07-10',40],['2026-08-10',36],['2026-09-07',38]])
const B01_HONEY  = pts([['2026-06-10',38],['2026-07-10',42],['2026-08-10',46],['2026-09-07',44]])

// 前年データ（去年と比較 用）
const A01_STRENGTH_PREV = pts([
  ['2025-06-10',55],['2025-06-24',58],['2025-07-08',62],['2025-07-22',65],
  ['2025-08-05',68],['2025-08-19',72],['2025-08-28',74],['2025-09-07',78],
])
const A03_STRENGTH_PREV = pts([
  ['2025-06-10',72],['2025-06-24',68],['2025-07-08',63],['2025-07-22',60],
  ['2025-08-05',57],['2025-08-19',54],['2025-08-28',52],['2025-09-07',48],
])
const B01_STRENGTH_PREV = pts([
  ['2025-06-10',58],['2025-06-24',55],['2025-07-08',53],['2025-07-22',50],
  ['2025-08-05',48],['2025-08-19',46],['2025-08-28',47],['2025-09-07',46],
])

// 全体平均
const AVG_STRENGTH = pts([
  ['2026-06-10',62],['2026-06-24',60],
  ['2026-07-08',60],['2026-07-22',60],
  ['2026-08-05',59],['2026-08-19',60],['2026-08-28',59],
  ['2026-09-07',55],
])

// ── メインフィクスチャ ─────────────────────────────────────────────────────
export const TREND_DATA: ColonyTrendData = {
  alertThreshold: 60,
  availableColonies: [
    { id: 'a1', name: 'A-01', apiaryName: '宮田養蜂場' },
    { id: 'a2', name: 'A-02', apiaryName: '宮田養蜂場' },
    { id: 'a3', name: 'A-03', apiaryName: '宮田養蜂場' },
    { id: 'a4', name: 'A-04', apiaryName: '宮田養蜂場' },
    { id: 'a5', name: 'A-05', apiaryName: '宮田養蜂場' },
    { id: 'a6', name: 'A-06', apiaryName: '宮田養蜂場' },
    { id: 'b1', name: 'B-01', apiaryName: '川東養蜂場' },
    { id: 'b2', name: 'B-02', apiaryName: '川東養蜂場' },
    { id: 'b3', name: 'B-03', apiaryName: '川東養蜂場' },
    { id: 'b4', name: 'B-04', apiaryName: '川東養蜂場' },
  ],
  series: [
    {
      colonyId: 'a1',
      name: 'A-01',
      color: '#3B82F6',
      points: { strength: A01_STRENGTH, bee: A01_BEE, brood: A01_BROOD, honey: A01_HONEY },
      prevYearPoints: { strength: A01_STRENGTH_PREV, bee: A01_BEE, brood: A01_BROOD, honey: A01_HONEY },
      radar: { bee: 70, brood: 60, honey: 52, queen: 80, latestDate: '2026年9月7日' },
    },
    {
      colonyId: 'a3',
      name: 'A-03',
      color: '#EF4444',
      points: { strength: A03_STRENGTH, bee: A03_BEE, brood: A03_BROOD, honey: A03_HONEY },
      prevYearPoints: { strength: A03_STRENGTH_PREV, bee: A03_BEE, brood: A03_BROOD, honey: A03_HONEY },
      radar: { bee: 40, brood: 60, honey: 55, queen: 70, latestDate: '2026年8月28日' },
    },
    {
      colonyId: 'b1',
      name: 'B-01',
      color: '#22C55E',
      points: { strength: B01_STRENGTH, bee: B01_BEE, brood: B01_BROOD, honey: B01_HONEY },
      prevYearPoints: { strength: B01_STRENGTH_PREV, bee: B01_BEE, brood: B01_BROOD, honey: B01_HONEY },
      radar: { bee: 44, brood: 38, honey: 44, queen: 62, latestDate: '2026年9月7日' },
    },
  ],
  average: {
    points: { strength: AVG_STRENGTH, bee: A01_BEE, brood: A01_BROOD, honey: A01_HONEY },
  },
}

// ── 期間フィルター ─────────────────────────────────────────────────────────
export function filterByPeriod(points: TrendPoint[], period: Period): TrendPoint[] {
  const now = new Date('2026-09-20')
  if (period === 'all') return points
  const msBack = period === '3m' ? 90 * 86400000 : 365 * 86400000
  const cutoff = new Date(now.getTime() - msBack)
  return points.filter(p => new Date(p.date) >= cutoff)
}

// ── メトリクス表示名 ───────────────────────────────────────────────────────
export const METRIC_LABELS: Record<Metric, string> = {
  strength: '強さスコア',
  bee:      '蜂量',
  brood:    '育児量',
  honey:    '貯蜜量',
}

export const PERIOD_LABELS: Record<Period, string> = {
  '3m':  '3ヶ月',
  '1y':  '1年',
  'all': '全期間',
}
