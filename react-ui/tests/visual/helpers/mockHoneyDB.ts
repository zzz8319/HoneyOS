/**
 * Shared window.HoneyDB mock injection for Playwright visual tests.
 *
 * All 8 data-loading screens call loadFarms / loadColonies / loadInspRecords
 * and sometimes loadWorkRecords.  This helper injects a complete mock via
 * page.addInitScript() so that screens render the "normal" state with fixture
 * data instead of falling through to the error state when HoneyDB is absent.
 */
import type { Page } from '@playwright/test'

/** Raw farms in HoneyDB format */
const MOCK_FARMS = [
  { id: 'f1', name: '宮田養蜂場' },
  { id: 'f2', name: '田中養蜂場' },
  { id: 'f3', name: '川東養蜂場' },
]

/** Raw colonies in HoneyDB format */
const MOCK_COLONIES = [
  { id: 'a1', name: 'A-01', farmId: 'f1' },
  { id: 'a2', name: 'A-02', farmId: 'f1' },
  { id: 'a3', name: 'A-03', farmId: 'f1' },
  { id: 'a4', name: 'A-04', farmId: 'f1' },
  { id: 'a5', name: 'A-05', farmId: 'f1' },
  { id: 'b1', name: 'B-01', farmId: 'f3' },
  { id: 'b2', name: 'B-02', farmId: 'f2' },
  { id: 'c1', name: 'C-01', farmId: 'f2' },
]

/** Raw inspection records in HoneyDB format – 2 per colony for delta
 *  bee/brood values chosen so strength = round(bee*0.6 + brood*0.4) matches
 *  the comparison-screen spec: a1→79, b1→70, a5→65, a3→35 (refDate 2026-09-08)
 *  and a1→73, b1→63 (refDate 2026-08-31).
 */
const MOCK_INSP_RECORDS = [
  // a1: latest 2026-09-05 strength=79 (bee=79,brood=79), prev 2026-08-27 strength=73
  { id: 'ir1',  colony: 'a1', date: '2026-09-05', frames: [{ bee: 79, brood: 79, honey: 15 }] },
  { id: 'ir2',  colony: 'a1', date: '2026-08-27', frames: [{ bee: 73, brood: 73, honey: 18 }] },
  // a2: any reasonable values
  { id: 'ir3',  colony: 'a2', date: '2026-09-06', frames: [{ bee: 60, brood: 60, honey: 20 }] },
  { id: 'ir4',  colony: 'a2', date: '2026-08-31', frames: [{ bee: 55, brood: 55, honey: 22 }] },
  // a3: 2026-09-05 strength=35 (for comparison refDate 2026-09-08), 2026-08-28 strength=42 (tooltip test)
  { id: 'ir5',  colony: 'a3', date: '2026-09-05', frames: [{ bee: 35, brood: 35, honey: 10 }] },
  { id: 'ir6',  colony: 'a3', date: '2026-08-28', frames: [{ bee: 42, brood: 42, honey: 12 }] },
  // a4: any reasonable values
  { id: 'ir7',  colony: 'a4', date: '2026-09-04', frames: [{ bee: 50, brood: 50, honey: 15 }] },
  { id: 'ir8',  colony: 'a4', date: '2026-08-29', frames: [{ bee: 45, brood: 45, honey: 12 }] },
  // a5: latest 2026-08-23 strength=65, prev 2026-08-10 strength=55
  { id: 'ir9',  colony: 'a5', date: '2026-08-23', frames: [{ bee: 65, brood: 65, honey: 10 }] },
  { id: 'ir10', colony: 'a5', date: '2026-08-10', frames: [{ bee: 55, brood: 55, honey: 12 }] },
  // b1: latest 2026-09-03 strength=70, prev 2026-08-22 strength=63
  { id: 'ir11', colony: 'b1', date: '2026-09-03', frames: [{ bee: 70, brood: 70, honey: 20 }] },
  { id: 'ir12', colony: 'b1', date: '2026-08-22', frames: [{ bee: 63, brood: 63, honey: 18 }] },
  // b2: any reasonable values
  { id: 'ir13', colony: 'b2', date: '2026-09-01', frames: [{ bee: 58, brood: 58, honey: 25 }] },
  { id: 'ir14', colony: 'b2', date: '2026-08-26', frames: [{ bee: 52, brood: 52, honey: 28 }] },
  // c1: any reasonable values
  { id: 'ir15', colony: 'c1', date: '2026-08-31', frames: [{ bee: 55, brood: 55, honey: 18 }] },
  { id: 'ir16', colony: 'c1', date: '2026-08-25', frames: [{ bee: 50, brood: 50, honey: 20 }] },
]

/** Raw work records in HoneyDB format */
const MOCK_WORK_RECORDS = [
  { id: 'wr1', type: 'harvest',   colony: 'a1', colonyIds: ['a1', 'a2'], date: '2026-09-07', time: '14:20', yieldKg: 12.4, harvestMethod: '遠心分離' },
  { id: 'wr2', type: 'feeding',   colony: 'b1', colonyIds: ['b1'],       date: '2026-09-06', time: '10:30', memo: '群勢回復のため給餌。', feedType: '砂糖水', feedAmount: 1.0 },
  { id: 'wr3', type: 'treatment', colony: 'a3', colonyIds: ['a3', 'a4'], date: '2026-09-02', time: '09:15', medicationName: 'アピバール', nextTreatmentDate: '2026-09-16' },
  { id: 'wr4', type: 'swarming',  colony: 'a5', colonyIds: ['a5'],       date: '2026-08-28', time: '11:20' },
  { id: 'wr5', type: 'wintering', colony: '',   colonyIds: [],           date: '2026-08-20', time: '16:40' },
]

/**
 * Inject a complete window.HoneyDB mock that all data-loading screens can use.
 * Call this with page.addInitScript() before page.goto().
 */
export function getHoneyDBScript(overrides = ''): string {
  return `
// Fix "today" to 2026-09-20 JST so screens default to Sep 2026 regardless of wall clock
;(function() {
  const OrigDate = Date
  const FIXED_MS = new OrigDate('2026-09-20T00:00:00+09:00').getTime()
  class MockDate extends OrigDate {
    constructor(...args) {
      if (args.length === 0) { super(FIXED_MS) } else { super(...args) }
    }
    static now() { return FIXED_MS }
  }
  Object.defineProperty(window, 'Date', { value: MockDate, writable: true, configurable: true })
})()
window.HoneyDB = {
  loadFarms:               async () => ${JSON.stringify(MOCK_FARMS)},
  loadColonies:            async () => ${JSON.stringify(MOCK_COLONIES)},
  loadInspRecords:         async () => ${JSON.stringify(MOCK_INSP_RECORDS)},
  loadWorkRecords:         async () => ${JSON.stringify(MOCK_WORK_RECORDS)},
  saveWorkRecord:          async () => null,
  updateWorkRecord:        async () => {},
  deleteWorkRecord:        async () => {},
  saveFarm:                async () => {},
  archiveFarm:             async () => {},
  deleteFarm:              async () => {},
  saveColony:              async () => {},
  archiveColony:           async () => {},
  deleteColony:            async () => {},
  initDefaultColonies:     async () => {},
  loadTasks:               async () => [],
  getTasks:                async () => [],
  saveTask:                async () => null,
  updateTask:              async () => {},
  completeTask:            async () => {},
  deleteTask:              async () => {},
  saveInspRecord:          async () => null,
  updateInspRecord:        async () => {},
  deleteInspRecord:        async () => {},
  getSession:              async () => ({ user: { id: 'user-1', email: 'test@example.com' } }),
  getUserProfile:          async () => ({ name: 'テスト太郎', farm_name: '宮田養蜂場' }),
  getNotificationSettings: async () => null,
  getUserPreferences:      async () => null,
  updateUserPreferences:   async () => {},
  updateNotificationSettings: async () => {},
  updateProfile:           async () => {},
  signOut:                 async () => {},
  exportAllData:           async () => ({ exportedAt: '', profile: null, inspRecords: [], workRecords: [], tasks: [] }),
  savePushSubscription:    async () => {},
  deletePushSubscription:  async () => {},
  subscribeRealtime:       () => {},
  unsubscribeRealtime:     () => {},
  upsertBenchmark:         async () => {},
  loadBenchmarkStats:      async () => null,
  resetPassword:           async () => {},
};
${overrides}
`
}

/** Convenience: call page.addInitScript with the standard mock before page.goto(). */
export async function injectMockHoneyDB(page: Page, overrides?: string): Promise<void> {
  await page.addInitScript(getHoneyDBScript(overrides ?? ''))
}
