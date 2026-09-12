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

test('SCR-009 colony detail — normal-bottom (CTA overlap check)', async ({ page }) => {
  await gotoColonyDetail(page, 'normal')

  // 最下部までスクロール
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)

  // 座標検証: クイック導線の下端 ≤ CTA上端
  const quickLinks = page.getByTestId('quick-links')
  const cta        = page.getByTestId('inspection-start-cta')
  const quickLinksBox = await quickLinks.boundingBox()
  const ctaBox        = await cta.boundingBox()

  expect(quickLinksBox).not.toBeNull()
  expect(ctaBox).not.toBeNull()
  expect(quickLinksBox!.y + quickLinksBox!.height).toBeLessThanOrEqual(ctaBox!.y)

  await expect(page).toHaveScreenshot('scr-009-normal-bottom.png', {
    fullPage: false,
    animations: 'disabled',
  })
})
