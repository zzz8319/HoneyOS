import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5174'
const SCREEN = 'frame-viewer'

const STATES = [
  'normal',
  'frame-selected',
  'deselected',
  'other-stage',
  'history',
  'loading',
  'empty',
  'error',
  'offline',
] as const

for (const state of STATES) {
  test(`SCR-013 ${state}`, async ({ page }) => {
    await page.goto(`${BASE}/?screen=${SCREEN}&state=${state}&devbar=0`)
    await page.waitForLoadState('networkidle')

    if (state !== 'loading') {
      await page.waitForTimeout(100)
    }

    await expect(page).toHaveScreenshot(`scr-013-${state}.png`, {
      fullPage: false,
    })
  })
}
