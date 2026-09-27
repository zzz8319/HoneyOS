import { expect, test, type Page } from '@playwright/test'

const STATES = ['normal', 'empty', 'loading', 'error', 'offline'] as const

// Freeze time so relative dates ("X日前") are deterministic across runs
const FIXED_NOW = new Date('2026-09-20T00:00:00+09:00')

async function gotoColonyList(page: Page, state: typeof STATES[number]) {
  await page.clock.install({ time: FIXED_NOW })
  // URLパラメータで状態を指定し、devbarを使わない
  await page.goto(`/?tab=farms&state=${state}&devbar=0`, { waitUntil: 'networkidle' })
  await page.evaluate(() => window.scrollTo(0, 0))
  // scrollY === 0 を確認
  const scrollY = await page.evaluate(() => window.scrollY)
  if (scrollY !== 0) throw new Error(`Expected scrollY=0, got ${scrollY}`)
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
