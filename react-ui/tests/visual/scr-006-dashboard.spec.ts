import { expect, test } from '@playwright/test'

const STATES = ['normal', 'empty', 'loading', 'error', 'offline'] as const

for (const state of STATES) {
  test(`SCR-006 dashboard — ${state} state`, async ({ page }) => {
    await page.goto('/')
    // 状態切り替えバーのボタンをクリック
    const label =
      state === 'normal'  ? '通常'   :
      state === 'empty'   ? '空'     :
      state === 'loading' ? '読込'   :
      state === 'error'   ? 'エラー' :
      'オフライン'
    await page.getByRole('button', { name: label }).click()
    // スケルトンアニメが止まるまで少し待つ
    if (state === 'loading') {
      await page.waitForTimeout(200)
    }
    await expect(page).toHaveScreenshot(`scr-006-${state}.png`, {
      fullPage: true,
      animations: 'disabled',
    })
  })
}
