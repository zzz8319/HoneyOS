import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173/?screen=onboarding-2&devbar=0'

async function scrollToTop(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    document.documentElement.style.scrollBehavior = 'auto'
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    document.querySelectorAll('[class*="body"], [class*="form"]').forEach(el => {
      (el as HTMLElement).scrollTop = 0
    })
  })
  await page.waitForFunction(() => window.scrollY === 0)
}

test('SCR-004 onboarding2 — normal', async ({ page }) => {
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await scrollToTop(page)
  await expect(page).toHaveScreenshot('scr-004-normal.png')
})

test('SCR-004 onboarding2 — filled', async ({ page }) => {
  await page.goto(`${BASE}&state=filled`)
  await page.waitForLoadState('networkidle')
  await scrollToTop(page)
  await expect(page).toHaveScreenshot('scr-004-filled.png')
})

test('SCR-004 onboarding2 — location-selected', async ({ page }) => {
  await page.goto(`${BASE}&state=location-selected`)
  await page.waitForLoadState('networkidle')
  await scrollToTop(page)
  await expect(page).toHaveScreenshot('scr-004-location-selected.png')
})

test('SCR-004 onboarding2 — quantity-adjusted', async ({ page }) => {
  await page.goto(`${BASE}&state=quantity-adjusted`)
  await page.waitForLoadState('networkidle')
  await scrollToTop(page)
  await expect(page).toHaveScreenshot('scr-004-quantity-adjusted.png')
})

test('SCR-004 onboarding2 — colony-names-expanded', async ({ page }) => {
  await page.goto(`${BASE}&state=colony-names-expanded`)
  await page.waitForLoadState('networkidle')
  await scrollToTop(page)
  await expect(page).toHaveScreenshot('scr-004-colony-names-expanded.png')
})

test('SCR-004 onboarding2 — submitting', async ({ page }) => {
  await page.goto(`${BASE}&state=submitting`)
  await page.waitForLoadState('networkidle')
  await scrollToTop(page)
  await expect(page).toHaveScreenshot('scr-004-submitting.png')
})

test('SCR-004 onboarding2 — error', async ({ page }) => {
  await page.goto(`${BASE}&state=error`)
  await page.waitForLoadState('networkidle')
  await scrollToTop(page)
  await expect(page).toHaveScreenshot('scr-004-error.png')
})

test('SCR-004 onboarding2 — offline', async ({ page }) => {
  await page.goto(`${BASE}&state=offline`)
  await page.waitForLoadState('networkidle')
  await scrollToTop(page)
  await expect(page).toHaveScreenshot('scr-004-offline.png')
})

test('SCR-004 onboarding2 — BottomNavが表示されない', async ({ page }) => {
  await page.goto(BASE)
  await expect(page.locator('nav[aria-label]')).not.toBeVisible()
})

test('SCR-004 onboarding2 — ヘッダー要素が表示される', async ({ page }) => {
  await page.goto(BASE)
  await expect(page.getByRole('button', { name: '戻る' })).toBeVisible()
  await expect(page.getByText('2 / 3')).toBeVisible()
  await expect(page.getByRole('button', { name: 'スキップ' })).toBeVisible()
})

test('SCR-004 onboarding2 — 主要コンテンツが表示される', async ({ page }) => {
  await page.goto(BASE)
  await expect(page.getByText('養蜂場を設定')).toBeVisible()
  await expect(page.getByLabel('養蜂場名')).toBeVisible()
  await expect(page.getByLabel('所在地')).toBeVisible()
})

test('SCR-004 onboarding2 — 保存ボタンとスキップリンクが表示される', async ({ page }) => {
  await page.goto(BASE)
  await expect(page.getByRole('button', { name: '設定して次へ' })).toBeVisible()
  await expect(page.getByRole('button', { name: '今は設定しない' })).toBeVisible()
})
