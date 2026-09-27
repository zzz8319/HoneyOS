import { test, expect } from '@playwright/test'

const BASE_STATES = [
  'normal',
  'none-selected',
  'multi-selected',
  'loading',
  'context-missing',
  'error',
  'offline',
  'offline-no-cache',
  'creating-tasks',
] as const

for (const state of BASE_STATES) {
  test(`SCR-023 recommended-work ${state}`, async ({ page }) => {
    await page.goto(`/?screen=recommended-work&state=${state}&devbar=0`)
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(page).toHaveScreenshot(`scr-023-${state}.png`)
  })
}
