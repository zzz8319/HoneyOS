import { expect, test } from '@playwright/test'
import { injectMockHoneyDB } from './helpers/mockHoneyDB'

/**
 * SCR-006 baseline shows "今週 9/1 - 9/7", 採蜜 12.4kg ↑12%, 作業 6件.
 * Sep 1, 2026 is a Tuesday, so "9/1 - 9/7" requires 2024 dates (Sep 1, 2024 is Sunday).
 * Mock Date to 2024-09-08 JST so buildWeeklyStats() → weekStart = Sep 1, 2024.
 *
 * Work records designed to reproduce baseline stats:
 *   thisWeek (9/1–9/7): 1 harvest 12.4kg + 5 other = 6件, 0 prevDiff
 *   prevWeek (8/25–8/31): 1 harvest 11.1kg + 5 other = 6件 → honeyPrevPct = ↑12%
 *   history bars: 8/11=6.0kg, 8/18=8.5kg, 8/25=11.1kg, 9/1=12.4kg
 * Note: old mockData showed 8/25 bar at 10.8kg which yields +15% (inconsistent with
 * hardcoded +12%); 11.1kg is the value that actually reproduces +12%.
 */
const DASHBOARD_WR_OVERRIDE = `
;(function() {
  const OrigDate = Date
  const FIXED_MS = new OrigDate('2024-09-08T00:00:00+09:00').getTime()
  class MockDate extends OrigDate {
    constructor(...args) {
      if (args.length === 0) { super(FIXED_MS) } else { super(...args) }
    }
    static now() { return FIXED_MS }
  }
  Object.defineProperty(window, 'Date', { value: MockDate, writable: true, configurable: true })
})()
window.HoneyDB.loadWorkRecords = async () => [
  // thisWeek (2024-09-01 - 2024-09-07): 1 harvest + 5 other = 6件
  { id: 'tw1', type: 'harvest',   colony: 'a1', colonyIds: ['a1','a2'], date: '2024-09-05', time: '14:20', yieldKg: 12.4, harvestMethod: '遠心分離' },
  { id: 'tw2', type: 'feeding',   colony: 'b1', colonyIds: ['b1'],      date: '2024-09-06', time: '10:30', feedType: '砂糖水', feedAmount: 1.0 },
  { id: 'tw3', type: 'treatment', colony: 'a3', colonyIds: ['a3','a4'], date: '2024-09-04', time: '09:15', medicationName: 'アピバール' },
  { id: 'tw4', type: 'swarming',  colony: 'a5', colonyIds: ['a5'],      date: '2024-09-03', time: '11:20' },
  { id: 'tw5', type: 'wintering', colony: '',   colonyIds: [],          date: '2024-09-02', time: '16:40' },
  { id: 'tw6', type: 'feeding',   colony: 'a2', colonyIds: ['a2'],      date: '2024-09-01', time: '08:00', feedType: '花粉パテ', feedAmount: 0.5 },
  // prevWeek (2024-08-25 - 2024-08-31): 1 harvest 11.1kg + 5 other = 6件 → workPrevDiff=0, honeyPrevPct=+12%
  { id: 'pw1', type: 'harvest',   colony: 'a1', colonyIds: ['a1','a2'], date: '2024-08-28', time: '10:00', yieldKg: 11.1, harvestMethod: '遠心分離' },
  { id: 'pw2', type: 'feeding',   colony: 'b1', colonyIds: ['b1'],      date: '2024-08-29', time: '09:00', feedType: '砂糖水', feedAmount: 0.8 },
  { id: 'pw3', type: 'treatment', colony: 'a4', colonyIds: ['a4'],      date: '2024-08-27', time: '14:00', medicationName: 'アピバール' },
  { id: 'pw4', type: 'swarming',  colony: 'a3', colonyIds: ['a3'],      date: '2024-08-26', time: '10:30' },
  { id: 'pw5', type: 'wintering', colony: '',   colonyIds: [],          date: '2024-08-25', time: '15:00' },
  { id: 'pw6', type: 'feeding',   colony: 'a5', colonyIds: ['a5'],      date: '2024-08-30', time: '08:30', feedType: '花粉パテ', feedAmount: 0.4 },
  // history bars: 8/18=8.5kg, 8/11=6.0kg
  { id: 'hw2', type: 'harvest',   colony: 'a1', colonyIds: ['a1','a2'], date: '2024-08-20', time: '11:00', yieldKg: 8.5, harvestMethod: '遠心分離' },
  { id: 'hw1', type: 'harvest',   colony: 'a1', colonyIds: ['a1','a2'], date: '2024-08-13', time: '13:00', yieldKg: 6.0, harvestMethod: '遠心分離' },
];
`

const STATES = ['normal', 'empty', 'loading', 'error', 'offline'] as const

for (const state of STATES) {
  test(`SCR-006 dashboard — ${state} state`, async ({ page }) => {
    await injectMockHoneyDB(page, DASHBOARD_WR_OVERRIDE)
    await page.goto('/')
    const label =
      state === 'normal'  ? '通常'   :
      state === 'empty'   ? '空'     :
      state === 'loading' ? '読込'   :
      state === 'error'   ? 'エラー' :
      'オフライン'
    await page.getByRole('button', { name: label }).click()
    if (state === 'loading') {
      await page.waitForTimeout(200)
    }
    // viewport内（fixed BottomNav + FAB が正しく重なった状態）でキャプチャ
    await expect(page).toHaveScreenshot(`scr-006-${state}.png`, {
      fullPage: false,
      animations: 'disabled',
    })
  })
}

// 通常状態でスクロール下端（今週カード）を確認
test('SCR-006 dashboard — normal state scrolled bottom', async ({ page }) => {
  await injectMockHoneyDB(page, DASHBOARD_WR_OVERRIDE)
  await page.goto('/')
  await page.getByRole('button', { name: '通常' }).click()
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight }))
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('scr-006-normal-scrolled.png', {
    fullPage: false,
    animations: 'disabled',
  })
})
