import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173/?screen=onboarding-1&devbar=0'

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

test('SCR-003 onboarding1 — normal', async ({ page }) => {
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await scrollToTop(page)
  await expect(page).toHaveScreenshot('scr-003-normal.png')
})

test('SCR-003 onboarding1 — BottomNavが表示されない', async ({ page }) => {
  await page.goto(BASE)
  await expect(page.locator('nav[aria-label]')).not.toBeVisible()
})

test('SCR-003 onboarding1 — ヘッダー要素が表示される', async ({ page }) => {
  await page.goto(BASE)
  await expect(page.getByRole('button', { name: '戻る' })).toBeVisible()
  await expect(page.getByText('1 / 3')).toBeVisible()
  await expect(page.getByRole('button', { name: 'スキップ' })).toBeVisible()
})

test('SCR-003 onboarding1 — 主要コンテンツが表示される', async ({ page }) => {
  await page.goto(BASE)
  await expect(page.getByText('養蜂管理を、ひとつに')).toBeVisible()
  await expect(page.getByText('記録・分析・予定管理で、養蜂をもっとシンプルに。')).toBeVisible()
  await expect(page.getByText('内検をすばやく記録')).toBeVisible()
  await expect(page.getByText('蜂群の変化を見える化')).toBeVisible()
  await expect(page.getByText('作業と予定をまとめて管理')).toBeVisible()
  await expect(page.getByRole('button', { name: '次へ' })).toBeVisible()
})

test('SCR-003 onboarding1 — 次へでホーム画面へ遷移', async ({ page }) => {
  await page.goto(BASE)
  await page.getByRole('button', { name: '次へ' }).click()
  // ホーム画面（DashboardScreen）へ遷移 — オンボーディング画面が消える
  await expect(page.getByText('養蜂管理を、ひとつに')).not.toBeVisible()
})

test('SCR-003 onboarding1 — スキップでホーム画面へ遷移', async ({ page }) => {
  await page.goto(BASE)
  await page.getByRole('button', { name: 'スキップ' }).click()
  await expect(page.getByText('養蜂管理を、ひとつに')).not.toBeVisible()
})

test('SCR-003 onboarding1 — 戻るでSCR-002に遷移', async ({ page }) => {
  await page.goto(BASE)
  await page.getByRole('button', { name: '戻る' }).click()
  // SignupScreen に遷移 — アカウントを作成ボタンが表示される
  await expect(page.getByRole('button', { name: 'アカウントを作成' })).toBeVisible()
})

test('SCR-003 onboarding1 — 横スクロールなし', async ({ page }) => {
  await page.goto(BASE)
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(390)
})
