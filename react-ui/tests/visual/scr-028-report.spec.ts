import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5174'

// ── helpers ──────────────────────────────────────────────────────────────────

async function gotoReport(page: import('@playwright/test').Page, state = 'normal') {
  await page.goto(`${BASE}/?screen=report&state=${state}&devbar=0`)
  await page.waitForLoadState('networkidle')
}

// ── SCR-028 visual tests ──────────────────────────────────────────────────────

test('SCR-028 normal — default Sep 2026', async ({ page }) => {
  await gotoReport(page, 'normal')
  // Wait for KPI values to appear
  await page.waitForSelector('text=収穫量')
  await expect(page).toHaveScreenshot('scr-028-normal.png', { fullPage: false })
})

test('SCR-028 normal — yearly mode', async ({ page }) => {
  await gotoReport(page, 'normal')
  await page.waitForSelector('text=月次')
  await page.getByRole('button', { name: '年次' }).click()
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('scr-028-yearly.png', { fullPage: false })
})

test('SCR-028 normal — apiary filter', async ({ page }) => {
  await gotoReport(page, 'normal')
  await page.waitForSelector('text=全体')
  await page.getByRole('button', { name: '養蜂場別' }).click()
  await page.waitForTimeout(100)
  // Select first apiary from dropdown
  const select = page.locator('select')
  await select.selectOption({ index: 1 })
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('scr-028-apiary-filter.png', { fullPage: false })
})

test('SCR-028 normal — prev month navigation', async ({ page }) => {
  await gotoReport(page, 'normal')
  await page.waitForSelector('text=2026年9月')
  await page.getByRole('button', { name: '前の期間' }).click()
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('scr-028-prev-month.png', { fullPage: false })
})

test('SCR-028 loading state', async ({ page }) => {
  await gotoReport(page, 'loading')
  await page.waitForSelector('text=レポートを生成中')
  await expect(page).toHaveScreenshot('scr-028-loading.png', { fullPage: false })
})

test('SCR-028 empty state', async ({ page }) => {
  await gotoReport(page, 'empty')
  await page.waitForSelector('text=この期間のデータがありません')
  await expect(page).toHaveScreenshot('scr-028-empty.png', { fullPage: false })
})

test('SCR-028 error state', async ({ page }) => {
  await gotoReport(page, 'error')
  await page.waitForSelector('text=データを取得できません')
  await expect(page).toHaveScreenshot('scr-028-error.png', { fullPage: false })
})

test('SCR-028 offline state', async ({ page }) => {
  await gotoReport(page, 'offline')
  await page.waitForSelector('text=オフライン')
  await expect(page).toHaveScreenshot('scr-028-offline.png', { fullPage: false })
})

test('SCR-028 offline-no-cache state', async ({ page }) => {
  await gotoReport(page, 'offline-no-cache')
  await page.waitForSelector('text=オフラインです')
  await expect(page).toHaveScreenshot('scr-028-offline-no-cache.png', { fullPage: false })
})

test('SCR-028 analytics tab via BottomNav', async ({ page }) => {
  // Navigate via analytics tab in BottomNav (tab=analytics shows ReportScreen)
  await page.goto(`${BASE}/?tab=analytics&devbar=0`)
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('text=収穫量')
  await expect(page).toHaveScreenshot('scr-028-via-bottomnav.png', { fullPage: false })
})

test('SCR-028 KPI values visible for Sep 2026', async ({ page }) => {
  await gotoReport(page, 'normal')
  await page.waitForSelector('text=収穫量')
  // Verify KPI values are rendered
  const body = page.locator('body')
  await expect(body).toContainText('収穫量')
  await expect(body).toContainText('作業件数')
  await expect(body).toContainText('内検実施率')
  await expect(body).toContainText('AI異常検知')
})

test('SCR-028 charts visible', async ({ page }) => {
  await gotoReport(page, 'normal')
  await page.waitForSelector('text=月別収穫量')
  const body = page.locator('body')
  await expect(body).toContainText('月別収穫量')
  await expect(body).toContainText('群勢スコア推移')
})
