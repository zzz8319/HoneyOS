import { test, expect } from '@playwright/test'

const BASE_STATES = [
  'normal',
  'loading',
  'context-missing',
  'error',
  'offline',
  'offline-no-cache',
  'saving',
] as const

for (const state of BASE_STATES) {
  test(`SCR-022 ai-diagnosis ${state}`, async ({ page }) => {
    await page.goto(`/?screen=ai-diagnosis&state=${state}&devbar=0`)
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(page).toHaveScreenshot(`scr-022-${state}.png`)
  })
}

test('SCR-022 ai-diagnosis normal-detail-open', async ({ page }) => {
  await page.goto('/?screen=ai-diagnosis&state=normal&modal=detail&devbar=0')
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(page).toHaveScreenshot('scr-022-normal-detail-open.png')
})

test('SCR-022 ai-diagnosis normal-image-expanded', async ({ page }) => {
  await page.goto('/?screen=ai-diagnosis&state=normal&modal=image&devbar=0')
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(page).toHaveScreenshot('scr-022-normal-image-expanded.png')
})
