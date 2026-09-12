// SCR-009 蜂群詳細用ダミーデータ
// 実データは将来 window.HoneyDB 経由で取得する

export type ColonyDetailStatus = 'good' | 'warn' | 'danger'

export interface InspectionPoint {
  id: string
  date: string       // 'YYYY-MM-DD'
  time: string       // 'HH:MM'
  weather: string
  note: string
  bee: number
  brood: number
  honey: number
  empty: number
  strengthScore: number
}

export interface StrengthPoint {
  date: string
  score: number
}

export interface SensorData {
  fetchedAt: string
  temperature: number
  temperatureDelta: number
  humidity: number
  humidityDelta: number
  weight: number
  weightDelta: number
}

export interface ColonyDetail {
  id: string
  name: string
  apiaryName: string
  hiveName: string
  status: ColonyDetailStatus
  statusLabel: string
  strengthScore: number
  strengthScoreDelta: number
  inspections: InspectionPoint[]
  strengthHistory: StrengthPoint[]
  sensor: SensorData
  workRecordCount: number
  latestCameraDate: string
  aiDiagnosisLabel: string
  lastSyncAt: string
}

export const mockColonyDetail: ColonyDetail = {
  id: 'a3',
  name: 'A-03',
  apiaryName: '宮田養蜂場',
  hiveName: '1号箱',
  status: 'danger',
  statusLabel: '！ 要確認',
  strengthScore: 42,
  strengthScoreDelta: -12,
  lastSyncAt: '9:41',
  // 内訳の推移: 8/10, 8/17, 8/24, 8/28, 9/7
  inspections: [
    {
      id: 'insp-1',
      date: '2026-08-10',
      time: '09:10',
      weather: '晴れ',
      note: '良好。女王産卵確認。蜂数も充分。',
      bee: 55, brood: 38, honey: 5, empty: 2,
      strengthScore: 74,
    },
    {
      id: 'insp-2',
      date: '2026-08-17',
      time: '09:30',
      weather: '曇り',
      note: '蜂数やや減少。貯蜜充分。女王確認。',
      bee: 50, brood: 30, honey: 9, empty: 11,
      strengthScore: 67,
    },
    {
      id: 'insp-3',
      date: '2026-08-24',
      time: '09:15',
      weather: '晴れ',
      note: '育児量が減少傾向。蜂数も減少中。',
      bee: 44, brood: 20, honey: 13, empty: 23,
      strengthScore: 58,
    },
    {
      id: 'insp-4',
      date: '2026-08-28',
      time: '09:20',
      weather: '晴れ',
      note: '育児量が減少。女王未確認。',
      bee: 40, brood: 12, honey: 16, empty: 32,
      strengthScore: 45,
    },
    {
      id: 'insp-5',
      date: '2026-09-07',
      time: '09:00',
      weather: '晴れ',
      note: '女王確認できず。緊急対応が必要。',
      bee: 36, brood: 8, honey: 18, empty: 38,
      strengthScore: 42,
    },
  ],
  // 強さスコア推移: 7/1, 7/15, 7/29, 8/12, 8/26, 9/7
  strengthHistory: [
    { date: '2026-07-01', score: 78 },
    { date: '2026-07-15', score: 72 },
    { date: '2026-07-29', score: 68 },
    { date: '2026-08-12', score: 60 },
    { date: '2026-08-26', score: 52 },
    { date: '2026-09-07', score: 42 },
  ],
  sensor: {
    fetchedAt: '9/7 9:40',
    temperature: 35.8,
    temperatureDelta: 1.2,
    humidity: 68,
    humidityDelta: -4,
    weight: 42.6,
    weightDelta: 0.8,
  },
  workRecordCount: 6,
  latestCameraDate: '9/5',
  aiDiagnosisLabel: '要確認の兆候',
}
