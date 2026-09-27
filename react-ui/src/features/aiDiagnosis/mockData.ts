// [DEV FIXTURE] — 実データは window.HoneyDB 経由で取得する。本番では使用しない。
import type { DiagnosisData } from './types'

export const MOCK_DIAGNOSIS_DATA: DiagnosisData = {
  diagnosisId: 'diag-2026-08-28-a03',
  inspectionId: 'insp-2026-08-28',
  colonyLabel: 'A-03',
  dateLabel: '2026年8月28日',
  summary: {
    severity: 'danger',
    confidence: 87,
    text: '女王の確認ができず、育児量も減少しています。',
  },
  detections: [
    {
      id: 'det-queen',
      title: '女王未確認',
      severity: 'danger',
      confidence: 91,
      description: '画像からは女王の存在を確認できませんでした。女王が不在の可能性があります。',
      nextCheck: '巣板を1枚ずつ確認し、女王卵・若い幼虫の有無を確認してください。',
    },
    {
      id: 'det-brood',
      title: '育児量の減少',
      severity: 'warn',
      confidence: 84,
      description: '通常と比べて育児エリアが少なくなっています。季節要因や女王の状態を確認してください。',
      nextCheck: '育児圏の枚数と卵の有無を確認し、必要であれば給餌を検討してください。',
    },
    {
      id: 'det-varroa',
      title: 'バロアダニの疑い',
      severity: 'warn',
      confidence: 72,
      description: '成虫の形状からバロアダニの疑いがある個体を検出しました。詳細な確認を推奨します。',
      nextCheck: 'アルコールウォッシュや粘着板でダニの寄生率を確認してください。',
    },
  ],
}
