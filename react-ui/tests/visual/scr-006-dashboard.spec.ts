import { expect, test } from '@playwright/test'
import { injectMockHoneyDB } from './helpers/mockHoneyDB'

/**
 * Extra harvest record in the current UTC week (Sun 2026-09-13 – Sat 2026-09-19)
 * so buildWeeklyStats() shows non-zero harvest in the dashboard weekly card.
 * Not in the shared fixture to avoid affecting SCR-027/028 snapshots.
 */
const DASHBOARD_WR_OVERRIDE = `
window.HoneyDB.loadWorkRecords = async () => [
  { id: 'wr1', type: 'harvest',   colony: 'a1', colonyIds: ['a1','a2'], date: '2026-09-07', time: '14:20', yieldKg: 12.4, harvestMethod: '遠心分離' },
  { id: 'wr2', type: 'feeding',   colony: 'b1', colonyIds: ['b1'],      date: '2026-09-06', time: '10:30', memo: '群勢回復のため給餌。', feedType: '砂糖水', feedAmount: 1.0 },
  { id: 'wr3', type: 'treatment', colony: 'a3', colonyIds: ['a3','a4'], date: '2026-09-02', time: '09:15', medicationName: 'アピバール', nextTreatmentDate: '2026-09-16' },
  { id: 'wr4', type: 'swarming',  colony: 'a5', colonyIds: ['a5'],      date: '2026-08-28', time: '11:20' },
  { id: 'wr5', type: 'wintering', colony: '',   colonyIds: [],          date: '2026-08-20', time: '16:40' },
  { id: 'wr6', type: 'harvest',   colony: 'a1', colonyIds: ['a1','a2'], date: '2026-09-16', time: '09:00', yieldKg: 12.4, harvestMethod: '遠心分離' },
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
