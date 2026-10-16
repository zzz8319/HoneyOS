import { test, expect } from '@playwright/test'
import { injectMockHoneyDB } from './helpers/mockHoneyDB'

const STATES = [
  'normal',
  'calendar-view',
  'empty',
  'loading',
  'error',
  'offline',
  'offline-no-cache',
  'completed-expanded',
  'overdue-filtered',
  'updating-completion',
] as const

test.beforeEach(async ({ page }) => {
  await injectMockHoneyDB(page)
})

for (const state of STATES) {
  test(`SCR-024 work-list ${state}`, async ({ page }) => {
    await page.goto(`/?screen=work&state=${state}&devbar=0`)
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(page).toHaveScreenshot(`scr-024-${state}.png`)
  })
}
