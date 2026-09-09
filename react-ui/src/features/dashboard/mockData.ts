// SCR-006 ダッシュボード用ダミーデータ
// 実データは将来 window.HoneyDB 経由で取得する

export interface WeatherData {
  tempC: number
  humidity: number
  windMs: number
  /** 過去24時間の気温（1時間刻み、24点） */
  tempHistory: number[]
  /** 内検可否 */
  inspectable: boolean
  inspectReason?: string
}

export type ColonyStatus = 'good' | 'warn' | 'danger'

export interface ColonySummaryItem {
  id: string
  name: string
  status: ColonyStatus
  /** 合成スコア（0–100、β版） */
  score: number
}

export interface ColonySummary {
  total: number
  good: number
  warn: number
  danger: number
  colonies: ColonySummaryItem[]
}

export interface WeeklyStats {
  honeyKg: number
  honeyPrevDiffKg: number
  workCount: number
  workPrevDiff: number
  /** 直近7日の採蜜量（日ごと） */
  honeyHistory: number[]
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
  notifCount: 3,
  alertColonyCount: 2,
  weather: {
    tempC: 24.3,
    humidity: 58,
    windMs: 2.1,
    tempHistory: [
      19, 18, 18, 17, 17, 18, 20, 22, 23, 24, 25, 25,
      26, 26, 25, 25, 24, 24, 23, 22, 22, 21, 20, 20,
    ],
    inspectable: true,
  },
  colonies: {
    total: 12, good: 8, warn: 2, danger: 2, colonies: [],
  },
  weekly: {
    honeyKg: 4.2, honeyPrevDiffKg: 0.8, workCount: 7, workPrevDiff: 2,
    honeyHistory: [0.3, 0.6, 0.5, 0.8, 0.7, 0.9, 0.4],
  },
}

export const mockColonySummary: ColonySummary = {
  total: 12,
  good: 8,
  warn: 2,
  danger: 2,
  colonies: [
    { id: 'c1', name: '1号群',  status: 'good',   score: 82 },
    { id: 'c2', name: '2号群',  status: 'warn',   score: 54 },
    { id: 'c3', name: '3号群',  status: 'danger', score: 31 },
    { id: 'c4', name: '4号群',  status: 'good',   score: 78 },
    { id: 'c5', name: '5号群',  status: 'warn',   score: 62 },
    { id: 'c6', name: '6号群',  status: 'good',   score: 91 },
    { id: 'c7', name: '7号群',  status: 'good',   score: 75 },
    { id: 'c8', name: '8号群',  status: 'danger', score: 28 },
    { id: 'c9', name: '9号群',  status: 'good',   score: 88 },
    { id: 'c10', name: '10号群', status: 'good',   score: 70 },
    { id: 'c11', name: '11号群', status: 'good',   score: 83 },
    { id: 'c12', name: '12号群', status: 'good',   score: 77 },
  ],
}

export const mockWeekly: WeeklyStats = {
  honeyKg: 4.2,
  honeyPrevDiffKg: +0.8,
  workCount: 7,
  workPrevDiff: +2,
  honeyHistory: [0.3, 0.6, 0.5, 0.8, 0.7, 0.9, 0.4],
}
