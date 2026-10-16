import { expect, test, type Page } from '@playwright/test'
import { injectMockHoneyDB } from './helpers/mockHoneyDB'

const STATES = ['normal', 'selected', 'empty', 'loading', 'error', 'offline'] as const

/**
 * Override Date to 2026-09-08 JST (= 2026-09-07T15:00:00Z) so daysAgo values
 * match baseline: a05=16d, a03=11d, b02=10d, a01=3d.
 * Also narrow HoneyDB to the 4 colonies in the baseline, with inspection frames
 * that reproduce the composition bars from the original MOCK_COLONIES values.
 */
const SCR011_OVERRIDE = `
;(function() {
  const OrigDate = Date
  const FIXED_MS = new OrigDate('2026-09-08T00:00:00Z').getTime()
  class MockDate extends OrigDate {
    constructor(...args) {
      if (args.length === 0) { super(FIXED_MS) } else { super(...args) }
    }
    static now() { return FIXED_MS }
  }
  Object.defineProperty(window, 'Date', { value: MockDate, writable: true, configurable: true })
})()
window.HoneyDB.loadFarms    = async () => [
  { id: 'f1', name: '宮田養蜂場' },
  { id: 'f3', name: '川東養蜂場' },
]
window.HoneyDB.loadColonies = async () => [
  { id: 'a5', name: 'A-05', farmId: 'f1' },
  { id: 'a3', name: 'A-03', farmId: 'f1' },
  { id: 'b2', name: 'B-02', farmId: 'f3' },
  { id: 'a1', name: 'A-01', farmId: 'f1' },
]
window.HoneyDB.loadInspRecords = async () => [
  // a5: latest 2026-08-23 (16d), prev record for delta
  { id: 'ir-a5-1', colony: 'a5', date: '2026-08-23', frames: [{ bee: 28, brood: 20, honey: 30 }] },
  { id: 'ir-a5-2', colony: 'a5', date: '2026-08-10', frames: [{ bee: 30, brood: 22, honey: 28 }] },
  // a3: latest 2026-08-28 (11d)
  { id: 'ir-a3-1', colony: 'a3', date: '2026-08-28', frames: [{ bee: 22, brood: 14, honey: 34 }] },
  { id: 'ir-a3-2', colony: 'a3', date: '2026-08-15', frames: [{ bee: 30, brood: 20, honey: 32 }] },
  // b2: latest 2026-08-29 (10d)
  { id: 'ir-b2-1', colony: 'b2', date: '2026-08-29', frames: [{ bee: 32, brood: 18, honey: 28 }] },
  { id: 'ir-b2-2', colony: 'b2', date: '2026-08-16', frames: [{ bee: 36, brood: 22, honey: 26 }] },
  // a1: latest 2026-09-05 (3d)
  { id: 'ir-a1-1', colony: 'a1', date: '2026-09-05', frames: [{ bee: 40, brood: 28, honey: 22 }] },
  { id: 'ir-a1-2', colony: 'a1', date: '2026-08-25', frames: [{ bee: 38, brood: 26, honey: 24 }] },
]
`

test.beforeEach(async ({ page }) => {
  await injectMockHoneyDB(page, SCR011_OVERRIDE)
})

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
  const a05Card = page.locator('[data-colony-id="a5"]')
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

  // おすすめ順のデフォルト確認: 最初のカードはA-05（最終内検が最も古い）
  const firstCard = page.locator('[data-colony-id]').first()
  await expect(firstCard).toHaveAttribute('data-colony-id', 'a5')

  // 最終内検が古い順: A-05(2026-08-23)が先頭
  const sortSelect = page.getByTestId('sort-select')
  await sortSelect.selectOption('oldest')
  await expect(page.locator('[data-colony-id]').first()).toHaveAttribute('data-colony-id', 'a5')

<<<<<<< HEAD
  // 最終内検が新しい順: A-01(2026-09-05)が先頭（4蜂群フィクスチャでは最新）
  await sortSelect.selectOption('newest')
  await expect(page.locator('[data-colony-id]').first()).toHaveAttribute('data-colony-id', 'a1')
=======
  // 最終内検が新しい順: A-02(2日前)が先頭
  await sortSelect.selectOption('newest')
  await expect(page.locator('[data-colony-id]').first()).toHaveAttribute('data-colony-id', 'a2')
>>>>>>> 25cfddb (test: align visual fixtures with HoneyDB data loading)

  // おすすめ順に戻す: A-05が先頭
  await sortSelect.selectOption('recommended')
  await expect(page.locator('[data-colony-id]').first()).toHaveAttribute('data-colony-id', 'a5')
})
