import { test, expect } from '@playwright/test'

const STATES = [
  'normal',
  'healthy',
  'first-inspection',
  'ai-analyzed',
  'reminder-off',
  'loading',
  'error',
  'offline',
  'missing-record',
] as const

for (const state of STATES) {
  test(`SCR-015 inspection-complete ${state}`, async ({ page }) => {
    await page.goto(`/?screen=inspection-complete&state=${state}&devbar=0`)
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(page).toHaveScreenshot(`scr-015-${state}.png`)
  })
}

test('SCR-015 inspection-complete normal scrolled-to-bottom', async ({ page }) => {
  await page.goto('/?screen=inspection-complete&state=normal&devbar=0')
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => {
    document.documentElement.scrollTop = 99999
    const el = document.querySelector('[class*="screen"]') as HTMLElement | null
    if (el) el.scrollTop = 99999
  })
  await page.waitForTimeout(200)
  await expect(page).toHaveScreenshot('scr-015-normal-scrolled-bottom.png')
})
