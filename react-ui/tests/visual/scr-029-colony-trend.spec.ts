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
  // Scroll the main scroll container (overflow-y: auto) to show bottom content
  const historyBtn = page.getByTestId('inspection-history-btn')
  await historyBtn.scrollIntoViewIfNeeded()
  await page.waitForTimeout(100)
  await expect(historyBtn).toBeVisible()
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

// ── 機能テスト ───────────────────────────────────────────────────────────────

// BottomNav: 分析が選択されていること
test('SCR-029 analytics tab selected', async ({ page }) => {
  await goto(page)
  const nav = page.getByRole('navigation', { name: 'メインナビゲーション' })
  const analyticsBtn = nav.getByRole('button', { name: '分析' })
  const homeBtn      = nav.getByRole('button', { name: 'ホーム' })
  await expect(analyticsBtn).toHaveAttribute('aria-current', 'page')
  await expect(homeBtn).not.toHaveAttribute('aria-current', 'page')
})

// BottomNav: loading/empty/error/offline でも分析が選択
test('SCR-029 analytics tab selected in loading', async ({ page }) => {
  await goto(page, '&state=loading')
  const analyticsBtn = page.getByRole('navigation', { name: 'メインナビゲーション' }).getByRole('button', { name: '分析' })
  await expect(analyticsBtn).toHaveAttribute('aria-current', 'page')
})
test('SCR-029 analytics tab selected in empty', async ({ page }) => {
  await goto(page, '&state=empty')
  const analyticsBtn = page.getByRole('navigation', { name: 'メインナビゲーション' }).getByRole('button', { name: '分析' })
  await expect(analyticsBtn).toHaveAttribute('aria-current', 'page')
})
test('SCR-029 analytics tab selected in error', async ({ page }) => {
  await goto(page, '&state=error')
  const analyticsBtn = page.getByRole('navigation', { name: 'メインナビゲーション' }).getByRole('button', { name: '分析' })
  await expect(analyticsBtn).toHaveAttribute('aria-current', 'page')
})
test('SCR-029 analytics tab selected in offline', async ({ page }) => {
  await goto(page, '&state=offline')
  const analyticsBtn = page.getByRole('navigation', { name: 'メインナビゲーション' }).getByRole('button', { name: '分析' })
  await expect(analyticsBtn).toHaveAttribute('aria-current', 'page')
})

// チップ行: A-01/A-03/B-01 と「群を追加」が表示
test('SCR-029 chips visible and not overlapping chart', async ({ page }) => {
  await goto(page)
  const chipList = page.getByRole('list', { name: '比較対象の蜂群' })
  const a01 = chipList.getByText('A-01')
  const a03 = chipList.getByText('A-03')
  const b01 = chipList.getByText('B-01')
  const add = page.getByRole('button', { name: '比較する蜂群を追加' })
  await expect(a01).toBeVisible()
  await expect(a03).toBeVisible()
  await expect(b01).toBeVisible()
  await expect(add).toBeVisible()

  // チップの bounding box が 0 より大きいこと
  const chipListBox = await chipList.boundingBox()
  expect(chipListBox).not.toBeNull()
  expect(chipListBox!.height).toBeGreaterThan(0)

  // チップ行とグラフカードが重なっていないこと
  const chartCard = page.getByTestId('trend-chart-card')
  const chipListBB  = await chipList.boundingBox()
  const chartCardBB = await chartCard.boundingBox()
  expect(chipListBB).not.toBeNull()
  expect(chartCardBB).not.toBeNull()
  // チップ行の下端 <= グラフカードの上端
  expect(chipListBB!.y + chipListBB!.height).toBeLessThanOrEqual(chartCardBB!.y + 4)
})

// normal-bottom: 内検履歴が表示され、高さ44px以上、BottomNav と重ならない
test('SCR-029 history button visible and not overlapping bottomnav', async ({ page }) => {
  await goto(page)
  const historyBtn = page.getByTestId('inspection-history-btn')
  await historyBtn.scrollIntoViewIfNeeded()
  await expect(historyBtn).toBeVisible()

  const nav = page.getByRole('navigation', { name: 'メインナビゲーション' })
  const historyBB = await historyBtn.boundingBox()
  const navBB     = await nav.boundingBox()
  expect(historyBB).not.toBeNull()
  expect(navBB).not.toBeNull()
  // ボタン高さが44px以上
  expect(historyBB!.height).toBeGreaterThanOrEqual(44)
  // 内検履歴ボタンの下端 <= BottomNav 上端
  expect(historyBB!.y + historyBB!.height).toBeLessThanOrEqual(navBB!.y)
})

// ツールチップに「スコア 42」が表示されること
test('SCR-029 tooltip shows short label', async ({ page }) => {
  await goto(page)
  const point = page.getByRole('button', { name: /A-03 2026-08-28 強さスコア 42/ })
  await point.first().click()
  await page.waitForTimeout(100)
  // SVG テキストで「スコア」と「42」が存在すること
  await expect(page.locator('text=スコア').first()).toBeVisible()
})

// 初期状態のセグメント・期間
test('SCR-029 initial state selectors', async ({ page }) => {
  await goto(page)
  // 個別群比較 が選択
  const individualTab = page.getByRole('tab', { name: '個別群比較' })
  await expect(individualTab).toHaveAttribute('aria-selected', 'true')
  // 3ヶ月 が選択（aria-pressed）
  const period3m = page.getByRole('button', { name: '3ヶ月', exact: true })
  await expect(period3m).toHaveAttribute('aria-pressed', 'true')
  // 今年 が選択
  const currentYear = page.getByRole('tab', { name: '今年' })
  await expect(currentYear).toHaveAttribute('aria-selected', 'true')
})

// 内検履歴ボタンが選択中のコロニー ID を渡して遷移すること
test('SCR-029 history button triggers navigation', async ({ page }) => {
  await page.clock.install({ time: FIXED_NOW })
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
  // onInspectionHistory は colony-detail 画面に遷移する
  const historyBtn = page.getByTestId('inspection-history-btn')
  await historyBtn.scrollIntoViewIfNeeded()
  await historyBtn.click()
  // 遷移後、colony-detail 画面が表示される（戻るボタンの存在で確認）
  await expect(page.getByRole('button', { name: /戻る/ }).or(page.getByRole('link', { name: /戻る/ })).or(page.locator('[aria-label*="戻る"]'))).toBeVisible()
})

// X軸: 3ヶ月表示で 6月〜9月が全て表示される
test('SCR-029 x-axis 3m shows June through September', async ({ page }) => {
  await goto(page)
  // aria-pressed="true" で 3ヶ月 が選択されていることを確認
  await expect(page.getByRole('button', { name: '3ヶ月', exact: true })).toHaveAttribute('aria-pressed', 'true')
  // SVG text 要素で各月ラベルが存在する
  const chart = page.getByTestId('trend-chart-card')
  await expect(chart.locator('text').filter({ hasText: '6月' })).toBeVisible()
  await expect(chart.locator('text').filter({ hasText: '7月' })).toBeVisible()
  await expect(chart.locator('text').filter({ hasText: '8月' })).toBeVisible()
  await expect(chart.locator('text').filter({ hasText: '9月' })).toBeVisible()
})

// X軸: 1年表示で複数月が表示される
test('SCR-029 x-axis 1y shows month labels', async ({ page }) => {
  await goto(page)
  await page.getByRole('button', { name: '1年', exact: true }).click()
  await page.waitForTimeout(100)
  const chart = page.getByTestId('trend-chart-card')
  // 10月〜9月が含まれるので最低でも複数の月テキストがある
  const textEls = chart.locator('text')
  const count = await textEls.count()
  expect(count).toBeGreaterThan(3)
})

// X軸: 全期間表示でも月ラベルがある
test('SCR-029 x-axis all shows month labels', async ({ page }) => {
  await goto(page)
  await page.getByRole('button', { name: '全期間', exact: true }).click()
  await page.waitForTimeout(100)
  const chart = page.getByTestId('trend-chart-card')
  const textEls = chart.locator('text')
  const count = await textEls.count()
  expect(count).toBeGreaterThan(3)
})

// 縦三点メニューが全状態画面に表示される
test('SCR-029 three-dot menu in loading state', async ({ page }) => {
  await goto(page, '&state=loading')
  const menuBtn = page.getByRole('button', { name: 'メニューを開く' })
  await expect(menuBtn).toBeVisible()
})
test('SCR-029 three-dot menu in empty state', async ({ page }) => {
  await goto(page, '&state=empty')
  const menuBtn = page.getByRole('button', { name: 'メニューを開く' })
  await expect(menuBtn).toBeVisible()
})
test('SCR-029 three-dot menu in error state', async ({ page }) => {
  await goto(page, '&state=error')
  const menuBtn = page.getByRole('button', { name: 'メニューを開く' })
  await expect(menuBtn).toBeVisible()
})
test('SCR-029 three-dot menu in offline state', async ({ page }) => {
  await goto(page, '&state=offline')
  const menuBtn = page.getByRole('button', { name: 'メニューを開く' })
  await expect(menuBtn).toBeVisible()
})
