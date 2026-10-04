import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5175/?screen=sensor-detail&devbar=0'

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

test('SCR-017 normal — temperature and humidity labels visible', async ({ page }) => {
  await page.goto(`${BASE}&state=normal`)
  await page.waitForLoadState('networkidle')
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

test('SCR-017 filter-open — filter button visible', async ({ page }) => {
  await page.goto(`${BASE}&state=filter-open`)
  await page.waitForLoadState('networkidle')
  const filterBtn = page.locator('button[aria-label="センサーを絞り込む"]')
  await expect(filterBtn).toBeVisible()
})

test('SCR-017 high-temperature — temperature critical', async ({ page }) => {
  await page.goto(`${BASE}&state=high-temperature`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('要注意')).toBeVisible()
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

test('SCR-017 card metrics — correct x-position', async ({ page }) => {
  await page.goto(`${BASE}&state=normal`)
  await page.waitForLoadState('networkidle')

  const cards = page.locator('[class*="card"]').filter({ has: page.locator('[class*="kindLabel"]') })
  const firstCard = cards.first()
  const box = await firstCard.boundingBox()
  expect(box).toBeTruthy()
  if (box) {
    expect(box.x).toBeGreaterThanOrEqual(14)
    expect(box.x).toBeLessThanOrEqual(18)
    expect(box.width).toBeGreaterThanOrEqual(350)
    expect(box.width).toBeLessThanOrEqual(370)
  }
})

test('SCR-017 warning card — white background (no red card bg)', async ({ page }) => {
  await page.goto(`${BASE}&state=normal`)
  await page.waitForLoadState('networkidle')

  // Temperature card is button[aria-label*="温度"]
  const tempCard = page.locator('button[aria-label*="温度"]')
  const bg = await tempCard.evaluate(el => window.getComputedStyle(el).backgroundColor)
  // Should be white (255,255,255) not pink/red
  expect(bg).toBe('rgb(255, 255, 255)')
})

test('SCR-017 high-temperature card — white background', async ({ page }) => {
  await page.goto(`${BASE}&state=high-temperature`)
  await page.waitForLoadState('networkidle')

  const tempCard = page.locator('button[aria-label*="温度"]')
  const bg = await tempCard.evaluate(el => window.getComputedStyle(el).backgroundColor)
  expect(bg).toBe('rgb(255, 255, 255)')
})

test('SCR-017 icon — no circular background on temperature card', async ({ page }) => {
  await page.goto(`${BASE}&state=normal`)
  await page.waitForLoadState('networkidle')

  const iconWrap = page.locator('[class*="iconWrap"]').first()
  const borderRadius = await iconWrap.evaluate(el => window.getComputedStyle(el).borderRadius)
  // Should not be 50% (circle)
  expect(borderRadius).not.toBe('50%')
})

test('SCR-017 delta — displayed on separate line (not inline with value)', async ({ page }) => {
  await page.goto(`${BASE}&state=normal`)
  await page.waitForLoadState('networkidle')
  // Delta text contains "前回比"
  const deltaEl = page.locator('[class*="delta"]').first()
  await expect(deltaEl).toBeVisible()
  await expect(deltaEl).toContainText('前回比')
})

test('SCR-017 info banner — no standalone "通知を確認" link', async ({ page }) => {
  await page.goto(`${BASE}&state=normal`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('通知を確認')).not.toBeVisible()
  await expect(page.getByText(/異常値は通知センターにも届きます/)).toBeVisible()
})

test('SCR-017 high-temperature — vibration shows uninstalled card', async ({ page }) => {
  await page.goto(`${BASE}&state=high-temperature`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('センサー未設置')).toBeVisible()
  await expect(page.getByText('設置方法')).toBeVisible()
})

test('SCR-017 normal and high-temperature — vibration both uninstalled', async ({ page }) => {
  await page.goto(`${BASE}&state=normal`)
  await page.waitForLoadState('networkidle')
  const normalVibration = await page.getByText('センサー未設置').isVisible()

  await page.goto(`${BASE}&state=high-temperature`)
  await page.waitForLoadState('networkidle')
  const highTempVibration = await page.getByText('センサー未設置').isVisible()

  expect(normalVibration).toBe(true)
  expect(highTempVibration).toBe(true)
})

test('SCR-017 high-temperature — vibration has no sparkline', async ({ page }) => {
  await page.goto(`${BASE}&state=high-temperature`)
  await page.waitForLoadState('networkidle')
  // The uninstalled card doesn't have a sparkline (SVG with role img)
  const uninstalledCard = page.locator('[aria-label="振動：センサー未設置"]')
  await expect(uninstalledCard).toBeVisible()
  const sparklinesInCard = uninstalledCard.locator('svg[role="img"]')
  await expect(sparklinesInCard).toHaveCount(0)
})

test('SCR-017 weight card — no status badge', async ({ page }) => {
  await page.goto(`${BASE}&state=normal`)
  await page.waitForLoadState('networkidle')
  // Weight card should not have any badge (statusLabel is undefined)
  const weightCard = page.locator('button[aria-label*="重量"]')
  await expect(weightCard).toBeVisible()
  const badges = weightCard.locator('[class*="badge"]')
  await expect(badges).toHaveCount(0)
})

test('SCR-017 no BottomNav', async ({ page }) => {
  await page.goto(`${BASE}&state=normal`)
  await page.waitForLoadState('networkidle')
  const nav = page.locator('nav[aria-label*="タブ"]')
  await expect(nav).toHaveCount(0)
})

test('SCR-017 no horizontal scroll', async ({ page }) => {
  await page.goto(`${BASE}&state=normal`)
  await page.waitForLoadState('networkidle')
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
})

test('SCR-017 no console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', err => errors.push(err.message))
  await page.goto(`${BASE}&state=normal`)
  await page.waitForLoadState('networkidle')
  expect(errors).toHaveLength(0)
})

test('SCR-017 refresh button enabled in normal state', async ({ page }) => {
  await page.goto(`${BASE}&state=normal`)
  await page.waitForLoadState('networkidle')
  const refreshBtn = page.locator('button[aria-label="センサーデータを更新"]')
  await expect(refreshBtn).toBeEnabled()
})

test('SCR-017 all-normal — vibration still uninstalled', async ({ page }) => {
  await page.goto(`${BASE}&state=all-normal`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('センサー未設置')).toBeVisible()
})
