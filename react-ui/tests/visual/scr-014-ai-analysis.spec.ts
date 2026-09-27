import { test, expect } from '@playwright/test'

const STATES = [
  'normal',
  'no-images',
  'max-images',
  'targets-empty',
  'loading-inspection',
  'data-missing',
  'context-missing',
  'offline',
  'request-pending',
  'request-error',
  'camera-permission-denied',
] as const

for (const state of STATES) {
  test(`SCR-014 ai-analysis ${state}`, async ({ page }) => {
    await page.goto(`/?screen=ai-analysis&state=${state}&devbar=0`)
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(page).toHaveScreenshot(`scr-014-${state}.png`)
  })
}
