// [DEV FIXTURE] — replace with window.HoneyDB call before production
import type { RecommendedWorkData } from './types'

export const MOCK_RECOMMENDED_WORK_DATA: RecommendedWorkData = {
  colonyLabel: 'A-03',
  diagnosisId: 'diag-001',
  inspectionId: 'insp-001',
  findings: [
    {
      title: 'バロアダニの疑い',
      confidence: 72,
      severity: 'warn',
      description: '成虫の形状から疑いがある個体を検出。',
    },
    {
      title: '育児量の減少',
      confidence: 84,
      severity: 'danger',
      description: '通常と比べて育児エリアが少なくなっています。',
    },
  ],
  items: [
    {
      id: 'work-1',
      priority: 1,
      title: '24時間以内に再確認',
      description: '巣枠と育児房を目視確認し、ダニ数を記録する。',
      tags: [
        { label: 'A-03', variant: 'neutral' },
        { label: '内検', variant: 'neutral' },
        { label: '優先度 高', variant: 'danger' },
      ],
    },
    {
      id: 'work-2',
      priority: 2,
      title: '給餌量を確認',
      description: '貯蜜量と群勢を確認して必要時に給餌する。',
      tags: [
        { label: 'A-03', variant: 'neutral' },
        { label: '給餌', variant: 'neutral' },
        { label: '3日以内', variant: 'warn' },
      ],
    },
    {
      id: 'work-3',
      priority: 3,
      title: '治療計画を検討',
      description: '確定診断後、使用薬剤と投薬日を記録する。',
      tags: [
        { label: '治療', variant: 'neutral' },
        { label: '要判断', variant: 'neutral' },
      ],
    },
  ],
}
