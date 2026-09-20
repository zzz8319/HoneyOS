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

  // CTAは position:fixed のため常にviewport内に表示される（scrollY は0のまま）
  const quickLinks = page.getByTestId('quick-links')
  const cta        = page.getByTestId('inspection-start-cta')

  // CTA・クイック導線が存在し、表示・操作可能であることを確認
  await expect(cta).toBeVisible()
  await expect(cta.getByRole('button')).toBeEnabled()
  await expect(quickLinks).toBeVisible()

  // クイック導線の下端がCTA上端以下であること（重なりなし）
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
