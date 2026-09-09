import { expect, test, type Page } from '@playwright/test'

const STATES = ['normal', 'empty', 'loading', 'error', 'offline'] as const

async function gotoColonyList(page: Page, state: typeof STATES[number]) {
  await page.goto('/')
  // 養蜂場タブをクリック（BottomNav の button）
  await page.getByRole('button', { name: '養蜂場' }).click()
  await page.waitForTimeout(100)

  if (state !== 'normal') {
    const label =
      state === 'empty'   ? '空' :
      state === 'loading' ? '読込' :
      state === 'error'   ? 'エラー' :
      'オフライン'
    await page.getByRole('button', { name: label }).click()
    await page.waitForTimeout(100)
  }
}

for (const state of STATES) {
  test(`SCR-008 colony list — ${state} state`, async ({ page }) => {
    await gotoColonyList(page, state)

    await expect(page).toHaveScreenshot(`scr-008-${state}.png`, {
      fullPage: false,
      animations: 'disabled',
    })
  })
}

test('SCR-008 colony list — normal state scrolled', async ({ page }) => {
  await gotoColonyList(page, 'normal')
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight }))
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('scr-008-normal-scrolled.png', {
    fullPage: false,
    animations: 'disabled',
  })
})
