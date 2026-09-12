import { expect, test, type Page } from '@playwright/test'

const STATES = ['normal', 'selected', 'empty', 'loading', 'error', 'offline'] as const

async function gotoInspectionStart(
  page: Page,
  state: typeof STATES[number],
  extraParams = '',
) {
  await page.goto(
    `/?screen=inspection-start&state=${state}&devbar=0${extraParams}`,
    { waitUntil: 'networkidle' },
  )
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
}

for (const state of STATES) {
  test(`SCR-011 inspection start — ${state} state`, async ({ page }) => {
    await gotoInspectionStart(page, state)
    await expect(page).toHaveScreenshot(`scr-011-${state}.png`, {
      fullPage: false,
      animations: 'disabled',
    })
  })
}
