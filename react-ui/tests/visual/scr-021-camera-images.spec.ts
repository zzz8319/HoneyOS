import { test, expect } from '@playwright/test'

const STATES = [
  'normal',
  'none-selected',
  'inspection-tab',
  'auto-capture-tab',
  'empty',
  'loading',
  'error',
  'offline',
  'upload-error',
  'camera-permission-denied',
  'context-missing',
] as const

for (const state of STATES) {
  test(`SCR-021 camera-images ${state}`, async ({ page }) => {
    await page.goto(`/?screen=camera-images&state=${state}&devbar=0`)
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(page).toHaveScreenshot(`scr-021-${state}.png`)
  })
}
