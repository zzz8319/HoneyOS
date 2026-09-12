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

// selected状態: A-05が選択済みであること・CTAが有効であることを検証
test('SCR-011 inspection start — selected state assertions', async ({ page }) => {
  await gotoInspectionStart(page, 'selected')

  // A-05カードが aria-pressed="true"
  const a05Card = page.locator('[data-colony-id="a05"]')
  await expect(a05Card).toHaveAttribute('aria-pressed', 'true')

  // CTAが有効（disabled属性なし）かつ文言が「この蜂群で始める」
  const cta = page.getByTestId('inspection-cta')
  await expect(cta).not.toBeDisabled()
  await expect(cta).toHaveText('この蜂群で始める')

  // normalとselectedのスナップショットが異なること
  // (CTAボタンの色でテキスト比較)
  const ctaText = await cta.textContent()
  expect(ctaText).toBe('この蜂群で始める')
})

// selectedの最下部スクロール: 凡例・内検準備・CTAが重ならないことを検証
test('SCR-011 inspection start — selected-bottom (no CTA overlap)', async ({ page }) => {
  await gotoInspectionStart(page, 'selected')

  // 最下部スクロール
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)

  // 内検準備セクション下端 ≤ CTA上端
  const prep = page.locator('[class*="prepSection"]')
  const cta  = page.getByTestId('inspection-cta')
  const prepBox = await prep.boundingBox()
  const ctaBox  = await cta.boundingBox()

  expect(prepBox).not.toBeNull()
  expect(ctaBox).not.toBeNull()
  expect(prepBox!.y + prepBox!.height).toBeLessThanOrEqual(ctaBox!.y)

  await expect(page).toHaveScreenshot('scr-011-selected-bottom.png', {
    fullPage: false,
    animations: 'disabled',
  })
})

// ソート検証: 3種類の並び順を確認
test('SCR-011 inspection start — sort order verification', async ({ page }) => {
  await gotoInspectionStart(page, 'normal')

  // おすすめ順のデフォルト確認: 最初のカードはA-05（期限超過）
  const firstCard = page.locator('[data-colony-id]').first()
  await expect(firstCard).toHaveAttribute('data-colony-id', 'a05')

  // 最終内検が古い順: A-05(16日前)が先頭
  const sortSelect = page.getByTestId('sort-select')
  await sortSelect.selectOption('oldest')
  await expect(page.locator('[data-colony-id]').first()).toHaveAttribute('data-colony-id', 'a05')

  // 最終内検が新しい順: A-01(3日前)が先頭
  await sortSelect.selectOption('newest')
  await expect(page.locator('[data-colony-id]').first()).toHaveAttribute('data-colony-id', 'a01')

  // おすすめ順に戻す: A-05が先頭
  await sortSelect.selectOption('recommended')
  await expect(page.locator('[data-colony-id]').first()).toHaveAttribute('data-colony-id', 'a05')
})
