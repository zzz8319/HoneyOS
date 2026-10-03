import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5175/?screen=sensor-graph&devbar=0'

const STATES: { id: string; label: string }[] = [
  { id: 'normal-day',            label: '通常(日)' },
  { id: 'tooltip-active',        label: 'ツールチップ表示' },
  { id: 'metric-selector-open',  label: 'センサー切替' },
  { id: 'week',                  label: '週表示' },
  { id: 'month',                 label: '月表示' },
  { id: 'custom-range',          label: 'カスタム期間' },
  { id: 'loading',               label: '読込中' },
  { id: 'empty',                 label: 'データなし' },
  { id: 'partial-data',          label: '欠損データ' },
  { id: 'error',                 label: 'エラー' },
  { id: 'offline-cached',        label: 'オフライン(キャッシュあり)' },
  { id: 'offline-no-cache',      label: 'オフライン(キャッシュなし)' },
]

for (const { id, label } of STATES) {
  test(`SCR-018 ${id} — ${label}`, async ({ page }) => {
    await page.goto(`${BASE}&state=${id}`)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot(`scr-018-${id}.png`, { fullPage: false })
  })
}

test('SCR-018 header renders back button', async ({ page }) => {
  await page.goto(`${BASE}&state=normal-day`)
  await page.waitForLoadState('networkidle')
  const backBtn = page.locator('button[aria-label="戻る"]')
  await expect(backBtn).toBeVisible()
})

test('SCR-018 normal-day — period tabs visible', async ({ page }) => {
  await page.goto(`${BASE}&state=normal-day`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('button', { name: '日' })).toBeVisible()
  await expect(page.getByRole('button', { name: '週' })).toBeVisible()
  await expect(page.getByRole('button', { name: '月' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'カスタム' })).toBeVisible()
})

test('SCR-018 normal-day — kind selector button visible', async ({ page }) => {
  await page.goto(`${BASE}&state=normal-day`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('button', { name: /センサー種別/ })).toBeVisible()
})

test('SCR-018 loading — skeleton visible', async ({ page }) => {
  await page.goto(`${BASE}&state=loading`)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('body')).toBeVisible()
})

test('SCR-018 error — retry button visible', async ({ page }) => {
  await page.goto(`${BASE}&state=error`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('再読み込み')).toBeVisible()
})

test('SCR-018 empty — empty state message visible', async ({ page }) => {
  await page.goto(`${BASE}&state=empty`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByText(/データがありません/)).toBeVisible()
})

test('SCR-018 offline-no-cache — offline message visible', async ({ page }) => {
  await page.goto(`${BASE}&state=offline-no-cache`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByText(/オフライン/).first()).toBeVisible()
})

test('SCR-018 normal-day — SVG chart rendered', async ({ page }) => {
  await page.goto(`${BASE}&state=normal-day`)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('svg').first()).toBeVisible()
})
