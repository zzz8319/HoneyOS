import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173'

async function gotoReport(page: import('@playwright/test').Page, state = 'normal') {
  await page.goto(`${BASE}/?screen=report&state=${state}&devbar=0`)
  await page.waitForLoadState('networkidle')
}

// ── 1. 月次通常 ──────────────────────────────────────────────────────────────

test('SCR-028 normal — default Sep 2026', async ({ page }) => {
  await gotoReport(page, 'normal')
  await page.waitForSelector('text=採蜜量')
  await expect(page).toHaveScreenshot('scr-028-normal.png', { fullPage: false })
})

// ── 2. 月次画面下部 ──────────────────────────────────────────────────────────

test('SCR-028 normal-bottom — breakdown + actions', async ({ page }) => {
  await gotoReport(page, 'normal')
  await page.waitForSelector('text=作業内訳')
  // Scroll to bottom
  await page.evaluate(() => {
    const body = document.querySelector('[class*="body"]')
    if (body) body.scrollTop = body.scrollHeight
  })
  await page.waitForTimeout(200)
  await expect(page).toHaveScreenshot('scr-028-normal-bottom.png', { fullPage: false })
})

// ── 3. BottomNav分析タブ → SCR-030（蜂群比較）に遷移する ────────────────────
// Note: analytics tab now shows SCR-030 ColonyComparisonScreen per product design

test('SCR-028 via BottomNav analytics tab shows colony comparison', async ({ page }) => {
  await page.goto(`${BASE}/?tab=analytics&devbar=0`)
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('text=蜂群比較')
  await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: '蜂群比較' })).toBeVisible()
  await expect(page).toHaveScreenshot('scr-028-via-bottomnav.png', { fullPage: false })
})

// ── 4. SCR-027からの遷移（work-historyからreportへ） ───────────────────────

test('SCR-028 via work-history analyze button', async ({ page }) => {
  await page.goto(`${BASE}/?screen=report&state=normal&devbar=0`)
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('text=採蜜量')
  // Verify header: no back button, title left, menu right
  const header = page.locator('header')
  await expect(header.locator('h1')).toContainText('レポート')
  const buttons = header.locator('button')
  await expect(buttons).toHaveCount(1) // only menu button
  await expect(page).toHaveScreenshot('scr-028-from-work-history.png', { fullPage: false })
})

// ── 5. 年次 ──────────────────────────────────────────────────────────────────

test('SCR-028 yearly mode', async ({ page }) => {
  await gotoReport(page, 'normal')
  await page.waitForSelector('text=月次')
  await page.getByRole('button', { name: '年次' }).click()
  await page.waitForTimeout(150)
  await expect(page).toHaveScreenshot('scr-028-yearly.png', { fullPage: false })
})

// ── 6. 前月移動 ───────────────────────────────────────────────────────────────

test('SCR-028 prev month navigation', async ({ page }) => {
  await gotoReport(page, 'normal')
  await page.waitForSelector('text=2026年9月')
  await page.getByRole('button', { name: '前の期間' }).click()
  await page.waitForTimeout(150)
  await expect(page.locator('[class*="periodLabel"]')).toContainText('2026年8月')
  await expect(page).toHaveScreenshot('scr-028-prev-month.png', { fullPage: false })
})

// ── 7. 全体＋特定養蜂場 ──────────────────────────────────────────────────────

test('SCR-028 overall + specific apiary filter', async ({ page }) => {
  await gotoReport(page, 'normal')
  await page.waitForSelector('text=全体')
  // Select specific apiary from the always-visible select
  const select = page.locator('select')
  await select.selectOption({ index: 1 })
  await page.waitForTimeout(150)
  await expect(page).toHaveScreenshot('scr-028-apiary-filter.png', { fullPage: false })
})

// ── 8. 養蜂場別 ───────────────────────────────────────────────────────────────

test('SCR-028 apiary group tab', async ({ page }) => {
  await gotoReport(page, 'normal')
  await page.getByRole('button', { name: '養蜂場別' }).click()
  await page.waitForTimeout(150)
  await expect(page).toHaveScreenshot('scr-028-apiary-group.png', { fullPage: false })
})

// ── 9. 蜂群別 ─────────────────────────────────────────────────────────────────

test('SCR-028 colony group tab', async ({ page }) => {
  await gotoReport(page, 'normal')
  await page.getByRole('button', { name: '蜂群別' }).click()
  await page.waitForTimeout(150)
  await expect(page).toHaveScreenshot('scr-028-colony-group.png', { fullPage: false })
})

// ── 10. ローディング ───────────────────────────────────────────────────────────

test('SCR-028 loading state', async ({ page }) => {
  await gotoReport(page, 'loading')
  await page.waitForSelector('text=レポートを読み込み中')
  await expect(page).toHaveScreenshot('scr-028-loading.png', { fullPage: false })
})

// ── 11. 空状態 ────────────────────────────────────────────────────────────────

test('SCR-028 empty state', async ({ page }) => {
  await gotoReport(page, 'empty')
  await page.waitForSelector('text=レポートデータがありません')
  await expect(page).toHaveScreenshot('scr-028-empty.png', { fullPage: false })
})

// ── 12. 取得失敗（エラー） ────────────────────────────────────────────────────

test('SCR-028 error state', async ({ page }) => {
  await gotoReport(page, 'error')
  await page.waitForSelector('text=レポートを取得できませんでした')
  await expect(page).toHaveScreenshot('scr-028-error.png', { fullPage: false })
})

// ── 13. オフライン・キャッシュあり ──────────────────────────────────────────

test('SCR-028 offline state with cache', async ({ page }) => {
  await gotoReport(page, 'offline')
  await page.waitForSelector('text=オフライン')
  await expect(page).toHaveScreenshot('scr-028-offline.png', { fullPage: false })
})

// ── 14. オフライン・キャッシュなし ──────────────────────────────────────────

test('SCR-028 offline-no-cache state', async ({ page }) => {
  await gotoReport(page, 'offline-no-cache')
  await page.waitForSelector('text=保存済みのレポートがありません')
  await expect(page).toHaveScreenshot('scr-028-offline-no-cache.png', { fullPage: false })
})

// ── 15. 履歴を見る ────────────────────────────────────────────────────────────

test('SCR-028 履歴を見る button exists', async ({ page }) => {
  await gotoReport(page, 'normal')
  await page.waitForSelector('text=履歴を見る')
  const btn = page.locator('button', { hasText: '履歴を見る' })
  await expect(btn).toBeVisible()
})

// ── 16. PDFの有効・無効状態 ────────────────────────────────────────────────

test('SCR-028 PDF button disabled', async ({ page }) => {
  await gotoReport(page, 'normal')
  await page.waitForSelector('text=PDF')
  const pdfBtn = page.locator('button[aria-label*="PDF"]')
  await expect(pdfBtn).toBeDisabled()
})

// ── 17. CSVの有効・無効状態 ────────────────────────────────────────────────

test('SCR-028 CSV button disabled', async ({ page }) => {
  await gotoReport(page, 'normal')
  await page.waitForSelector('text=CSV')
  const csvBtn = page.locator('button[aria-label*="CSV"]')
  await expect(csvBtn).toBeDisabled()
})

// ── KPI値の確認 ───────────────────────────────────────────────────────────────

test('SCR-028 KPI labels match spec', async ({ page }) => {
  await gotoReport(page, 'normal')
  await page.waitForSelector('text=採蜜量')
  const body = page.locator('body')
  await expect(body).toContainText('採蜜量')
  await expect(body).toContainText('作業')
  await expect(body).toContainText('内検実施率')
  await expect(body).toContainText('AI異常')
})

test('SCR-028 chart titles match spec', async ({ page }) => {
  await gotoReport(page, 'normal')
  await page.waitForSelector('text=採蜜量の推移')
  const body = page.locator('body')
  await expect(body).toContainText('採蜜量の推移')
  await expect(body).toContainText('強さスコア推移')
})

test('SCR-028 no back button in header', async ({ page }) => {
  await gotoReport(page, 'normal')
  const header = page.locator('header')
  const buttons = header.locator('button')
  await expect(buttons).toHaveCount(1)
})

test('SCR-028 apiary select always visible', async ({ page }) => {
  await gotoReport(page, 'normal')
  // Select should be visible even in 'overall' mode
  await expect(page.locator('select')).toBeVisible()
})

test('SCR-028 work breakdown always visible', async ({ page }) => {
  await gotoReport(page, 'normal')
  await expect(page.locator('text=作業内訳')).toBeVisible()
  await expect(page.getByText('採蜜', { exact: true })).toBeVisible()
  await expect(page.getByText('給餌', { exact: true })).toBeVisible()
  await expect(page.getByText('治療', { exact: true })).toBeVisible()
})
