import { expect, test } from '@playwright/test'

const STATES = ['normal', 'empty', 'loading', 'error', 'offline'] as const

for (const state of STATES) {
  test(`SCR-006 dashboard — ${state} state`, async ({ page }) => {
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
  await page.goto('/')
  await page.getByRole('button', { name: '通常' }).click()
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight }))
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('scr-006-normal-scrolled.png', {
    fullPage: false,
    animations: 'disabled',
  })
})
