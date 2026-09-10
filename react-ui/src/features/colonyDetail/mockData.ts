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
  status: 'warn',
  statusLabel: '要確認',
  strengthScore: 42,
  strengthScoreDelta: -12,
  lastSyncAt: '9:41',
  inspections: [
    {
      id: 'insp-1',
      date: '2026-08-01',
      time: '09:10',
      weather: '晴れ',
      note: '良好。女王産卵確認。',
      bee: 52, brood: 32, honey: 12, empty: 4,
      strengthScore: 71,
    },
    {
      id: 'insp-2',
      date: '2026-08-10',
      time: '09:30',
      weather: '曇り',
      note: '蜂数やや減少。貯蜜充分。',
      bee: 48, brood: 28, honey: 18, empty: 6,
      strengthScore: 65,
    },
    {
      id: 'insp-3',
      date: '2026-08-20',
      time: '09:20',
      weather: '晴れ',
      note: '育児量が減少。女王未確認。',
      bee: 42, brood: 22, honey: 20, empty: 16,
      strengthScore: 54,
    },
    {
      id: 'insp-4',
      date: '2026-08-28',
      time: '09:20',
      weather: '晴れ',
      note: '女王確認できず。育児さらに減少。',
      bee: 38, brood: 15, honey: 22, empty: 25,
      strengthScore: 42,
    },
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
