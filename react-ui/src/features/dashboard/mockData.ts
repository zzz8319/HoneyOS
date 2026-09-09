// SCR-006 ダッシュボード用ダミーデータ
// 実データは将来 window.HoneyDB 経由で取得する

export interface WeatherData {
  tempC: number
  humidity: number
  windMs: number
  /** 過去24時間の気温（1時間刻み、25点 = 0h〜24h） */
  tempHistory: number[]
  inspectable: boolean
  inspectReason?: string
  fetchedAt: string
}

export type ColonyStatus = 'good' | 'warn' | 'danger'

export interface ColonySummaryItem {
  id: string
  name: string
  status: ColonyStatus
  score: number
  delta: number
}

export interface ColonySummary {
  total: number
  average: number
  good: number
  warn: number
  danger: number
  colonies: ColonySummaryItem[]
}

export interface WeeklyStats {
  period: string
  honeyKg: number
  honeyPrevPct: number
  workCount: number
  workPrevDiff: number
  honeyHistory: { label: string; kg: number }[]
}

export interface DashboardData {
  farmName: string
  alertColonyCount: number
  weather: WeatherData
  colonies: ColonySummary
  weekly: WeeklyStats
}

export const mockDashboard: DashboardData = {
  farmName: '宮田養蜂場',
  alertColonyCount: 2,
  weather: {
    tempC: 28.4,
    humidity: 64,
    windMs: 2.1,
    // 0h〜24h の気温（カタログの折れ線グラフに合わせた山型）
    tempHistory: [
      16, 15, 15, 15, 15, 16, 18, 20, 22, 24, 26, 27,
      28, 29, 29, 28, 27, 26, 25, 24, 23, 22, 21, 19, 18,
    ],
    inspectable: true,
    fetchedAt: '9:41',
  },
  colonies: {
    total: 10,
    average: 74,
    good: 7,
    warn: 2,
    danger: 1,
    // カタログの棒グラフ値（82, 76, 68, 42, 88, 79, 73, 69, 58, 91）に合わせる
    colonies: [
      { id: 'a1', name: 'A-01', status: 'good',   score: 82, delta:  5 },
      { id: 'a2', name: 'A-02', status: 'good',   score: 76, delta:  2 },
      { id: 'a3', name: 'A-03', status: 'good',   score: 68, delta: -12 },
      { id: 'a4', name: 'A-04', status: 'danger', score: 42, delta:  8 },
      { id: 'a5', name: 'A-05', status: 'good',   score: 88, delta:  4 },
      { id: 'a6', name: 'A-06', status: 'good',   score: 79, delta:  1 },
      { id: 'b1', name: 'B-01', status: 'good',   score: 73, delta: -3 },
      { id: 'b2', name: 'B-02', status: 'warn',   score: 69, delta:  6 },
      { id: 'b3', name: 'B-03', status: 'warn',   score: 58, delta: -5 },
      { id: 'b4', name: 'B-04', status: 'good',   score: 91, delta:  3 },
    ],
  },
  weekly: {
    period: '9/1 - 9/7',
    honeyKg: 12.4,
    honeyPrevPct: 12,
    workCount: 6,
    workPrevDiff: 0,
    honeyHistory: [
      { label: '8/11', kg: 6.0 },
      { label: '8/18', kg: 8.5 },
      { label: '8/25', kg: 10.8 },
      { label: '9/1',  kg: 12.4 },
    ],
  },
}
