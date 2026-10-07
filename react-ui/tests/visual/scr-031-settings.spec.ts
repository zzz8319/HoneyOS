import { test, expect } from '@playwright/test'

const BASE = ''
const STATES = [
  'normal',
  'profile-edit',
  'profile-saving',
  'profile-error',
  'notifications-disabled',
  'unsynced-data',
  'sync-error',
  'logout-confirm',
  'delete-confirm',
  'loading',
  'error',
  'offline',
] as const

// ── Visual snapshot tests (12 states) ────────────────────────────────────────

for (const state of STATES) {
  test(`SCR-031 snapshot: ${state}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${BASE}/?screen=settings&state=${state}&devbar=0`)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot(`scr-031-${state}.png`, {
      fullPage: false,
    })
  })
}

// ── Operation tests ────────────────────────────────────────────────────────

// 1. BottomNav settings tab → SCR-031 (from home screen)
test('SCR-031 op: BottomNav settings tab navigates from home', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/?screen=home&devbar=0`)
  await page.waitForLoadState('networkidle')
  const settingsTab = page.locator('nav[aria-label="メインナビゲーション"] button').filter({ hasText: '設定' })
  await expect(settingsTab).toBeVisible()
  await settingsTab.click()
  await expect(settingsTab).toHaveAttribute('aria-current', 'page')
  await expect(page.locator('h1')).toContainText('設定')
})

// 2. SCR-031 → home tab
test('SCR-031 op: navigate to home tab', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/?screen=settings&devbar=0`)
  await page.waitForLoadState('networkidle')
  const homeTab = page.locator('nav[aria-label="メインナビゲーション"] button').filter({ hasText: 'ホーム' })
  await homeTab.click()
  await expect(homeTab).toHaveAttribute('aria-current', 'page')
})

// 3. SCR-031 → farms tab
test('SCR-031 op: navigate to farms tab', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/?screen=settings&devbar=0`)
  await page.waitForLoadState('networkidle')
  const farmsTab = page.locator('nav[aria-label="メインナビゲーション"] button').filter({ hasText: '養蜂場' })
  await farmsTab.click()
  await expect(farmsTab).toHaveAttribute('aria-current', 'page')
})

// 4. SCR-031 → work tab
test('SCR-031 op: navigate to work tab', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/?screen=settings&devbar=0`)
  await page.waitForLoadState('networkidle')
  const workTab = page.locator('nav[aria-label="メインナビゲーション"] button').filter({ hasText: '作業' })
  await workTab.click()
  await expect(workTab).toHaveAttribute('aria-current', 'page')
})

// 5. SCR-031 → analytics tab
test('SCR-031 op: navigate to analytics tab', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/?screen=settings&devbar=0`)
  await page.waitForLoadState('networkidle')
  const analyticsTab = page.locator('nav[aria-label="メインナビゲーション"] button').filter({ hasText: '分析' })
  await analyticsTab.click()
  await expect(analyticsTab).toHaveAttribute('aria-current', 'page')
})

// 6. SCR-031 → SCR-032 (蜂群を追加)
test('SCR-031 op: 蜂群を追加 navigates to colony-create', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/?screen=settings&devbar=0`)
  await page.waitForLoadState('networkidle')
  const addColony = page.locator('button[aria-label="蜂群を追加"]')
  await expect(addColony).toBeVisible()
  await addColony.click()
  await expect(page.locator('h1')).toContainText('蜂群を追加')
})

// 7. SCR-031 → SCR-033 (養蜂場を追加)
test('SCR-031 op: 養蜂場を追加 navigates to apiary-create', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/?screen=settings&devbar=0`)
  await page.waitForLoadState('networkidle')
  const addApiary = page.locator('button[aria-label="養蜂場を追加"]')
  await expect(addApiary).toBeVisible()
  await addApiary.click()
  await expect(page.locator('h1')).toContainText('養蜂場を追加')
})

// 8. SCR-031 → SCR-034 (パスワード再設定)
test('SCR-031 op: パスワードを再設定 navigates to password-reset', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/?screen=settings&devbar=0`)
  await page.waitForLoadState('networkidle')
  const pwBtn = page.locator('button[aria-label="パスワードを再設定"]')
  await expect(pwBtn).toBeVisible()
  await pwBtn.click()
  await expect(page.getByText('パスワード再設定').first()).toBeVisible()
})

// 9. Profile edit open + cancel (input cleared/closed)
test('SCR-031 op: profile edit open and cancel closes form', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/?screen=settings&devbar=0`)
  await page.waitForLoadState('networkidle')
  // Open edit form
  const editBtn = page.locator('button[aria-label="プロフィールを編集"]').first()
  await editBtn.click()
  await expect(page.locator('#edit-username')).toBeVisible()
  // Cancel
  const cancelBtn = page.locator('button', { hasText: 'キャンセル' })
  await cancelBtn.click()
  await expect(page.locator('#edit-username')).not.toBeVisible()
})

// 10. Profile save error keeps input values
test('SCR-031 op: profile-error state shows error with inputs', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/?screen=settings&state=profile-error&devbar=0`)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('#edit-username')).toBeVisible()
  const errorMsg = page.locator('[role="alert"]')
  await expect(errorMsg).toBeVisible()
})

// 11. Notification toggle changes state
test('SCR-031 op: notification toggle changes aria-checked', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/?screen=settings&devbar=0`)
  await page.waitForLoadState('networkidle')
  const toggle = page.locator('button[role="switch"][aria-label="センサー異常アラートを切り替え"]')
  const initialState = await toggle.getAttribute('aria-checked')
  await toggle.click()
  const newState = await toggle.getAttribute('aria-checked')
  expect(newState).not.toBe(initialState)
})

// 12. Logout confirm cancel (dialog closes, no logout)
test('SCR-031 op: logout confirm cancel closes dialog', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/?screen=settings&state=logout-confirm&devbar=0`)
  await page.waitForLoadState('networkidle')
  const dialog = page.locator('[role="dialog"][aria-label="ログアウト確認"]')
  await expect(dialog).toBeVisible()
  const cancelBtn = dialog.locator('button', { hasText: 'キャンセル' })
  await cancelBtn.click()
  await expect(dialog).not.toBeVisible()
  // Still on settings screen
  await expect(page.locator('h1')).toContainText('設定')
})
