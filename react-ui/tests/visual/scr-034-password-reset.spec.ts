import { test, expect, type Page } from '@playwright/test'

const SCREEN = 'password-reset'
const BASE_URL = `/?screen=${SCREEN}&devbar=0`
const FIXED_NOW = new Date('2026-09-27T10:00:00+09:00')

/** Inject a mock window.HoneyDB with no-op auth methods */
async function mockHoneyDB(page: Page) {
  await page.addInitScript(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).HoneyDB = {
      resetPassword: async () => { /* mock: success */ },
      updatePassword: async () => { /* mock: success */ },
      login: async () => {},
      logout: async () => {},
      getSession: async () => ({ user: null }),
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

// ── 1. 通常（未入力）───────────────────────────────────────────────────────
test('SCR-034 normal', async ({ page }) => {
  await goto(page)
  await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: 'パスワード再設定' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'メインナビゲーション' })).not.toBeVisible()
  await expect(page.getByLabel('メールアドレス')).toBeVisible()
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-034-normal.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 2. 入力済み ─────────────────────────────────────────────────────────────
test('SCR-034 filled', async ({ page }) => {
  await goto(page, 'filled')
  await expect(page.getByLabel('メールアドレス')).toHaveValue('ryota@example.com')
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-034-filled.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 3. バリデーションエラー ─────────────────────────────────────────────────
test('SCR-034 validation-error', async ({ page }) => {
  await goto(page, 'validation-error')
  await expect(page.getByText('メールアドレスを入力してください')).toBeVisible()
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-034-validation-error.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 4. 送信中 ────────────────────────────────────────────────────────────────
test('SCR-034 submitting', async ({ page }) => {
  await goto(page, 'submitting')
  const btn = page.getByRole('button', { name: '再設定メールを送信' })
  await expect(btn).toBeDisabled()
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-034-submitting.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 5. 送信完了 ──────────────────────────────────────────────────────────────
test('SCR-034 sent', async ({ page }) => {
  await goto(page, 'sent')
  await expect(page.getByText('メールを送信しました')).toBeVisible()
  await expect(page.getByText('ryota@example.com')).toBeVisible()
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-034-sent.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 6. 再送クールダウン ──────────────────────────────────────────────────────
test('SCR-034 resend-cooldown', async ({ page }) => {
  await goto(page, 'resend-cooldown')
  await expect(page.getByRole('button', { name: 'メールを再送' })).toBeDisabled()
  await expect(page.getByText(/秒後に再送できます/)).toBeVisible()
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-034-resend-cooldown.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 7. 送信エラー ────────────────────────────────────────────────────────────
test('SCR-034 send-error', async ({ page }) => {
  await goto(page, 'send-error')
  await expect(page.getByText('処理に失敗しました。もう一度お試しください。')).toBeVisible()
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-034-send-error.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 8. オフライン ────────────────────────────────────────────────────────────
test('SCR-034 offline', async ({ page }) => {
  await goto(page, 'offline')
  await expect(page.getByText('オフラインのため、パスワードを再設定できません')).toBeVisible()
  await expect(page.getByRole('button', { name: '再設定メールを送信' })).toBeDisabled()
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-034-offline.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 9. 新規パスワード設定 ────────────────────────────────────────────────────
test('SCR-034 new-password', async ({ page }) => {
  await goto(page, 'new-password')
  await expect(page.getByText('新しいパスワードを設定')).toBeVisible()
  await expect(page.getByLabel('新しいパスワード', { exact: true })).toBeVisible()
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-034-new-password.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 10. パスワードバリデーションエラー ──────────────────────────────────────
test('SCR-034 password-validation-error', async ({ page }) => {
  await goto(page, 'password-validation-error')
  await expect(page.getByText('パスワードは8文字以上で入力してください')).toBeVisible()
  await expect(page.getByText('パスワードが一致しません')).toBeVisible()
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-034-password-validation-error.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 11. パスワード更新中 ─────────────────────────────────────────────────────
test('SCR-034 password-updating', async ({ page }) => {
  await goto(page, 'password-updating')
  const btn = page.getByRole('button', { name: '新しいパスワードを保存' })
  await expect(btn).toBeDisabled()
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-034-password-updating.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 12. パスワード更新完了 ───────────────────────────────────────────────────
test('SCR-034 password-updated', async ({ page }) => {
  await goto(page, 'password-updated')
  await expect(page.getByText('パスワードを更新しました')).toBeVisible()
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-034-password-updated.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── Functional: no BottomNav ──────────────────────────────────────────────────
test('SCR-034 has no BottomNav', async ({ page }) => {
  await goto(page)
  await expect(page.getByRole('navigation', { name: 'メインナビゲーション' })).not.toBeVisible()
})

// ── Functional: no horizontal scroll ─────────────────────────────────────────
test('SCR-034 no horizontal scroll', async ({ page }) => {
  await goto(page)
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
})

// ── Functional: step indicator shows current step ─────────────────────────────
test('SCR-034 step indicator step 1 active', async ({ page }) => {
  await goto(page)
  const nav = page.getByRole('navigation', { name: '手順' })
  await expect(nav).toBeVisible()
  // step 1 circle should have aria-current=step
  const stepItems = nav.locator('[aria-current="step"]')
  await expect(stepItems).toHaveCount(1)
})

// ── Functional: step 2 active on sent state ───────────────────────────────────
test('SCR-034 step indicator step 2 active on sent', async ({ page }) => {
  await goto(page, 'sent')
  const nav = page.getByRole('navigation', { name: '手順' })
  // only one aria-current=step
  await expect(nav.locator('[aria-current="step"]')).toHaveCount(1)
})

// ── Functional: back button navigates away ────────────────────────────────────
test('SCR-034 back button', async ({ page }) => {
  await page.clock.install({ time: FIXED_NOW })
  await mockHoneyDB(page)
  await page.goto('/?screen=home&devbar=0', { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
  // navigate to password-reset (simulated)
  await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
  await page.getByRole('button', { name: '戻る', exact: true }).click()
  await page.waitForTimeout(200)
  // back returns to previousScreen (home in this case)
  await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: 'パスワード再設定' })).not.toBeVisible()
})
