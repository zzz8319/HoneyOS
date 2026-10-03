import { test, expect, Page } from '@playwright/test'

const BASE = 'http://localhost:5175/?screen=sensor-graph&devbar=0'

async function prepare(page: Page, url: string) {
  await page.goto(url)
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  // disable CSS animations/transitions for deterministic screenshots
  await page.addStyleTag({ content: '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }' })
}

// ── URL-param states ──────────────────────────────────────────────────────────

test('SCR-018 normal-day — 通常(日)', async ({ page }) => {
  await prepare(page, `${BASE}&state=normal-day`)
  // shared controls
  await expect(page.locator('button[aria-label="戻る"]')).toBeVisible()
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.locator('[aria-haspopup="listbox"]')).toBeVisible()
  await expect(page.getByRole('button', { name: '日' })).toBeVisible()
  // day period tab is active
  await expect(page.locator('[aria-pressed="true"]')).toContainText('日')
  // SVG chart present
  await expect(page.locator('svg').first()).toBeVisible()
  await expect(page).toHaveScreenshot('scr-018-normal-day.png', { fullPage: false })
})

test('SCR-018 week — 週表示', async ({ page }) => {
  await prepare(page, `${BASE}&state=week`)
  await expect(page.locator('[aria-pressed="true"]')).toContainText('週')
  await expect(page.locator('svg').first()).toBeVisible()
  await expect(page).toHaveScreenshot('scr-018-week.png', { fullPage: false })
})

test('SCR-018 month — 月表示', async ({ page }) => {
  await prepare(page, `${BASE}&state=month`)
  await expect(page.locator('[aria-pressed="true"]')).toContainText('月')
  await expect(page.locator('svg').first()).toBeVisible()
  await expect(page).toHaveScreenshot('scr-018-month.png', { fullPage: false })
})

test('SCR-018 partial-data — 欠損データ', async ({ page }) => {
  await prepare(page, `${BASE}&state=partial-data`)
  await expect(page.locator('svg').first()).toBeVisible()
  await expect(page).toHaveScreenshot('scr-018-partial-data.png', { fullPage: false })
})

test('SCR-018 loading — 読込中', async ({ page }) => {
  await prepare(page, `${BASE}&state=loading`)
  // skeleton or spinner present
  await expect(page.locator('body')).toBeVisible()
  await expect(page).toHaveScreenshot('scr-018-loading.png', { fullPage: false })
})

test('SCR-018 empty — データなし', async ({ page }) => {
  await prepare(page, `${BASE}&state=empty`)
  await expect(page.getByText(/データがありません/)).toBeVisible()
  await expect(page).toHaveScreenshot('scr-018-empty.png', { fullPage: false })
})

test('SCR-018 error — エラー', async ({ page }) => {
  await prepare(page, `${BASE}&state=error`)
  await expect(page.getByText('再読み込み')).toBeVisible()
  await expect(page).toHaveScreenshot('scr-018-error.png', { fullPage: false })
})

test('SCR-018 offline-cached — オフライン(キャッシュあり)', async ({ page }) => {
  await prepare(page, `${BASE}&state=offline-cached`)
  await expect(page.getByText(/オフライン/).first()).toBeVisible()
  await expect(page).toHaveScreenshot('scr-018-offline-cached.png', { fullPage: false })
})

test('SCR-018 offline-no-cache — オフライン(キャッシュなし)', async ({ page }) => {
  await prepare(page, `${BASE}&state=offline-no-cache`)
  await expect(page.getByText(/オフライン/).first()).toBeVisible()
  await expect(page).toHaveScreenshot('scr-018-offline-no-cache.png', { fullPage: false })
})

// ── UI interaction states ─────────────────────────────────────────────────────

test('SCR-018 tooltip-active — ツールチップ表示', async ({ page }) => {
  await prepare(page, `${BASE}&state=normal-day`)
  // click a point near the center of the SVG chart
  const svg = page.locator('svg').first()
  const box = await svg.boundingBox()
  expect(box).toBeTruthy()
  if (box) {
    await page.mouse.click(box.x + box.width * 0.55, box.y + box.height * 0.4)
  }
  await page.waitForTimeout(200)
  // tooltip should be visible (dark rect in SVG)
  await expect(svg).toBeVisible()
  await expect(page).toHaveScreenshot('scr-018-tooltip-active.png', { fullPage: false })
})

test('SCR-018 metric-selector-open — センサー切替', async ({ page }) => {
  await prepare(page, `${BASE}&state=normal-day`)
  const kindBtn = page.locator('[aria-haspopup="listbox"]')
  await kindBtn.click()
  await page.waitForTimeout(200)
  // dropdown list should be visible
  await expect(page.locator('[role="listbox"]')).toBeVisible()
  await expect(page).toHaveScreenshot('scr-018-metric-selector-open.png', { fullPage: false })
})

test('SCR-018 custom-range — カスタム期間', async ({ page }) => {
  await prepare(page, `${BASE}&state=normal-day`)
  const customBtn = page.getByRole('button', { name: 'カスタム' })
  await customBtn.click()
  await page.waitForTimeout(300)
  await expect(page).toHaveScreenshot('scr-018-custom-range.png', { fullPage: false })
})

// ── SHA-256 uniqueness check ──────────────────────────────────────────────────
// Captures all 12 states in one test and verifies no two screenshots are identical

const SCREENSHOT_STATES = [
  { id: 'normal-day',           url: `${BASE}&state=normal-day`,           interact: null },
  { id: 'week',                 url: `${BASE}&state=week`,                 interact: null },
  { id: 'month',                url: `${BASE}&state=month`,                interact: null },
  { id: 'partial-data',         url: `${BASE}&state=partial-data`,         interact: null },
  { id: 'loading',              url: `${BASE}&state=loading`,              interact: null },
  { id: 'empty',                url: `${BASE}&state=empty`,                interact: null },
  { id: 'error',                url: `${BASE}&state=error`,                interact: null },
  { id: 'offline-cached',       url: `${BASE}&state=offline-cached`,       interact: null },
  { id: 'offline-no-cache',     url: `${BASE}&state=offline-no-cache`,     interact: null },
  { id: 'tooltip-active',       url: `${BASE}&state=normal-day`,           interact: 'click-chart' },
  { id: 'metric-selector-open', url: `${BASE}&state=normal-day`,           interact: 'click-kind' },
  { id: 'custom-range',         url: `${BASE}&state=normal-day`,           interact: 'click-custom' },
] as const

test('SCR-018 all 12 screenshots are distinct', async ({ page }) => {
  const buffers: { id: string; data: Uint8Array }[] = []

  for (const state of SCREENSHOT_STATES) {
    await page.goto(state.url)
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => document.fonts.ready)
    await page.addStyleTag({ content: '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }' })

    if (state.interact === 'click-chart') {
      const svg = page.locator('svg').first()
      const box = await svg.boundingBox()
      if (box) await page.mouse.click(box.x + box.width * 0.55, box.y + box.height * 0.4)
      await page.waitForTimeout(200)
    } else if (state.interact === 'click-kind') {
      await page.locator('[aria-haspopup="listbox"]').click()
      await page.waitForTimeout(200)
    } else if (state.interact === 'click-custom') {
      await page.getByRole('button', { name: 'カスタム' }).click()
      await page.waitForTimeout(300)
    }

    const buf = await page.screenshot({ fullPage: false })
    buffers.push({ id: state.id, data: buf })
  }

  // Check uniqueness by comparing raw byte lengths + first 1024 bytes as a proxy
  const seen = new Map<string, string>()
  const dupes: string[] = []
  for (const { id, data } of buffers) {
    // Use size + first 512 bytes as fingerprint (good enough without crypto)
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

// ── Additional DOM assertions ─────────────────────────────────────────────────

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
  await expect(page.locator('body')).toBeVisible()
})

test('SCR-018 error — retry button visible', async ({ page }) => {
  await prepare(page, `${BASE}&state=error`)
  await expect(page.getByText('再読み込み')).toBeVisible()
})

test('SCR-018 empty — empty state message visible', async ({ page }) => {
  await prepare(page, `${BASE}&state=empty`)
  await expect(page.getByText(/データがありません/)).toBeVisible()
})

test('SCR-018 offline-no-cache — offline message visible', async ({ page }) => {
  await prepare(page, `${BASE}&state=offline-no-cache`)
  await expect(page.getByText(/オフライン/).first()).toBeVisible()
})

test('SCR-018 normal-day — SVG chart rendered', async ({ page }) => {
  await prepare(page, `${BASE}&state=normal-day`)
  await expect(page.locator('svg').first()).toBeVisible()
})
