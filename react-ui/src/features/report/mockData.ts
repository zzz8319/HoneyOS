// [DEV FIXTURE] — replace with window.HoneyDB calls before production
import type { ReportRecord, ReportApiary, ReportColony, StrengthEntry } from './types'

export const REPORT_APIARIES: ReportApiary[] = [
  { id: 'apiary-1', name: '宮田養蜂場' },
  { id: 'apiary-2', name: '田中養蜂場' },
]

// apiary-1: 15 colonies → Sep 12/15=80%, Aug 11/15=74%
// apiary-2: 3 colonies  → Sep 3/3=100%, Aug 3/3=100%
// Total: 18 colonies    → Sep 15/18=84%, Aug 14/18=78%, diff=6pp ✓
export const REPORT_COLONIES: ReportColony[] = [
  { id: 'A-01', name: 'A-01', apiaryId: 'apiary-1' },
  { id: 'A-02', name: 'A-02', apiaryId: 'apiary-1' },
  { id: 'A-03', name: 'A-03', apiaryId: 'apiary-1' },
  { id: 'A-04', name: 'A-04', apiaryId: 'apiary-1' },
  { id: 'A-05', name: 'A-05', apiaryId: 'apiary-1' },
  { id: 'A-06', name: 'A-06', apiaryId: 'apiary-1' },
  { id: 'A-07', name: 'A-07', apiaryId: 'apiary-1' },
  { id: 'A-08', name: 'A-08', apiaryId: 'apiary-1' },
  { id: 'A-09', name: 'A-09', apiaryId: 'apiary-1' },
  { id: 'A-10', name: 'A-10', apiaryId: 'apiary-1' },
  { id: 'A-11', name: 'A-11', apiaryId: 'apiary-1' },
  { id: 'A-12', name: 'A-12', apiaryId: 'apiary-1' },
  { id: 'A-13', name: 'A-13', apiaryId: 'apiary-1' },
  { id: 'A-14', name: 'A-14', apiaryId: 'apiary-1' },
  { id: 'A-15', name: 'A-15', apiaryId: 'apiary-1' },
  { id: 'B-01', name: 'B-01', apiaryId: 'apiary-2' },
  { id: 'B-02', name: 'B-02', apiaryId: 'apiary-2' },
  { id: 'B-03', name: 'B-03', apiaryId: 'apiary-2' },
]

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
  // 14/18 total inspected → Math.ceil(77.78)=78% → Sep-Aug pp=84-78=6 ✓
  { id: 'rr-0801', workType: 'harvest',   performedDate: '2026-08-07', apiaryId: 'apiary-1', colonyIds: ['A-01', 'A-02'], harvestAmountKg: 19.0 },
  { id: 'rr-0802', workType: 'harvest',   performedDate: '2026-08-18', apiaryId: 'apiary-2', colonyIds: ['B-01'], harvestAmountKg: 19.0 },
  { id: 'rr-0803', workType: 'feeding',   performedDate: '2026-08-12', apiaryId: 'apiary-1', colonyIds: ['A-03'] },
  { id: 'rr-0804', workType: 'swarming',  performedDate: '2026-08-28', apiaryId: 'apiary-1', colonyIds: ['A-05'] },
  { id: 'rr-0805', workType: 'wintering', performedDate: '2026-08-20', apiaryId: 'apiary-1', colonyIds: [] },
  // apiary-1: 11/15 inspected → Math.ceil(73.33)=74%
  { id: 'rr-0806', workType: 'inspection',performedDate: '2026-08-10', apiaryId: 'apiary-1',
    colonyIds: ['A-01','A-02','A-03','A-04','A-05','A-06','A-07','A-08','A-09','A-10','A-11'],
    hasInspection: true },
  // apiary-2: 3/3 inspected → 100%
  { id: 'rr-0807', workType: 'inspection',performedDate: '2026-08-10', apiaryId: 'apiary-2',
    colonyIds: ['B-01','B-02','B-03'], hasInspection: true },

  // ── 2026年9月 (target month) ──
  // harvest: 4件 = 42.6 kg total → ↑12% vs Aug 38.0 kg
  // apiary-1: 12.4+10.2+8.5=31.1 kg (宮田養蜂場) / apiary-2: 11.5 kg (田中養蜂場)
  { id: 'rr-0901', workType: 'harvest',   performedDate: '2026-09-07', apiaryId: 'apiary-1', colonyIds: ['A-01', 'A-02'], harvestAmountKg: 12.4 },
  { id: 'rr-0902', workType: 'harvest',   performedDate: '2026-09-10', apiaryId: 'apiary-1', colonyIds: ['A-03'], harvestAmountKg: 10.2 },
  { id: 'rr-0903', workType: 'harvest',   performedDate: '2026-09-14', apiaryId: 'apiary-2', colonyIds: ['B-01'], harvestAmountKg: 11.5 },
  { id: 'rr-0904', workType: 'harvest',   performedDate: '2026-09-20', apiaryId: 'apiary-1', colonyIds: ['A-04'], harvestAmountKg: 8.5 },
  // feeding: 7件
  { id: 'rr-0905', workType: 'feeding',   performedDate: '2026-09-06', apiaryId: 'apiary-1', colonyIds: ['B-01'], isAiAlert: true },
  { id: 'rr-0906', workType: 'feeding',   performedDate: '2026-09-08', apiaryId: 'apiary-1', colonyIds: ['A-03'] },
  { id: 'rr-0907', workType: 'feeding',   performedDate: '2026-09-09', apiaryId: 'apiary-1', colonyIds: ['A-04'] },
  { id: 'rr-0908', workType: 'feeding',   performedDate: '2026-09-11', apiaryId: 'apiary-2', colonyIds: ['B-01'] },
  { id: 'rr-0909', workType: 'feeding',   performedDate: '2026-09-12', apiaryId: 'apiary-1', colonyIds: ['A-05'] },
  { id: 'rr-0910', workType: 'feeding',   performedDate: '2026-09-13', apiaryId: 'apiary-1', colonyIds: ['A-01'] },
  { id: 'rr-0911', workType: 'feeding',   performedDate: '2026-09-15', apiaryId: 'apiary-1', colonyIds: ['A-02'] },
  // treatment: 2件
  { id: 'rr-0912', workType: 'treatment', performedDate: '2026-09-02', apiaryId: 'apiary-1', colonyIds: ['A-04'], isAiAlert: true },
  // apiary-2: B-01+B-02+B-03 inspected via this treatment record → 3/3=100%
  { id: 'rr-0913', workType: 'treatment', performedDate: '2026-09-16', apiaryId: 'apiary-2',
    colonyIds: ['B-01','B-02','B-03'], isAiAlert: true, hasInspection: true },
  // other: 5件
  { id: 'rr-0914', workType: 'swarming',  performedDate: '2026-09-03', apiaryId: 'apiary-1', colonyIds: ['A-05'] },
  { id: 'rr-0915', workType: 'wintering', performedDate: '2026-09-04', apiaryId: 'apiary-1', colonyIds: [] },
  // apiary-1: 12/15 inspected → Math.ceil(80)=80%
  // A-01,A-06,A-07,A-08 + A-02,A-09,A-10 + A-03,A-04,A-05,A-11,A-12 = 12 unique
  { id: 'rr-0916', workType: 'inspection',performedDate: '2026-09-05', apiaryId: 'apiary-1',
    colonyIds: ['A-01','A-06','A-07','A-08'], hasInspection: true },
  { id: 'rr-0917', workType: 'inspection',performedDate: '2026-09-05', apiaryId: 'apiary-1',
    colonyIds: ['A-02','A-09','A-10'], hasInspection: true },
  { id: 'rr-0918', workType: 'inspection',performedDate: '2026-09-05', apiaryId: 'apiary-1',
    colonyIds: ['A-03','A-04','A-05','A-11','A-12'], hasInspection: true },
]

// Monthly strength scores per colony (reuses same definition as ColonyDetail)
// strengthScore: 0-100, threshold 60 = warning level
// Only A-01, A-02, B-01 have strength tracking entries.
// Scores adjusted so:
//   apiary-1 year avg (A-01+A-02, months 1-9): 662/9 = 73.56 → Math.round = 74
//   overall year avg (A-01+A-02+B-01, months 1-9): 670/9 = 74.44 → Math.round = 74
export const STRENGTH_ENTRIES: StrengthEntry[] = [
  // 2026年1月 — apiary-1 avg: (72+66)/2=69; overall: (72+66+65)/3=68
  { month: 1, apiaryId: 'apiary-1', colonyId: 'A-01', score: 72 },
  { month: 1, apiaryId: 'apiary-1', colonyId: 'A-02', score: 66 },
  { month: 1, apiaryId: 'apiary-2', colonyId: 'B-01', score: 65 },
  // 2026年2月 — apiary-1 avg: (78+72)/2=75; overall: (78+72+78)/3=76
  { month: 2, apiaryId: 'apiary-1', colonyId: 'A-01', score: 78 },
  { month: 2, apiaryId: 'apiary-1', colonyId: 'A-02', score: 72 },
  { month: 2, apiaryId: 'apiary-2', colonyId: 'B-01', score: 78 },
  // 2026年3月 — apiary-1 avg: (72+66)/2=69; overall: (72+66+75)/3=71
  { month: 3, apiaryId: 'apiary-1', colonyId: 'A-01', score: 72 },
  { month: 3, apiaryId: 'apiary-1', colonyId: 'A-02', score: 66 },
  { month: 3, apiaryId: 'apiary-2', colonyId: 'B-01', score: 75 },
  // 2026年4月 — apiary-1 avg: (66+68)/2=67; overall: (66+68+72)/3=69
  { month: 4, apiaryId: 'apiary-1', colonyId: 'A-01', score: 66 },
  { month: 4, apiaryId: 'apiary-1', colonyId: 'A-02', score: 68 },
  { month: 4, apiaryId: 'apiary-2', colonyId: 'B-01', score: 72 },
  // 2026年5月 — apiary-1 avg: (80+76)/2=78; overall: (80+76+78)/3=78
  { month: 5, apiaryId: 'apiary-1', colonyId: 'A-01', score: 80 },
  { month: 5, apiaryId: 'apiary-1', colonyId: 'A-02', score: 76 },
  { month: 5, apiaryId: 'apiary-2', colonyId: 'B-01', score: 78 },
  // 2026年6月 — apiary-1 avg: (77+73)/2=75; overall: (77+73+81)/3=77
  { month: 6, apiaryId: 'apiary-1', colonyId: 'A-01', score: 77 },
  { month: 6, apiaryId: 'apiary-1', colonyId: 'A-02', score: 73 },
  { month: 6, apiaryId: 'apiary-2', colonyId: 'B-01', score: 81 },
  // 2026年7月 — apiary-1 avg: (84+80)/2=82; overall: (84+80+82)/3=82
  { month: 7, apiaryId: 'apiary-1', colonyId: 'A-01', score: 84 },
  { month: 7, apiaryId: 'apiary-1', colonyId: 'A-02', score: 80 },
  { month: 7, apiaryId: 'apiary-2', colonyId: 'B-01', score: 82 },
  // 2026年8月 — apiary-1 avg: (75+72)/2=73.5→74; overall: (75+72+78)/3=75
  { month: 8, apiaryId: 'apiary-1', colonyId: 'A-01', score: 75 },
  { month: 8, apiaryId: 'apiary-1', colonyId: 'A-02', score: 72 },
  { month: 8, apiaryId: 'apiary-2', colonyId: 'B-01', score: 78 },
  // 2026年9月 — apiary-1 avg: (74+72)/2=73; overall: (74+72+76)/3=74
  // apiary-1 year sum: 69+75+69+67+78+75+82+74+73=662 → 662/9=73.56 → 74 ✓
  // overall year sum: 68+76+71+69+78+77+82+75+74=670 → 670/9=74.44 → 74 ✓
  { month: 9, apiaryId: 'apiary-1', colonyId: 'A-01', score: 74 },
  { month: 9, apiaryId: 'apiary-1', colonyId: 'A-02', score: 72 },
  { month: 9, apiaryId: 'apiary-2', colonyId: 'B-01', score: 76 },
]
