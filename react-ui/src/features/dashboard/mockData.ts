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
  /** 取得時刻 "HH:MM" */
  fetchedAt: string
}

export type ColonyStatus = 'good' | 'warn' | 'danger'

export interface ColonySummaryItem {
  id: string
  /** 表示名 "A-01" 形式 */
  name: string
  status: ColonyStatus
  /** 合成スコア（0–100、β版） */
  score: number
  /** 前回比（正=改善、負=悪化） */
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
  /** "MM/DD - MM/DD" */
  period: string
  honeyKg: number
  honeyPrevPct: number   // 前週比 % (正=増加)
  workCount: number
  workPrevDiff: number
  /** 直近4週の採蜜量（週ごと、古い順） */
  honeyHistory: { label: string; kg: number }[]
}

export interface DashboardData {
  farmName: string
  notifCount: number
  alertColonyCount: number
  weather: WeatherData
  colonies: ColonySummary
  weekly: WeeklyStats
}

export const mockDashboard: DashboardData = {
  farmName: '宮田養蜂場',
  notifCount: 0,
  alertColonyCount: 2,
  weather: {
    tempC: 28.4,
    humidity: 64,
    windMs: 2.1,
    tempHistory: [
      17, 16, 16, 15, 15, 16, 18, 21, 23, 25, 27, 28,
      28, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18,
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
    colonies: [
      { id: 'a1', name: 'A-01', status: 'good',   score: 82, delta:  5 },
      { id: 'a2', name: 'A-02', status: 'good',   score: 76, delta:  2 },
      { id: 'a3', name: 'A-03', status: 'danger', score: 42, delta: -12 },
      { id: 'a4', name: 'A-04', status: 'good',   score: 88, delta:  8 },
      { id: 'a5', name: 'A-05', status: 'warn',   score: 79, delta:  1 },
      { id: 'a6', name: 'A-06', status: 'good',   score: 73, delta: -3 },
      { id: 'b1', name: 'B-01', status: 'good',   score: 69, delta:  6 },
      { id: 'b2', name: 'B-02', status: 'warn',   score: 58, delta: -5 },
      { id: 'b3', name: 'B-03', status: 'good',   score: 91, delta:  3 },
      { id: 'b4', name: 'B-04', status: 'good',   score: 80, delta:  3 },
    ],
  },
  weekly: {
    period: '9/1 - 9/7',
    honeyKg: 12.4,
    honeyPrevPct: 12,
    workCount: 6,
    workPrevDiff: 2,
    honeyHistory: [
      { label: '8/11', kg: 7.2 },
      { label: '8/18', kg: 9.1 },
      { label: '8/25', kg: 11.0 },
      { label: '9/1',  kg: 12.4 },
    ],
  },
}
