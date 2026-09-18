// [DEV FIXTURE] — replace with window.HoneyDB calls before production
import type { ReportRecord, ReportApiary, ReportColony, StrengthEntry } from './types'

export const REPORT_APIARIES: ReportApiary[] = [
  { id: 'apiary-1', name: '宮田養蜂場' },
  { id: 'apiary-2', name: '田中養蜂場' },
]

export const REPORT_COLONIES: ReportColony[] = [
  { id: 'A-01', name: 'A-01', apiaryId: 'apiary-1' },
  { id: 'A-02', name: 'A-02', apiaryId: 'apiary-1' },
  { id: 'A-03', name: 'A-03', apiaryId: 'apiary-1' },
  { id: 'A-04', name: 'A-04', apiaryId: 'apiary-1' },
  { id: 'A-05', name: 'A-05', apiaryId: 'apiary-1' },
  { id: 'B-01', name: 'B-01', apiaryId: 'apiary-2' },
]

// 6 active colonies; inspectionRate = inspected at least once in period / total
// September 2026: 5 out of 6 colonies inspected = 83.3% ≈ 84%

export const REPORT_RECORDS: ReportRecord[] = [
  // ── 2026年1月 ──
  { id: 'rr-0101', workType: 'harvest',   performedDate: '2026-01-15', apiaryId: 'apiary-1', colonyIds: ['A-01', 'A-02'], harvestAmountKg: 6.0 },
  { id: 'rr-0102', workType: 'feeding',   performedDate: '2026-01-10', apiaryId: 'apiary-1', colonyIds: ['A-03'] },
  { id: 'rr-0103', workType: 'inspection',performedDate: '2026-01-12', apiaryId: 'apiary-1', colonyIds: ['A-01'], hasInspection: true },
  { id: 'rr-0104', workType: 'inspection',performedDate: '2026-01-12', apiaryId: 'apiary-1', colonyIds: ['A-02'], hasInspection: true },
  { id: 'rr-0105', workType: 'inspection',performedDate: '2026-01-20', apiaryId: 'apiary-2', colonyIds: ['B-01'], hasInspection: true },
  { id: 'rr-0106', workType: 'harvest',   performedDate: '2026-01-22', apiaryId: 'apiary-2', colonyIds: ['B-01'], harvestAmountKg: 6.0 },

  // ── 2026年2月 ──
  { id: 'rr-0201', workType: 'harvest',   performedDate: '2026-02-10', apiaryId: 'apiary-1', colonyIds: ['A-01', 'A-02'], harvestAmountKg: 7.5 },
  { id: 'rr-0202', workType: 'harvest',   performedDate: '2026-02-18', apiaryId: 'apiary-2', colonyIds: ['B-01'], harvestAmountKg: 6.5 },
  { id: 'rr-0203', workType: 'feeding',   performedDate: '2026-02-05', apiaryId: 'apiary-1', colonyIds: ['A-03'] },
  { id: 'rr-0204', workType: 'inspection',performedDate: '2026-02-08', apiaryId: 'apiary-1', colonyIds: ['A-01'], hasInspection: true },
  { id: 'rr-0205', workType: 'inspection',performedDate: '2026-02-15', apiaryId: 'apiary-2', colonyIds: ['B-01'], hasInspection: true },

  // ── 2026年3月 ──
  { id: 'rr-0301', workType: 'harvest',   performedDate: '2026-03-08', apiaryId: 'apiary-1', colonyIds: ['A-01', 'A-02'], harvestAmountKg: 9.0 },
  { id: 'rr-0302', workType: 'harvest',   performedDate: '2026-03-20', apiaryId: 'apiary-2', colonyIds: ['B-01'], harvestAmountKg: 9.0 },
  { id: 'rr-0303', workType: 'feeding',   performedDate: '2026-03-12', apiaryId: 'apiary-1', colonyIds: ['A-03', 'A-04'] },
  { id: 'rr-0304', workType: 'inspection',performedDate: '2026-03-10', apiaryId: 'apiary-1', colonyIds: ['A-01'], hasInspection: true },
  { id: 'rr-0305', workType: 'inspection',performedDate: '2026-03-10', apiaryId: 'apiary-1', colonyIds: ['A-02'], hasInspection: true },

  // ── 2026年4月 ──
  { id: 'rr-0401', workType: 'harvest',   performedDate: '2026-04-05', apiaryId: 'apiary-1', colonyIds: ['A-01', 'A-02'], harvestAmountKg: 11.0 },
  { id: 'rr-0402', workType: 'harvest',   performedDate: '2026-04-18', apiaryId: 'apiary-2', colonyIds: ['B-01'], harvestAmountKg: 11.0 },
  { id: 'rr-0403', workType: 'feeding',   performedDate: '2026-04-10', apiaryId: 'apiary-1', colonyIds: ['A-03'] },
  { id: 'rr-0404', workType: 'treatment', performedDate: '2026-04-15', apiaryId: 'apiary-1', colonyIds: ['A-04'], isAiAlert: true },
  { id: 'rr-0405', workType: 'inspection',performedDate: '2026-04-08', apiaryId: 'apiary-1', colonyIds: ['A-01'], hasInspection: true },

  // ── 2026年5月 ──
  { id: 'rr-0501', workType: 'harvest',   performedDate: '2026-05-05', apiaryId: 'apiary-1', colonyIds: ['A-01', 'A-02'], harvestAmountKg: 14.0 },
  { id: 'rr-0502', workType: 'harvest',   performedDate: '2026-05-20', apiaryId: 'apiary-2', colonyIds: ['B-01'], harvestAmountKg: 14.0 },
  { id: 'rr-0503', workType: 'feeding',   performedDate: '2026-05-08', apiaryId: 'apiary-1', colonyIds: ['A-03', 'A-05'] },
  { id: 'rr-0504', workType: 'inspection',performedDate: '2026-05-06', apiaryId: 'apiary-1', colonyIds: ['A-01'], hasInspection: true },
  { id: 'rr-0505', workType: 'inspection',performedDate: '2026-05-06', apiaryId: 'apiary-1', colonyIds: ['A-02'], hasInspection: true },
  { id: 'rr-0506', workType: 'swarming',  performedDate: '2026-05-15', apiaryId: 'apiary-1', colonyIds: ['A-05'] },

  // ── 2026年6月 ──
  { id: 'rr-0601', workType: 'harvest',   performedDate: '2026-06-05', apiaryId: 'apiary-1', colonyIds: ['A-01', 'A-02'], harvestAmountKg: 18.0 },
  { id: 'rr-0602', workType: 'harvest',   performedDate: '2026-06-18', apiaryId: 'apiary-2', colonyIds: ['B-01'], harvestAmountKg: 17.0 },
  { id: 'rr-0603', workType: 'feeding',   performedDate: '2026-06-10', apiaryId: 'apiary-1', colonyIds: ['A-03'] },
  { id: 'rr-0604', workType: 'treatment', performedDate: '2026-06-12', apiaryId: 'apiary-1', colonyIds: ['A-04'], isAiAlert: true },
  { id: 'rr-0605', workType: 'inspection',performedDate: '2026-06-08', apiaryId: 'apiary-1', colonyIds: ['A-01'], hasInspection: true },
  { id: 'rr-0606', workType: 'inspection',performedDate: '2026-06-08', apiaryId: 'apiary-2', colonyIds: ['B-01'], hasInspection: true },

  // ── 2026年7月 ──
  { id: 'rr-0701', workType: 'harvest',   performedDate: '2026-07-07', apiaryId: 'apiary-1', colonyIds: ['A-01', 'A-02'], harvestAmountKg: 22.5 },
  { id: 'rr-0702', workType: 'harvest',   performedDate: '2026-07-20', apiaryId: 'apiary-2', colonyIds: ['B-01'], harvestAmountKg: 22.5 },
  { id: 'rr-0703', workType: 'feeding',   performedDate: '2026-07-10', apiaryId: 'apiary-1', colonyIds: ['A-03', 'A-04'] },
  { id: 'rr-0704', workType: 'inspection',performedDate: '2026-07-08', apiaryId: 'apiary-1', colonyIds: ['A-01'], hasInspection: true },
  { id: 'rr-0705', workType: 'inspection',performedDate: '2026-07-15', apiaryId: 'apiary-1', colonyIds: ['A-02'], hasInspection: true },

  // ── 2026年8月 ──
  { id: 'rr-0801', workType: 'harvest',   performedDate: '2026-08-07', apiaryId: 'apiary-1', colonyIds: ['A-01', 'A-02'], harvestAmountKg: 20.0 },
  { id: 'rr-0802', workType: 'harvest',   performedDate: '2026-08-18', apiaryId: 'apiary-2', colonyIds: ['B-01'], harvestAmountKg: 20.0 },
  { id: 'rr-0803', workType: 'feeding',   performedDate: '2026-08-12', apiaryId: 'apiary-1', colonyIds: ['A-03'] },
  { id: 'rr-0804', workType: 'swarming',  performedDate: '2026-08-28', apiaryId: 'apiary-1', colonyIds: ['A-05'] },
  { id: 'rr-0805', workType: 'wintering', performedDate: '2026-08-20', apiaryId: 'apiary-1', colonyIds: [] },
  { id: 'rr-0806', workType: 'inspection',performedDate: '2026-08-10', apiaryId: 'apiary-1', colonyIds: ['A-01'], hasInspection: true },
  { id: 'rr-0807', workType: 'inspection',performedDate: '2026-08-10', apiaryId: 'apiary-2', colonyIds: ['B-01'], hasInspection: true },

  // ── 2026年9月 (target month) ──
  // harvest: 4件 = 42.6 kg total
  { id: 'rr-0901', workType: 'harvest',   performedDate: '2026-09-07', apiaryId: 'apiary-1', colonyIds: ['A-01', 'A-02'], harvestAmountKg: 12.4 },
  { id: 'rr-0902', workType: 'harvest',   performedDate: '2026-09-10', apiaryId: 'apiary-1', colonyIds: ['A-03'], harvestAmountKg: 10.2 },
  { id: 'rr-0903', workType: 'harvest',   performedDate: '2026-09-14', apiaryId: 'apiary-2', colonyIds: ['B-01'], harvestAmountKg: 11.5 },
  { id: 'rr-0904', workType: 'harvest',   performedDate: '2026-09-20', apiaryId: 'apiary-1', colonyIds: ['A-04'], harvestAmountKg: 8.5 },
  // feeding: 7件
  { id: 'rr-0905', workType: 'feeding',   performedDate: '2026-09-06', apiaryId: 'apiary-1', colonyIds: ['B-01'] },
  { id: 'rr-0906', workType: 'feeding',   performedDate: '2026-09-08', apiaryId: 'apiary-1', colonyIds: ['A-03'] },
  { id: 'rr-0907', workType: 'feeding',   performedDate: '2026-09-09', apiaryId: 'apiary-1', colonyIds: ['A-04'] },
  { id: 'rr-0908', workType: 'feeding',   performedDate: '2026-09-11', apiaryId: 'apiary-2', colonyIds: ['B-01'] },
  { id: 'rr-0909', workType: 'feeding',   performedDate: '2026-09-12', apiaryId: 'apiary-1', colonyIds: ['A-05'] },
  { id: 'rr-0910', workType: 'feeding',   performedDate: '2026-09-13', apiaryId: 'apiary-1', colonyIds: ['A-01'] },
  { id: 'rr-0911', workType: 'feeding',   performedDate: '2026-09-15', apiaryId: 'apiary-1', colonyIds: ['A-02'] },
  // treatment: 2件
  { id: 'rr-0912', workType: 'treatment', performedDate: '2026-09-02', apiaryId: 'apiary-1', colonyIds: ['A-03', 'A-04'] },
  { id: 'rr-0913', workType: 'treatment', performedDate: '2026-09-16', apiaryId: 'apiary-2', colonyIds: ['B-01'] },
  // other (swarming/wintering/inspection): 5件
  { id: 'rr-0914', workType: 'swarming',  performedDate: '2026-09-03', apiaryId: 'apiary-1', colonyIds: ['A-05'] },
  { id: 'rr-0915', workType: 'wintering', performedDate: '2026-09-04', apiaryId: 'apiary-1', colonyIds: [] },
  // inspections (hasInspection=true): 3件 (used for inspectionRate)
  { id: 'rr-0916', workType: 'inspection',performedDate: '2026-09-05', apiaryId: 'apiary-1', colonyIds: ['A-01'], hasInspection: true },
  { id: 'rr-0917', workType: 'inspection',performedDate: '2026-09-05', apiaryId: 'apiary-1', colonyIds: ['A-02'], hasInspection: true },
  { id: 'rr-0918', workType: 'inspection',performedDate: '2026-09-05', apiaryId: 'apiary-1', colonyIds: ['A-03'], hasInspection: true },
  // 5 out of 6 colonies inspected (A-01, A-02, A-03, A-04(treatment), B-01(feeding)) = 83.3% ≈ 84%
  // AI alerts: 3件
  { id: 'rr-0919', workType: 'treatment', performedDate: '2026-09-17', apiaryId: 'apiary-1', colonyIds: ['A-05'], isAiAlert: true },
  { id: 'rr-0920', workType: 'treatment', performedDate: '2026-09-18', apiaryId: 'apiary-2', colonyIds: ['B-01'], isAiAlert: true },
  { id: 'rr-0921', workType: 'feeding',   performedDate: '2026-09-19', apiaryId: 'apiary-1', colonyIds: ['A-04'], isAiAlert: true },
]

// Monthly strength scores per colony (reuses same definition as ColonyDetail)
// strengthScore: 0-100, threshold 60 = warning level
export const STRENGTH_ENTRIES: StrengthEntry[] = [
  // 2026年1月
  { month: 1, apiaryId: 'apiary-1', colonyId: 'A-01', score: 68 },
  { month: 1, apiaryId: 'apiary-1', colonyId: 'A-02', score: 62 },
  { month: 1, apiaryId: 'apiary-2', colonyId: 'B-01', score: 65 },
  // 2026年2月
  { month: 2, apiaryId: 'apiary-1', colonyId: 'A-01', score: 74 },
  { month: 2, apiaryId: 'apiary-1', colonyId: 'A-02', score: 70 },
  { month: 2, apiaryId: 'apiary-2', colonyId: 'B-01', score: 72 },
  // 2026年3月
  { month: 3, apiaryId: 'apiary-1', colonyId: 'A-01', score: 70 },
  { month: 3, apiaryId: 'apiary-1', colonyId: 'A-02', score: 65 },
  { month: 3, apiaryId: 'apiary-2', colonyId: 'B-01', score: 69 },
  // 2026年4月
  { month: 4, apiaryId: 'apiary-1', colonyId: 'A-01', score: 62 },
  { month: 4, apiaryId: 'apiary-1', colonyId: 'A-02', score: 64 },
  { month: 4, apiaryId: 'apiary-2', colonyId: 'B-01', score: 66 },
  // 2026年5月
  { month: 5, apiaryId: 'apiary-1', colonyId: 'A-01', score: 80 },
  { month: 5, apiaryId: 'apiary-1', colonyId: 'A-02', score: 76 },
  { month: 5, apiaryId: 'apiary-2', colonyId: 'B-01', score: 78 },
  // 2026年6月
  { month: 6, apiaryId: 'apiary-1', colonyId: 'A-01', score: 77 },
  { month: 6, apiaryId: 'apiary-1', colonyId: 'A-02', score: 73 },
  { month: 6, apiaryId: 'apiary-2', colonyId: 'B-01', score: 75 },
  // 2026年7月
  { month: 7, apiaryId: 'apiary-1', colonyId: 'A-01', score: 81 },
  { month: 7, apiaryId: 'apiary-1', colonyId: 'A-02', score: 78 },
  { month: 7, apiaryId: 'apiary-2', colonyId: 'B-01', score: 78 },
  // 2026年8月
  { month: 8, apiaryId: 'apiary-1', colonyId: 'A-01', score: 75 },
  { month: 8, apiaryId: 'apiary-1', colonyId: 'A-02', score: 72 },
  { month: 8, apiaryId: 'apiary-2', colonyId: 'B-01', score: 72 },
  // 2026年9月
  { month: 9, apiaryId: 'apiary-1', colonyId: 'A-01', score: 78 },
  { month: 9, apiaryId: 'apiary-1', colonyId: 'A-02', score: 74 },
  { month: 9, apiaryId: 'apiary-2', colonyId: 'B-01', score: 76 },
]
