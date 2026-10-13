import { test, expect, type Page } from '@playwright/test'

const SCREEN = 'login'
const BASE_URL = `/?screen=${SCREEN}&devbar=0`
const FIXED_NOW = new Date('2026-09-27T10:00:00+09:00')

async function mockHoneyDB(page: Page) {
  await page.addInitScript(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).HoneyDB = {
      signIn: async () => {},
      login: async () => {},
      signOut: async () => {},
      logout: async () => {},
      getSession: async () => ({ user: null }),
      resetPassword: async () => {},
      updatePassword: async () => {},
      getProfile: async () => null,
      getColonies: async () => [],
      saveColony: async () => {},
      deleteColony: async () => {},
      getFarms: async () => [],
      saveFarm: async () => ({ id: 1 }),
      getInspRecords: async () => [],
      saveInspRecord: async () => ({ id: 1 }),
      getWorkRecords: async () => [],
      saveWorkRecord: async () => ({ id: 1 }),
    }
  })
}

async function goto(page: Page, state = '') {
  await page.clock.install({ time: FIXED_NOW })
  await mockHoneyDB(page)
  const url = state ? `${BASE_URL}&state=${state}` : BASE_URL
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
}

async function stabilise(page: Page) {
  await page.mouse.move(2, 2)
  await page.waitForTimeout(150)
}

// ── 1. 通常（初期） ─────────────────────────────────────────────────────────
test('SCR-001 normal', async ({ page }) => {
  await goto(page)
  await expect(page.getByRole('heading', { level: 1 }).or(page.getByText('HoneyOS'))).toBeVisible()
  await expect(page.getByLabel('メールアドレス')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'メインナビゲーション' })).not.toBeVisible()
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-001-normal.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 2. 入力済み ─────────────────────────────────────────────────────────────
test('SCR-001 filled', async ({ page }) => {
  await goto(page, 'filled')
  await expect(page.getByLabel('メールアドレス')).toHaveValue('ryota@example.com')
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-001-filled.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 3. パスワード表示 ────────────────────────────────────────────────────────
test('SCR-001 password-visible', async ({ page }) => {
  await goto(page, 'password-visible')
  await expect(page.getByPlaceholder('パスワードを入力')).toHaveAttribute('type', 'text')
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-001-password-visible.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 4. バリデーションエラー ─────────────────────────────────────────────────
test('SCR-001 validation-error', async ({ page }) => {
  await goto(page, 'validation-error')
  await expect(page.getByText('メールアドレスを入力してください')).toBeVisible()
  await expect(page.getByText('パスワードを入力してください')).toBeVisible()
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-001-validation-error.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 5. 送信中 ────────────────────────────────────────────────────────────────
test('SCR-001 submitting', async ({ page }) => {
  await goto(page, 'submitting')
  const btn = page.getByRole('button', { name: 'ログイン' })
  await expect(btn).toBeDisabled()
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-001-submitting.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 6. 認証エラー ────────────────────────────────────────────────────────────
test('SCR-001 auth-error', async ({ page }) => {
  await goto(page, 'auth-error')
  await expect(page.getByText('メールアドレスまたはパスワードが正しくありません。')).toBeVisible()
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-001-auth-error.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 7. オフライン ────────────────────────────────────────────────────────────
test('SCR-001 offline', async ({ page }) => {
  await goto(page, 'offline')
  await expect(page.getByText('オフラインのため、ログインできません')).toBeVisible()
  await expect(page.getByRole('button', { name: 'ログイン' })).toBeDisabled()
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-001-offline.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 8. ログイン状態を保持OFF ─────────────────────────────────────────────────
test('SCR-001 remember-me-off', async ({ page }) => {
  await goto(page, 'remember-me-off')
  const checkbox = page.getByRole('checkbox')
  await expect(checkbox).not.toBeChecked()
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-001-remember-me-off.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── Functional: no BottomNav ──────────────────────────────────────────────────
test('SCR-001 has no BottomNav', async ({ page }) => {
  await goto(page)
  await expect(page.getByRole('navigation', { name: 'メインナビゲーション' })).not.toBeVisible()
})

// ── Functional: no horizontal scroll ─────────────────────────────────────────
test('SCR-001 no horizontal scroll', async ({ page }) => {
  await goto(page)
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
})

// ── Functional: remember-me checked by default ────────────────────────────────
test('SCR-001 remember-me checked by default', async ({ page }) => {
  await goto(page)
  await expect(page.getByRole('checkbox')).toBeChecked()
})

// ── Functional: password show/hide toggle ─────────────────────────────────────
test('SCR-001 password show/hide toggle', async ({ page }) => {
  await goto(page)
  const pwInput = page.getByPlaceholder('パスワードを入力')
  await expect(pwInput).toHaveAttribute('type', 'password')
  await page.getByRole('button', { name: 'パスワードを表示' }).click()
  await expect(pwInput).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: 'パスワードを隠す' }).click()
  await expect(pwInput).toHaveAttribute('type', 'password')
})

// ── Functional: forgot password navigates to password-reset ───────────────────
test('SCR-001 forgot password link', async ({ page }) => {
  await goto(page)
  await page.getByRole('button', { name: 'パスワードを忘れた方' }).click()
  await page.waitForTimeout(200)
  await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: 'パスワード再設定' })).toBeVisible()
})

// ── Functional: Enter key submits form ────────────────────────────────────────
test('SCR-001 enter key submits', async ({ page }) => {
  await goto(page)
  await page.getByLabel('メールアドレス').fill('ryota@example.com')
  await page.getByPlaceholder('パスワードを入力').fill('password123')
  await page.getByPlaceholder('パスワードを入力').press('Enter')
  await page.waitForTimeout(300)
  // login mock succeeds → navigates to home (login screen disappears)
  await expect(page.getByRole('button', { name: 'ログイン' })).not.toBeVisible()
})
