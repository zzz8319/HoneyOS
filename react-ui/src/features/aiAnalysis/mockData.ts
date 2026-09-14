import type { InspectionSummary, InspectionData, SelectedPhoto } from './types'

export const MOCK_INSPECTION_SUMMARY: InspectionSummary = {
  colonyLabel: 'A-03',
  dateLabel: '8月28日',
  apiaryName: '宮田養蜂場',
  boxName: '1号箱',
}

export const MOCK_INSPECTION_DATA: InspectionData = {
  beePopulation: { value: 40, diff: 5 },
  brood: { value: 28, diff: -12 },
  honey: { value: 55, diff: 3 },
  queenConfirmed: null,
  estimatedBees: 10000,
}

export const MOCK_SELECTED_PHOTOS: SelectedPhoto[] = [
  { id: 'photo-001', timeLabel: '9:18', type: 'inspection' },
  { id: 'photo-004', timeLabel: '9:25', type: 'inspection' },
]

export const MOCK_MAX_PHOTOS: SelectedPhoto[] = [
  { id: 'photo-001', timeLabel: '9:18', type: 'inspection' },
  { id: 'photo-002', timeLabel: '9:20', type: 'inspection' },
  { id: 'photo-003', timeLabel: '9:23', type: 'inspection' },
  { id: 'photo-004', timeLabel: '9:25', type: 'inspection' },
  { id: 'photo-005', timeLabel: '9:28', type: 'inspection' },
  { id: 'photo-006', timeLabel: '9:31', type: 'inspection' },
  { id: 'photo-007', timeLabel: '9:34', type: 'inspection' },
  { id: 'photo-008', timeLabel: '9:37', type: 'inspection' },
  { id: 'photo-ac-001', timeLabel: '8:10', type: 'auto-capture' },
  { id: 'photo-ac-002', timeLabel: '14:32', type: 'auto-capture' },
]

export const MOCK_CONTEXT = {
  inspectionId: 'insp-2026-08-28',
  colonyId: 'colony-a03',
  apiaryId: 'apiary-miyata',
}
