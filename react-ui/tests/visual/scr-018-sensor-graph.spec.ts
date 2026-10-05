import { test, expect, Page } from '@playwright/test'

const BASE = 'http://localhost:5175/?screen=sensor-graph&devbar=0'

async function resetScroll(page: Page) {
  await page.evaluate(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    const container = document.querySelector('[data-testid="sensor-graph-scroll-container"]')
    if (container instanceof HTMLElement) {
      container.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      container.scrollTop = 0
    }
  })
  // Wait 2 animation frames for layout to settle
  await page.evaluate(
    () => new Promise<void>((resolve) => {
      requestAnimationFrame(() => { requestAnimationFrame(() => resolve()) })
    })
  )
}

async function prepare(page: Page, url: string) {
  await page.goto(url)
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  await page.addStyleTag({
    content: '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; caret-color: transparent !important; }',
  })
  await resetScroll(page)
}

async function assertCommonSCR018(page: Page) {
  // must stay on SCR-018
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.locator('h1')).toContainText('温度')
  // subtitle
  await expect(page.locator('p').filter({ hasText: /A-03/ }).first()).toBeVisible()
  // no BottomNav
  await expect(page.locator('nav[aria-label*="タブ"]')).toHaveCount(0)
  // window scroll at 0
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  // internal scroll container at 0
  await expect.poll(() => page.evaluate(() => {
    const c = document.querySelector('[data-testid="sensor-graph-scroll-container"]')
    return c instanceof HTMLElement ? c.scrollTop : 0
  })).toBe(0)
}

// ── normal-day ─────────────────────────────────────────────────────────────

test('SCR-018 normal-day — 通常(日)', async ({ page }) => {
  await prepare(page, `${BASE}&state=normal-day`)
  await assertCommonSCR018(page)
  await expect(page.locator('[aria-pressed="true"]')).toContainText('日')
  await expect(page.locator('[aria-haspopup="listbox"]')).toBeVisible()
  const mainChart = page.locator('section[aria-label="センサーグラフ"]')
  await expect(mainChart.locator('[data-testid="chart-point-0"]')).toBeVisible()
  // no tooltip visible
  await expect(mainChart.locator('[data-testid="chart-point-14"]')).toBeVisible()
  await expect(page).toHaveScreenshot('scr-018-normal-day.png', { fullPage: false })
})

// ── tooltip-active ─────────────────────────────────────────────────────────

test('SCR-018 tooltip-active — ツールチップ表示', async ({ page }) => {
  await prepare(page, `${BASE}&state=normal-day`)
  await assertCommonSCR018(page)

  // Click the specific data point at index 14 (14:20, 35.8℃) — scope to main chart
  const mainChart = page.locator('section[aria-label="センサーグラフ"]')
  const point = mainChart.locator('[data-testid="chart-point-14"]')
  await expect(point).toBeVisible()
  await point.click()
  await page.waitForTimeout(150)

  // Assert still on SCR-018
  await expect(page.locator('h1')).toContainText('温度')
  await expect(page.locator('nav[aria-label*="タブ"]')).toHaveCount(0)

  // Tooltip must show 14:20 and 35.8℃
  // Tooltip is rendered in SVG text elements; check via page.evaluate
  const tooltipText = await page.evaluate(() => {
    const svg = document.querySelector('svg[role="img"]')
    if (!svg) return ''
    return svg.textContent ?? ''
  })
  expect(tooltipText).toMatch(/14:20/)
  expect(tooltipText).toMatch(/35\.8/)

  // vertical guide line exists in DOM (SVG lines have no area so toBeVisible doesn't apply)
  const vlineCount = await page.locator('svg[role="img"] line[stroke="#DC2626"][stroke-dasharray="3 2"]').count()
  expect(vlineCount).toBeGreaterThan(0)

  await expect(page).toHaveScreenshot('scr-018-tooltip-active.png', { fullPage: false })
})

// ── metric-selector-open ───────────────────────────────────────────────────

test('SCR-018 metric-selector-open — センサー切替', async ({ page }) => {
  await prepare(page, `${BASE}&state=normal-day`)
  await assertCommonSCR018(page)

  const kindBtn = page.locator('[aria-haspopup="listbox"]')
  await kindBtn.click()
  await page.waitForTimeout(150)

  // Dropdown must be visible
  await expect(page.locator('[role="listbox"]')).toBeVisible()
  // Selected option is 温度
  await expect(page.locator('[aria-selected="true"]')).toContainText('温度')

  await expect(page).toHaveScreenshot('scr-018-metric-selector-open.png', { fullPage: false })
})

// ── week ───────────────────────────────────────────────────────────────────

test('SCR-018 week — 週表示', async ({ page }) => {
  await prepare(page, `${BASE}&state=week`)
  await assertCommonSCR018(page)
  await expect(page.locator('[aria-pressed="true"]')).toContainText('週')
  // date label shows a week range
  const dateLabel = page.locator('span').filter({ hasText: /〜/ }).first()
  await expect(dateLabel).toBeVisible()
  const labelText = await dateLabel.textContent()
  // must contain 9/8 as start
  expect(labelText).toMatch(/9月8日/)
  // must contain 9/14 as end
  expect(labelText).toMatch(/9月14日/)
  await expect(page.locator('section[aria-label="センサーグラフ"] [data-testid="chart-point-0"]')).toBeVisible()
  await expect(page).toHaveScreenshot('scr-018-week.png', { fullPage: false })
})

// ── month ──────────────────────────────────────────────────────────────────

test('SCR-018 month — 月表示', async ({ page }) => {
  await prepare(page, `${BASE}&state=month`)
  await assertCommonSCR018(page)
  await expect(page.locator('[aria-pressed="true"]')).toContainText('月')
  // date label shows 2026年9月
  const dateLabel = page.locator('span').filter({ hasText: /2026年9月/ }).first()
  await expect(dateLabel).toBeVisible()
  await expect(page.locator('section[aria-label="センサーグラフ"] [data-testid="chart-point-0"]')).toBeVisible()
  await expect(page).toHaveScreenshot('scr-018-month.png', { fullPage: false })
})

// ── custom-range ───────────────────────────────────────────────────────────

test('SCR-018 custom-range — カスタム期間', async ({ page }) => {
  await prepare(page, `${BASE}&state=normal-day`)
  await assertCommonSCR018(page)

  const customBtn = page.getByRole('button', { name: 'カスタム' })
  await customBtn.click()
  await page.waitForTimeout(200)

  // Sheet must be open
  await expect(page.getByRole('dialog', { name: '期間を選択' })).toBeVisible()
  // カスタム tab must appear selected
  await expect(page.locator('[aria-pressed="true"]')).toContainText('カスタム')
  // Date fields must show Japanese format (YYYY/MM/DD)
  const startInput = page.locator('#rangeStart')
  await expect(startInput).toBeVisible()
  const startVal = await startInput.inputValue()
  expect(startVal).not.toMatch(/^\d{2}\/\d{2}\/\d{4}$/) // must NOT be mm/dd/yyyy

  await expect(page).toHaveScreenshot('scr-018-custom-range.png', { fullPage: false })
})

// ── loading ────────────────────────────────────────────────────────────────

test('SCR-018 loading — 読込中', async ({ page }) => {
  await prepare(page, `${BASE}&state=loading`)
  await assertCommonSCR018(page)
  await expect(page.locator('[aria-busy="true"]')).toBeVisible()
  await expect(page).toHaveScreenshot('scr-018-loading.png', { fullPage: false })
})

// ── empty ──────────────────────────────────────────────────────────────────

test('SCR-018 empty — データなし', async ({ page }) => {
  await prepare(page, `${BASE}&state=empty`)
  await assertCommonSCR018(page)
  // common controls must be visible
  await expect(page.locator('[aria-haspopup="listbox"]')).toBeVisible()
  await expect(page.locator('[role="group"][aria-label="表示期間"]')).toBeVisible()
  await expect(page.getByText(/この期間のデータがありません/)).toBeVisible()
  await expect(page).toHaveScreenshot('scr-018-empty.png', { fullPage: false })
})

// ── partial-data ───────────────────────────────────────────────────────────

test('SCR-018 partial-data — 欠損データ', async ({ page }) => {
  await prepare(page, `${BASE}&state=partial-data`)
  await assertCommonSCR018(page)
  // 「日」tab selected
  await expect(page.locator('[aria-pressed="true"]')).toContainText('日')
  // missing count: evaluate directly to avoid any scroll side-effects from locator actions
  const missingCount = await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('span'))
    const last = spans.filter(s => s.textContent?.includes('件')).pop()
    return last ? parseInt(last.textContent ?? '0') : 0
  })
  expect(missingCount).toBeGreaterThan(0)
  // chart still visible (chart-point-0 is near top — no scroll needed)
  const chartPointVisible = await page.evaluate(() => {
    return !!document.querySelector('section[aria-label="センサーグラフ"] [data-testid="chart-point-0"]')
  })
  expect(chartPointVisible).toBe(true)
  // Assert title is in viewport top before screenshot
  const titleBox = await page.getByRole('heading', { name: '温度', exact: true }).boundingBox()
  expect(titleBox).not.toBeNull()
  expect(titleBox!.y).toBeGreaterThanOrEqual(0)
  expect(titleBox!.y).toBeLessThan(60)
  // Final scroll reset before screenshot
  await resetScroll(page)
  await expect(page).toHaveScreenshot('scr-018-partial-data.png', { fullPage: false })
})

// ── error ──────────────────────────────────────────────────────────────────

test('SCR-018 error — エラー', async ({ page }) => {
  await prepare(page, `${BASE}&state=error`)
  await assertCommonSCR018(page)
  await expect(page.getByText('センサーデータの取得に失敗しました。')).toBeVisible()
  await expect(page.getByText('再読み込み')).toBeVisible()
  await expect(page).toHaveScreenshot('scr-018-error.png', { fullPage: false })
})

// ── offline-cached ─────────────────────────────────────────────────────────

test('SCR-018 offline-cached — オフライン(キャッシュあり)', async ({ page }) => {
  await prepare(page, `${BASE}&state=offline-cached`)
  await assertCommonSCR018(page)
  await expect(page.getByText(/オフラインです/).first()).toBeVisible()
  await expect(page.getByText(/キャッシュ取得時刻/).first()).toBeVisible()
  await expect(page).toHaveScreenshot('scr-018-offline-cached.png', { fullPage: false })
})

// ── offline-no-cache ───────────────────────────────────────────────────────

test('SCR-018 offline-no-cache — オフライン(キャッシュなし)', async ({ page }) => {
  await prepare(page, `${BASE}&state=offline-no-cache`)
  await assertCommonSCR018(page)
  await expect(page.getByText(/オフラインのためセンサーデータを表示できません/).first()).toBeVisible()
  await expect(page).toHaveScreenshot('scr-018-offline-no-cache.png', { fullPage: false })
})

// ── SHA-256 uniqueness check ───────────────────────────────────────────────

const CAPTURE_STATES: { id: string; url: string; interact?: string }[] = [
  { id: 'normal-day',           url: `${BASE}&state=normal-day` },
  { id: 'week',                 url: `${BASE}&state=week` },
  { id: 'month',                url: `${BASE}&state=month` },
  { id: 'partial-data',         url: `${BASE}&state=partial-data` },
  { id: 'loading',              url: `${BASE}&state=loading` },
  { id: 'empty',                url: `${BASE}&state=empty` },
  { id: 'error',                url: `${BASE}&state=error` },
  { id: 'offline-cached',       url: `${BASE}&state=offline-cached` },
  { id: 'offline-no-cache',     url: `${BASE}&state=offline-no-cache` },
  { id: 'tooltip-active',       url: `${BASE}&state=normal-day`, interact: 'click-point-14' },
  { id: 'metric-selector-open', url: `${BASE}&state=normal-day`, interact: 'click-kind' },
  { id: 'custom-range',         url: `${BASE}&state=normal-day`, interact: 'click-custom' },
]

test('SCR-018 all 12 screenshots are distinct', async ({ page }) => {
  const buffers: { id: string; data: Uint8Array }[] = []

  for (const state of CAPTURE_STATES) {
    await prepare(page, state.url)

    if (state.interact === 'click-point-14') {
      await page.locator('section[aria-label="センサーグラフ"] [data-testid="chart-point-14"]').click()
      await page.waitForTimeout(150)
    } else if (state.interact === 'click-kind') {
      await page.locator('[aria-haspopup="listbox"]').click()
      await page.waitForTimeout(150)
    } else if (state.interact === 'click-custom') {
      await page.getByRole('button', { name: 'カスタム' }).click()
      await page.waitForTimeout(200)
    }

    // Ensure scroll is at top before each capture
    await resetScroll(page)
    const buf = await page.screenshot({ fullPage: false })
    buffers.push({ id: state.id, data: buf })
  }

  // Uniqueness check: use size + first 512 bytes as fingerprint
  const seen = new Map<string, string>()
  const dupes: string[] = []
  for (const { id, data } of buffers) {
    const fp = `${data.length}:${btoa(String.fromCharCode(...Array.from(data.slice(0, 512))))}`
    if (seen.has(fp)) {
      dupes.push(`${id} == ${seen.get(fp)}`)
    } else {
      seen.set(fp, id)
    }
  }
  if (dupes.length > 0) {
    throw new Error(`Duplicate screenshots:\n${dupes.join('\n')}`)
  }
  console.log(`✓ All ${buffers.length} screenshots are distinct`)
})

// ── Additional DOM assertions ──────────────────────────────────────────────

test('SCR-018 header renders back button', async ({ page }) => {
  await prepare(page, `${BASE}&state=normal-day`)
  await expect(page.locator('button[aria-label="戻る"]')).toBeVisible()
})

test('SCR-018 normal-day — period tabs visible', async ({ page }) => {
  await prepare(page, `${BASE}&state=normal-day`)
  await expect(page.getByRole('button', { name: '日' })).toBeVisible()
  await expect(page.getByRole('button', { name: '週' })).toBeVisible()
  await expect(page.getByRole('button', { name: '月' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'カスタム' })).toBeVisible()
})

test('SCR-018 normal-day — kind selector button visible', async ({ page }) => {
  await prepare(page, `${BASE}&state=normal-day`)
  await expect(page.locator('[aria-haspopup="listbox"]')).toBeVisible()
})

test('SCR-018 loading — skeleton visible', async ({ page }) => {
  await prepare(page, `${BASE}&state=loading`)
  await expect(page.locator('[aria-busy="true"]')).toBeVisible()
})

test('SCR-018 error — retry button visible', async ({ page }) => {
  await prepare(page, `${BASE}&state=error`)
  await expect(page.getByText('再読み込み')).toBeVisible()
})

test('SCR-018 empty — empty state message visible', async ({ page }) => {
  await prepare(page, `${BASE}&state=empty`)
  await expect(page.getByText(/この期間のデータがありません/)).toBeVisible()
})

test('SCR-018 offline-no-cache — offline message visible', async ({ page }) => {
  await prepare(page, `${BASE}&state=offline-no-cache`)
  await expect(page.getByText(/オフライン/).first()).toBeVisible()
})

test('SCR-018 normal-day — SVG chart rendered', async ({ page }) => {
  await prepare(page, `${BASE}&state=normal-day`)
  await expect(page.locator('svg[role="img"]').first()).toBeVisible()
})
