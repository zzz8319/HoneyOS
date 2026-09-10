import { expect, test, type Page } from '@playwright/test'

const STATES = ['normal', 'empty', 'loading', 'error', 'offline'] as const

async function gotoColonyDetail(page: Page, state: typeof STATES[number]) {
  await page.goto(`/?screen=colony-detail&colonyId=a3&state=${state}&devbar=0`, {
    waitUntil: 'networkidle',
  })
  await page.evaluate(() => window.scrollTo(0, 0))
  const scrollY = await page.evaluate(() => window.scrollY)
  if (scrollY !== 0) throw new Error(`Expected scrollY=0, got ${scrollY}`)
}

for (const state of STATES) {
  test(`SCR-009 colony detail — ${state} state`, async ({ page }) => {
    await gotoColonyDetail(page, state)
    await expect(page).toHaveScreenshot(`scr-009-${state}.png`, {
      fullPage: false,
      animations: 'disabled',
    })
  })
}

test('SCR-009 colony detail — normal state scrolled', async ({ page }) => {
  await gotoColonyDetail(page, 'normal')
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight }))
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('scr-009-normal-scrolled.png', {
    fullPage: false,
    animations: 'disabled',
  })
})
