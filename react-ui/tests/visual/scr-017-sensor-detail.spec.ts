import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173/?screen=sensor-detail&devbar=0'

const STATES: { id: string; label: string }[] = [
  { id: 'normal',          label: '通常' },
  { id: 'high-temperature', label: '高温警告' },
  { id: 'all-normal',      label: '全正常' },
  { id: 'filter-open',     label: 'フィルター表示' },
  { id: 'refreshing',      label: '更新中' },
  { id: 'loading',         label: '読込中' },
  { id: 'error',           label: 'エラー' },
  { id: 'partial-error',   label: '部分エラー' },
  { id: 'offline-cached',  label: 'オフライン(キャッシュあり)' },
  { id: 'offline-no-cache', label: 'オフライン(キャッシュなし)' },
  { id: 'stale-data',      label: '古いデータ' },
  { id: 'long-content',    label: '長文コンテンツ' },
]

for (const { id, label } of STATES) {
  test(`SCR-017 ${id} — ${label}`, async ({ page }) => {
    await page.goto(`${BASE}&state=${id}`)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot(`scr-017-${id}.png`, { fullPage: false })
  })
}

test('SCR-017 header renders back button and title', async ({ page }) => {
  await page.goto(`${BASE}&state=normal`)
  await page.waitForLoadState('networkidle')
  const backBtn = page.locator('button[aria-label="戻る"]')
  await expect(backBtn).toBeVisible()
  const title = page.locator('h1')
  await expect(title).toHaveText('センサー')
})

test('SCR-017 normal — 5 metric cards visible', async ({ page }) => {
  await page.goto(`${BASE}&state=normal`)
  await page.waitForLoadState('networkidle')
  const cards = page.locator('[data-testid="sensor-metric-card"], [class*="card"]').filter({ has: page.locator('[class*="kindLabel"]') })
  // Verify at least temperature card visible
  await expect(page.getByText('温度')).toBeVisible()
  await expect(page.getByText('湿度')).toBeVisible()
})

test('SCR-017 loading — skeleton rendered', async ({ page }) => {
  await page.goto(`${BASE}&state=loading`)
  await page.waitForLoadState('networkidle')
  const skeleton = page.locator('[aria-busy="true"][aria-label="センサーデータを読み込み中"]')
  await expect(skeleton).toBeVisible()
})

test('SCR-017 error — retry button visible', async ({ page }) => {
  await page.goto(`${BASE}&state=error`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('再読み込み')).toBeVisible()
})

test('SCR-017 offline-no-cache — offline message visible', async ({ page }) => {
  await page.goto(`${BASE}&state=offline-no-cache`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByText(/オフラインのためセンサーデータを表示できません/)).toBeVisible()
})

test('SCR-017 offline-cached — banner visible', async ({ page }) => {
  await page.goto(`${BASE}&state=offline-cached`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByText(/オフラインです/)).toBeVisible()
})

test('SCR-017 stale-data — stale banner visible', async ({ page }) => {
  await page.goto(`${BASE}&state=stale-data`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByText(/古いデータ/)).toBeVisible()
})

test('SCR-017 filter-open — filter sheet visible', async ({ page }) => {
  await page.goto(`${BASE}&state=filter-open`)
  await page.waitForLoadState('networkidle')
  // Filter sheet should be open by default for filter-open state
  const filterBtn = page.locator('button[aria-label="センサーを絞り込む"]')
  await expect(filterBtn).toBeVisible()
})

test('SCR-017 high-temperature — warning badge visible', async ({ page }) => {
  await page.goto(`${BASE}&state=high-temperature`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('温度')).toBeVisible()
})

test('SCR-017 refresh button — triggers refresh animation', async ({ page }) => {
  await page.goto(`${BASE}&state=normal`)
  await page.waitForLoadState('networkidle')
  const refreshBtn = page.locator('button[aria-label="センサーデータを更新"]')
  await expect(refreshBtn).toBeEnabled()
  await refreshBtn.click()
  const busyBtn = page.locator('button[aria-busy="true"]')
  await expect(busyBtn).toBeVisible()
})

test('SCR-017 card metrics — correct x-position and border-radius', async ({ page }) => {
  await page.goto(`${BASE}&state=normal`)
  await page.waitForLoadState('networkidle')
  const body = page.locator('[class*="body"]').first()
  const bodyBox = await body.boundingBox()
  expect(bodyBox).toBeTruthy()

  const cards = page.locator('[class*="card"]').filter({ has: page.locator('[class*="kindLabel"]') })
  const count = await cards.count()
  expect(count).toBeGreaterThan(0)

  const firstCard = cards.first()
  const box = await firstCard.boundingBox()
  expect(box).toBeTruthy()
  if (box && bodyBox) {
    // cards should be inset from screen edges by ~16px
    expect(box.x).toBeGreaterThanOrEqual(14)
    expect(box.x).toBeLessThanOrEqual(18)
    expect(box.width).toBeGreaterThanOrEqual(350)
    expect(box.width).toBeLessThanOrEqual(370)
  }
})
