import { test, expect } from '@playwright/test'

const SCREEN = 'colony-trend'
const BASE_URL = `/?screen=${SCREEN}&devbar=0`
// Freeze time so relative dates are deterministic
const FIXED_NOW = new Date('2026-09-20T00:00:00+09:00')

async function goto(page: import('@playwright/test').Page, extra = '') {
  await page.clock.install({ time: FIXED_NOW })
  await page.goto(`${BASE_URL}${extra}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
}

// ── 1. 通常表示（上部） ─────────────────────────────────────────────────────
test('SCR-029 normal', async ({ page }) => {
  await goto(page)
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(page).toHaveScreenshot('scr-029-normal.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 2. 通常表示（下部） ─────────────────────────────────────────────────────
test('SCR-029 normal-bottom', async ({ page }) => {
  await goto(page)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('scr-029-normal-bottom.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 3. ツールチップ表示 ─────────────────────────────────────────────────────
test('SCR-029 tooltip', async ({ page }) => {
  await goto(page)
  // Click the 8/28 point of A-03 (value=42)
  // aria-label format: "A-03 2026-08-28 強さスコア 42"
  const point = page.getByRole('button', { name: /A-03 2026-08-28 強さスコア 42/ })
  await point.first().click()
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('scr-029-tooltip.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 4. 全体平均 ─────────────────────────────────────────────────────────────
test('SCR-029 average', async ({ page }) => {
  await goto(page)
  await page.getByRole('tab', { name: '全体平均' }).click()
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('scr-029-average.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 5. 1年 ──────────────────────────────────────────────────────────────────
test('SCR-029 period-1y', async ({ page }) => {
  await goto(page)
  await page.getByRole('button', { name: '1年', exact: true }).click()
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('scr-029-period-1y.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 6. 全期間 ───────────────────────────────────────────────────────────────
test('SCR-029 period-all', async ({ page }) => {
  await goto(page)
  await page.getByRole('button', { name: '全期間', exact: true }).click()
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('scr-029-period-all.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 7. 去年と比較 ───────────────────────────────────────────────────────────
test('SCR-029 year-compare', async ({ page }) => {
  await goto(page)
  await page.getByRole('tab', { name: '去年と比較' }).click()
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('scr-029-year-compare.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 8. 群を追加する選択UI ───────────────────────────────────────────────────
test('SCR-029 colony-picker', async ({ page }) => {
  await goto(page)
  await page.getByRole('button', { name: '比較する蜂群を追加' }).click()
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('scr-029-colony-picker.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 9. 1件削除した状態 ─────────────────────────────────────────────────────
test('SCR-029 colony-removed', async ({ page }) => {
  await goto(page)
  await page.getByRole('button', { name: 'B-01を削除' }).click()
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('scr-029-colony-removed.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 10. 空状態 ──────────────────────────────────────────────────────────────
test('SCR-029 empty', async ({ page }) => {
  await goto(page, '&state=empty')
  await expect(page).toHaveScreenshot('scr-029-empty.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 11. 読み込み中 ──────────────────────────────────────────────────────────
test('SCR-029 loading', async ({ page }) => {
  await goto(page, '&state=loading')
  await page.waitForTimeout(50)
  await expect(page).toHaveScreenshot('scr-029-loading.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 12. エラー ──────────────────────────────────────────────────────────────
test('SCR-029 error', async ({ page }) => {
  await goto(page, '&state=error')
  await expect(page).toHaveScreenshot('scr-029-error.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 13. オフライン・キャッシュなし ─────────────────────────────────────────
test('SCR-029 offline', async ({ page }) => {
  await goto(page, '&state=offline')
  await expect(page).toHaveScreenshot('scr-029-offline.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 14. BottomNavから表示した状態 ──────────────────────────────────────────
test('SCR-029 from-bottomnav', async ({ page }) => {
  await goto(page)
  await expect(page.getByRole('navigation', { name: 'メインナビゲーション' })).toBeVisible()
  await expect(page).toHaveScreenshot('scr-029-from-bottomnav.png', {
    fullPage: false, animations: 'disabled',
  })
})
