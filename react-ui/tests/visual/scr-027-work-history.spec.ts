import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173'

function url(state: string) {
  return `${BASE}/?screen=work-history&state=${state}&devbar=0`
}

test('SCR-027 normal', async ({ page }) => {
  await page.goto(url('normal'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-027-normal.png')
})

test('SCR-027 normal-bottom', async ({ page }) => {
  await page.goto(url('normal'))
  await page.waitForLoadState('networkidle')
  await page.getByTestId('work-history-body').evaluate(el => { el.scrollTop = el.scrollHeight })
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('scr-027-normal-bottom.png')
})

test('SCR-027 filtered-feeding', async ({ page }) => {
  await page.goto(url('filtered-feeding'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-027-filtered-feeding.png')
})

test('SCR-027 filtered-apiary', async ({ page }) => {
  await page.goto(url('filtered-apiary'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-027-filtered-apiary.png')
})

test('SCR-027 filtered-colony', async ({ page }) => {
  await page.goto(url('filtered-colony'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-027-filtered-colony.png')
})

test('SCR-027 filtered-period', async ({ page }) => {
  await page.goto(url('filtered-period'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-027-filtered-period.png')
})

test('SCR-027 search-results', async ({ page }) => {
  await page.goto(url('search-results'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-027-search-results.png')
})

test('SCR-027 empty', async ({ page }) => {
  await page.goto(url('empty'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-027-empty.png')
})

test('SCR-027 no-results', async ({ page }) => {
  await page.goto(url('no-results'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-027-no-results.png')
})

test('SCR-027 loading', async ({ page }) => {
  await page.goto(url('loading'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-027-loading.png')
})

test('SCR-027 error', async ({ page }) => {
  await page.goto(url('error'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-027-error.png')
})

test('SCR-027 offline', async ({ page }) => {
  await page.goto(url('offline'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-027-offline.png')
})

test('SCR-027 offline-no-cache', async ({ page }) => {
  await page.goto(url('offline-no-cache'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-027-offline-no-cache.png')
})

test('SCR-027 filter-menu', async ({ page }) => {
  await page.goto(url('filter-menu'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-027-filter-menu.png')
})

test('SCR-027 search-open', async ({ page }) => {
  await page.goto(url('search-open'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-027-search-open.png')
})
