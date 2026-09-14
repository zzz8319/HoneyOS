import type { CameraImagesData } from './types'

export const MOCK_DATA: CameraImagesData = {
  colonyLabel: 'A-03',
  apiaryName: '宮田養蜂場',
  inspectionId: 'insp-2026-08-28',
  colonyId: 'colony-a03',
  inspectionGroups: [
    {
      inspectionId: 'insp-2026-08-28',
      dateLabel: '2026年8月28日',
      photos: [
        { id: 'photo-001', type: 'inspection', timeLabel: '9:18', inspectionId: 'insp-2026-08-28', colonyId: 'colony-a03' },
        { id: 'photo-002', type: 'inspection', timeLabel: '9:20', inspectionId: 'insp-2026-08-28', colonyId: 'colony-a03' },
        { id: 'photo-003', type: 'inspection', timeLabel: '9:23', inspectionId: 'insp-2026-08-28', colonyId: 'colony-a03' },
        { id: 'photo-004', type: 'inspection', timeLabel: '9:25', inspectionId: 'insp-2026-08-28', colonyId: 'colony-a03' },
      ],
    },
  ],
  autoCaptureGroups: [
    {
      dateLabel: '2026年9月7日',
      photos: [
        { id: 'photo-ac-001', type: 'auto-capture', timeLabel: '8:10', inspectionId: 'insp-2026-08-28', colonyId: 'colony-a03' },
        { id: 'photo-ac-002', type: 'auto-capture', timeLabel: '14:32', inspectionId: 'insp-2026-08-28', colonyId: 'colony-a03' },
      ],
    },
  ],
}

export const DEFAULT_SELECTED_IDS = new Set(['photo-001', 'photo-004'])
