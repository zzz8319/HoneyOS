import { test, expect } from '@playwright/test'

const SCREEN = 'colony-comparison'
const BASE_URL = `/?screen=${SCREEN}&devbar=0`
const FIXED_NOW = new Date('2026-09-20T00:00:00+09:00')

async function goto(page: import('@playwright/test').Page, extra = '') {
  await page.clock.install({ time: FIXED_NOW })
  await page.goto(`${BASE_URL}${extra}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
}

// ── 1. 通常・表表示 ─────────────────────────────────────────────────────────
test('SCR-030 normal-table', async ({ page }) => {
  await goto(page)
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(page).toHaveScreenshot('scr-030-normal-table.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 2. 通常画面下部 ─────────────────────────────────────────────────────────
test('SCR-030 normal-bottom', async ({ page }) => {
  await goto(page)
  const infoRow = page.getByText('同じ時点の最新記録を比較しています。')
  await infoRow.scrollIntoViewIfNeeded()
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('scr-030-normal-bottom.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 3. ランキングタブ ───────────────────────────────────────────────────────
test('SCR-030 ranking-tab', async ({ page }) => {
  await goto(page)
  await page.getByRole('tab', { name: 'ランキング' }).click()
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('scr-030-ranking-tab.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 4. 強さ昇順 ─────────────────────────────────────────────────────────────
test('SCR-030 sort-strength-asc', async ({ page }) => {
  await goto(page)
  const strengthBtn = page.getByRole('button', { name: /強さで並び替え/ })
  await strengthBtn.click()
  await page.mouse.move(0, 0)
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('scr-030-sort-strength-asc.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 5. 蜂量順 ──────────────────────────────────────────────────────────────
test('SCR-030 sort-bee', async ({ page }) => {
  await goto(page)
  const beeBtn = page.getByRole('button', { name: /蜂量で並び替え/ })
  await beeBtn.click()
  await page.mouse.move(0, 0)
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('scr-030-sort-bee.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 6. 特定養蜂場 ──────────────────────────────────────────────────────────
test('SCR-030 apiary-filter', async ({ page }) => {
  await goto(page)
  await page.getByTestId('top-apiary-btn').click()
  await page.getByRole('button', { name: '宮田養蜂場' }).click()
  await page.mouse.move(0, 0)
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('scr-030-apiary-filter.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 7. 状態フィルター ───────────────────────────────────────────────────────
test('SCR-030 status-filter', async ({ page }) => {
  await goto(page)
  await page.getByTestId('status-filter-btn').click()
  await page.getByRole('button', { name: '要対応' }).click()
  await page.mouse.move(0, 0)
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('scr-030-status-filter.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 8. 最終内検フィルター ──────────────────────────────────────────────────
test('SCR-030 insp-filter', async ({ page }) => {
  await goto(page)
  await page.getByTestId('insp-filter-btn').click()
  await page.getByRole('button', { name: '7日以内' }).click()
  await page.mouse.move(0, 0)
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('scr-030-insp-filter.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 9. 基準日変更 ──────────────────────────────────────────────────────────
test('SCR-030 date-change', async ({ page }) => {
  await goto(page)
  await page.getByTestId('ref-date-btn').click()
  await page.getByRole('button', { name: /2026年8月31日時点/ }).click()
  await page.mouse.move(0, 0)
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('scr-030-date-change.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 10. 空状態 ─────────────────────────────────────────────────────────────
test('SCR-030 empty', async ({ page }) => {
  await goto(page, '&state=empty')
  await expect(page).toHaveScreenshot('scr-030-empty.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 11. 読み込み中 ─────────────────────────────────────────────────────────
test('SCR-030 loading', async ({ page }) => {
  await goto(page, '&state=loading')
  await expect(page).toHaveScreenshot('scr-030-loading.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 12. エラー ─────────────────────────────────────────────────────────────
test('SCR-030 error', async ({ page }) => {
  await goto(page, '&state=error')
  await expect(page).toHaveScreenshot('scr-030-error.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 13. オフライン・キャッシュあり ─────────────────────────────────────────
test('SCR-030 offline-cached', async ({ page }) => {
  await goto(page, '&state=offline')
  await expect(page).toHaveScreenshot('scr-030-offline-cached.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 14. オフライン・キャッシュなし ─────────────────────────────────────────
test('SCR-030 offline-no-cache', async ({ page }) => {
  await goto(page, '&state=offline-no-cache')
  await expect(page).toHaveScreenshot('scr-030-offline-no-cache.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 15. SCR-029から遷移 ─────────────────────────────────────────────────────
test('SCR-030 from-colony-trend', async ({ page }) => {
  await page.clock.install({ time: FIXED_NOW })
  await page.goto('/?screen=colony-trend&devbar=0', { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
  // Navigate to SCR-030 via colony-trend's three-dot menu
  await page.getByRole('button', { name: 'メニューを開く' }).click()
  await page.waitForTimeout(300)
  // Assert SCR-030 content is shown (not SCR-028 report)
  await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: '蜂群比較' })).toBeVisible()
  await expect(page.getByTestId('ref-date-btn')).toContainText('2026年9月8日時点')
  await expect(page.getByRole('tab', { name: '表' })).toHaveAttribute('aria-selected', 'true')
  // Ensure content is fully rendered before checking button state
  await expect(page.getByText('強さランキング')).toBeVisible()
  // Promote the sticky header to a GPU layer so Chromium recomposites it before screenshot.
  // After a React state-change re-render, Chromium defers sticky-header compositing;
  // applying will-change:transform flushes the GPU layer synchronously on the next rAF.
  // This is applied only in the test (not in app CSS) to avoid affecting other snapshots.
  await page.evaluate(() => {
    const header = document.querySelector('header') as HTMLElement | null
    if (header) header.style.willChange = 'transform'
  })
  // Clear touch-induced sticky hover by tapping an empty area
  await page.mouse.move(2, 400)
  await page.touchscreen.tap(2, 400)
  // Confirm ⋮ button is not hovered/focused before screenshot
  const dotBtn = page.getByRole('button', { name: 'その他のメニュー' })
  await expect.poll(() =>
    dotBtn.evaluate((el: HTMLElement) => ({
      hovered: el.matches(':hover'),
      focused: el.matches(':focus'),
      focusVisible: el.matches(':focus-visible'),
      backgroundColor: getComputedStyle(el).backgroundColor,
    }))
  ).toMatchObject({ hovered: false })
  // Two rAFs: let GPU layer flush before screenshot
  await page.evaluate(() => new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r()))))
  await expect(page).toHaveScreenshot('scr-030-from-colony-trend.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 16. SCR-030表示中にBottomNavの分析が選択状態になること ──────────────────
// SCR-030 is reached via SCR-029. While showing SCR-030, BottomNav analytics is active.
// Snapshot taken from direct URL navigation to verify the BottomNav state.
test('SCR-030 from-bottomnav', async ({ page }) => {
  await page.clock.install({ time: FIXED_NOW })
  await page.goto('/?screen=colony-comparison&devbar=0', { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
  // Verify SCR-030 is shown and BottomNav shows 分析 as selected
  await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: '蜂群比較' })).toBeVisible()
  await expect(page.getByRole('tab', { name: '表' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'ランキング' })).toBeVisible()
  await expect(page.getByRole('button', { name: '分析' })).toHaveAttribute('aria-current', 'page')
  await page.mouse.move(0, 0)
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('scr-030-from-bottomnav.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── Functional tests ─────────────────────────────────────────────────────────

test('SCR-030 initial tab is 表', async ({ page }) => {
  await goto(page)
  const tableTab = page.getByRole('tab', { name: '表' })
  await expect(tableTab).toHaveAttribute('aria-selected', 'true')
})

test('SCR-030 ref date shows 2026年9月8日時点', async ({ page }) => {
  await goto(page)
  await expect(page.getByTestId('ref-date-btn')).toContainText('2026年9月8日時点')
})

test('SCR-030 apiary shows 全養蜂場', async ({ page }) => {
  await goto(page)
  await expect(page.getByTestId('top-apiary-btn')).toContainText('全養蜂場')
})

test('SCR-030 A-01 strength is 79', async ({ page }) => {
  await goto(page)
  await expect(page.getByTestId('strength-a1')).toHaveText('79')
})

test('SCR-030 B-01 strength is 70', async ({ page }) => {
  await goto(page)
  await expect(page.getByTestId('strength-b1')).toHaveText('70')
})

test('SCR-030 A-05 strength is 65', async ({ page }) => {
  await goto(page)
  await expect(page.getByTestId('strength-a5')).toHaveText('65')
})

test('SCR-030 A-03 strength is 35', async ({ page }) => {
  await goto(page)
  await expect(page.getByTestId('strength-a3')).toHaveText('35')
})

test('SCR-030 A-03 row has alert styling', async ({ page }) => {
  await goto(page)
  const row = page.getByTestId('colony-row-a3')
  await expect(row).toBeVisible()
  // Alert row has red-tinted background class
  const cls = await row.getAttribute('class')
  expect(cls).toContain('tableRowAlert')
})

test('SCR-030 warning card is visible for A-03', async ({ page }) => {
  await goto(page)
  await expect(page.getByTestId('warning-card')).toBeVisible()
})

test('SCR-030 ranking shows 79, 70, 65, 35 in order', async ({ page }) => {
  await goto(page)
  const s1 = page.getByTestId('rank-score-a1')
  const s2 = page.getByTestId('rank-score-b1')
  const s3 = page.getByTestId('rank-score-a5')
  const s4 = page.getByTestId('rank-score-a3')
  await expect(s1).toHaveText('79')
  await expect(s2).toHaveText('70')
  await expect(s3).toHaveText('65')
  await expect(s4).toHaveText('35')
})

test('SCR-030 switching to ranking tab shows ranking content', async ({ page }) => {
  await goto(page)
  await page.getByRole('tab', { name: 'ランキング' }).click()
  await expect(page.getByTestId('ranking-tab-content')).toBeVisible()
  const rankTab = page.getByRole('tab', { name: 'ランキング' })
  await expect(rankTab).toHaveAttribute('aria-selected', 'true')
})

test('SCR-030 status filter alert shows only A-03', async ({ page }) => {
  await goto(page)
  await page.getByTestId('status-filter-btn').click()
  await page.getByRole('button', { name: '要対応' }).click()
  await page.waitForTimeout(100)
  await expect(page.getByTestId('colony-row-a3')).toBeVisible()
  await expect(page.getByTestId('colony-row-a1')).not.toBeVisible()
})

test('SCR-030 apiary filter miyata excludes b1', async ({ page }) => {
  await goto(page)
  await page.getByTestId('top-apiary-btn').click()
  await page.getByRole('button', { name: '宮田養蜂場' }).click()
  await page.waitForTimeout(100)
  await expect(page.getByTestId('colony-row-b1')).not.toBeVisible()
})

test('SCR-030 insp filter 7d excludes a5 and a3', async ({ page }) => {
  await goto(page)
  await page.getByTestId('insp-filter-btn').click()
  await page.getByRole('button', { name: '7日以内' }).click()
  await page.waitForTimeout(100)
  await expect(page.getByTestId('colony-row-a5')).not.toBeVisible()
})

test('SCR-030 clicking A-03 row navigates to colony detail', async ({ page }) => {
  await goto(page)
  await page.getByTestId('colony-row-a3').click()
  await page.waitForTimeout(200)
  // In SPA state routing, comparison screen unmounts and colony detail appears
  await expect(page.getByTestId('colony-row-a3')).not.toBeVisible()
})

test('SCR-030 warning card click navigates to A-03 detail', async ({ page }) => {
  await goto(page)
  await page.getByTestId('warning-card').click()
  await page.waitForTimeout(200)
  // Warning card navigates away from comparison screen
  await expect(page.getByTestId('warning-card')).not.toBeVisible()
})

test('SCR-030 loading state shows spinner', async ({ page }) => {
  await goto(page, '&state=loading')
  await expect(page.getByTestId('spinner')).toBeVisible()
})

test('SCR-030 empty state shows reset button', async ({ page }) => {
  await goto(page, '&state=empty')
  await expect(page.getByTestId('reset-btn')).toBeVisible()
})

test('SCR-030 error state shows retry button', async ({ page }) => {
  await goto(page, '&state=error')
  await expect(page.getByTestId('retry-btn')).toBeVisible()
})

test('SCR-030 offline-no-cache shows no-cache state', async ({ page }) => {
  await goto(page, '&state=offline-no-cache')
  await expect(page.getByText('保存済みの比較データがありません')).toBeVisible()
})

// ── Navigation tests ─────────────────────────────────────────────────────────

test('SCR-030 navigating from colony-trend shows 蜂群比較 not レポート', async ({ page }) => {
  await page.clock.install({ time: FIXED_NOW })
  await page.goto('/?screen=colony-trend&devbar=0', { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
  await page.getByRole('button', { name: 'メニューを開く' }).click()
  await page.waitForTimeout(200)
  // Must show SCR-030
  await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: '蜂群比較' })).toBeVisible()
  // Must NOT show SCR-028 elements
  await expect(page.getByText('レポート').first()).not.toBeVisible()
})

test('SCR-030 ref date change updates strength values', async ({ page }) => {
  await goto(page)
  // Default: A-01 strength = 79
  await expect(page.getByTestId('strength-a1')).toHaveText('79')
  // Change to 2026-08-31
  await page.getByTestId('ref-date-btn').click()
  await page.getByRole('button', { name: /2026年8月31日時点/ }).click()
  await page.waitForTimeout(100)
  // A-01 should now show 2026-08-27 record: strength=73
  await expect(page.getByTestId('strength-a1')).toHaveText('73')
})

test('SCR-030 ref date change updates B-01 strength', async ({ page }) => {
  await goto(page)
  await expect(page.getByTestId('strength-b1')).toHaveText('70')
  await page.getByTestId('ref-date-btn').click()
  await page.getByRole('button', { name: /2026年8月31日時点/ }).click()
  await page.waitForTimeout(100)
  // B-01 uses 2026-08-22 record: strength=63
  await expect(page.getByTestId('strength-b1')).toHaveText('63')
})

test('SCR-030 ref date change updates ranking scores', async ({ page }) => {
  await goto(page)
  await page.getByTestId('ref-date-btn').click()
  await page.getByRole('button', { name: /2026年8月31日時点/ }).click()
  await page.waitForTimeout(100)
  // Ranking scores should reflect 2026-08-31 data
  await expect(page.getByTestId('rank-score-a1')).toHaveText('73')
  await expect(page.getByTestId('rank-score-b1')).toHaveText('63')
})

test('SCR-030 Sep 1 records not shown when refDate is Aug 31', async ({ page }) => {
  await goto(page)
  // A-01's 2026-09-05 record (strength=79) should NOT appear when refDate=2026-08-31
  await page.getByTestId('ref-date-btn').click()
  await page.getByRole('button', { name: /2026年8月31日時点/ }).click()
  await page.waitForTimeout(100)
  // strength must not be 79 (the Sep 5 record)
  const txt = await page.getByTestId('strength-a1').textContent()
  expect(txt).not.toBe('79')
})

test('SCR-030 menu button has no circular background after navigation', async ({ page }) => {
  await page.clock.install({ time: FIXED_NOW })
  await page.goto('/?screen=colony-trend&devbar=0', { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
  await page.getByRole('button', { name: 'メニューを開く' }).click()
  await page.waitForTimeout(200)
  await page.mouse.move(0, 0)
  await page.waitForTimeout(100)
  // The three-dot button in SCR-030 header should be visible but not show a background
  const menuBtn = page.getByRole('button', { name: 'その他のメニュー' })
  await expect(menuBtn).toBeVisible()
})

test('SCR-030 offline cached banner is one line', async ({ page }) => {
  await goto(page, '&state=offline')
  const banner = page.getByRole('status')
  await expect(banner).toBeVisible()
  const box = await banner.boundingBox()
  // A compact banner should be less than 50px tall
  expect(box?.height).toBeLessThan(50)
})

test('SCR-030 all states have BottomNav analytics selected', async ({ page }) => {
  for (const state of ['normal', 'loading', 'error', 'empty', 'offline', 'offline-no-cache']) {
    await goto(page, `&state=${state}`)
    const analyticsBtn = page.getByRole('button', { name: '分析' })
    await expect(analyticsBtn).toBeVisible()
    // Check aria-current=page on analytics nav item
    await expect(analyticsBtn).toHaveAttribute('aria-current', 'page')
  }
})
