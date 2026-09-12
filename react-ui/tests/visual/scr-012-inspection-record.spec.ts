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

test('SCR-012 inspection-record normal scrolled-to-bottom', async ({ page }) => {
  await page.goto('/?screen=inspection-record&state=normal&devbar=0')
  await page.waitForLoadState('networkidle')
  // Scroll the main content area to bottom
  await page.evaluate(() => {
    const main = document.querySelector('main')
    if (main) main.scrollTop = 99999
  })
  await page.waitForTimeout(200)
  await expect(page).toHaveScreenshot('scr-012-normal-scrolled-bottom.png')
})
