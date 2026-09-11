import { expect, test, type Page } from '@playwright/test'

const STATES = ['normal', 'empty', 'loading', 'error', 'offline'] as const

async function gotoColonyDetail(
  page: Page,
  state: typeof STATES[number],
  extraParams = '',
) {
  await page.goto(
    `/?screen=colony-detail&colonyId=a3&state=${state}&devbar=0${extraParams}`,
    { waitUntil: 'networkidle' },
  )
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
}

for (const state of STATES) {
  test(`SCR-009 colony detail — ${state} state`, async ({ page }) => {
    await gotoColonyDetail(page, state)
    await expect(page).toHaveScreenshot(`scr-009-${state}.png`, {
      fullPage: false,
      animations: 'disabled',
    })
  })
}

test('SCR-009 colony detail — normal-popover state', async ({ page }) => {
  await gotoColonyDetail(page, 'normal', '&popover=1')
  await expect(page).toHaveScreenshot('scr-009-normal-popover.png', {
    fullPage: false,
    animations: 'disabled',
  })
})
