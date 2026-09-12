import { test, expect } from '@playwright/test'

const STATES = [
  'normal',
  'multi-stage',
  'unsaved',
  'saved',
  'draft-restore',
  'save-error',
  'offline',
] as const

for (const state of STATES) {
  test(`SCR-012 inspection-record ${state}`, async ({ page }) => {
    await page.goto(`/?screen=inspection-record&state=${state}&devbar=0`)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot(`scr-012-${state}.png`)
  })
}
