import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173/?screen=signup&devbar=0'

const states = [
  'normal',
  'filled',
  'password-visible',
  'validation-error',
  'signup-error',
  'offline',
  'confirmation-sent',
] as const

async function resetScroll(page: import('@playwright/test').Page) {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
  document.querySelectorAll('form, [class*="form"]').forEach(el => {
    (el as HTMLElement).scrollTop = 0
  })
}

for (const state of states) {
  test(`SCR-002 signup — ${state}`, async ({ page }) => {
    await page.goto(`${BASE}&state=${state}`)
    await page.waitForLoadState('networkidle')
    await page.evaluate(resetScroll)
    await page.waitForFunction(() => window.scrollY === 0)
    await expect(page).toHaveScreenshot(`scr-002-${state}.png`)
  })
}

test('SCR-002 signup — submitting', async ({ page }) => {
  await page.goto(`${BASE}&state=submitting`)
  await page.waitForLoadState('networkidle')

  // 1. activeElement が入力欄またはボタンなら blur
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  })
  // 2. スムーススクロールを無効化
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto'
  })
  // 3. 先頭へスクロール
  await page.evaluate(() => { window.scrollTo(0, 0) })
  // 4. requestAnimationFrame を2回待つ
  await page.evaluate(() => new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  }))
  // 5. もう一度スクロールリセット
  await page.evaluate(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    document.querySelectorAll('form, [class*="form"]').forEach(el => {
      (el as HTMLElement).scrollTop = 0
    })
  })
  // 6. scrollY === 0 をアサート（失敗時は撮影しない）
  const scrollY = await page.evaluate(() => window.scrollY)
  expect(scrollY, `window.scrollY must be 0 before screenshot, got ${scrollY}`).toBe(0)

  // 7. 撮影
  await expect(page).toHaveScreenshot('scr-002-submitting.png')
})

test('SCR-002 signup — header title is 新規登録', async ({ page }) => {
  await page.goto(`http://localhost:5173/?screen=signup&devbar=0`)
  await expect(page.getByRole('heading', { name: '新規登録' })).toBeVisible()
})

test('SCR-002 signup — back button exists', async ({ page }) => {
  await page.goto(BASE)
  await expect(page.getByRole('button', { name: '戻る' })).toBeVisible()
})

test('SCR-002 signup — required fields present', async ({ page }) => {
  await page.goto(BASE)
  await expect(page.getByPlaceholder('例：川添 良太')).toBeVisible()
  await expect(page.getByPlaceholder('例：ryota@example.com')).toBeVisible()
  await expect(page.getByPlaceholder('パスワードを入力')).toBeVisible()
  await expect(page.getByPlaceholder('例：宮田養蜂場')).toBeVisible()
})

test('SCR-002 signup — password toggle works', async ({ page }) => {
  await page.goto(BASE)
  const pw = page.getByPlaceholder('パスワードを入力')
  await pw.fill('secret123')
  await expect(pw).toHaveAttribute('type', 'password')
  await page.getByRole('button', { name: 'パスワードを表示' }).click()
  await expect(pw).toHaveAttribute('type', 'text')
})

test('SCR-002 signup — validation errors on empty submit', async ({ page }) => {
  await page.goto(BASE)
  await page.getByRole('button', { name: 'アカウントを作成' }).click()
  await expect(page.getByText('名前を入力してください')).toBeVisible()
  await expect(page.getByText('メールアドレスを入力してください')).toBeVisible()
  await expect(page.getByText('パスワードを入力してください')).toBeVisible()
})

test('SCR-002 signup — login link navigates back to login screen', async ({ page }) => {
  await page.goto(BASE)
  await page.getByRole('button', { name: 'ログイン' }).click()
  // login screen shows email input (no dedicated heading in LoginScreen)
  await expect(page.getByPlaceholder('例：ryota@example.com')).toBeVisible()
  // signup form should be gone
  await expect(page.getByRole('button', { name: 'アカウントを作成' })).not.toBeVisible()
})
