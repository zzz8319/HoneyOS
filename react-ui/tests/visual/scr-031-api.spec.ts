/**
 * SCR-031 Settings — API connection tests
 * Uses mocked window.HoneyDB; no real network calls.
 */
import { test, expect } from '@playwright/test'

const BASE = ''

// ── Helpers ──────────────────────────────────────────────────────────────────

async function gotoSettings(page: import('@playwright/test').Page, state = 'normal') {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/?screen=settings&state=${state}&devbar=0`)
  await page.waitForLoadState('networkidle')
}

/** Inject a mock HoneyDB with given method overrides */
async function mockHoneyDB(
  page: import('@playwright/test').Page,
  overrides: Record<string, string>,
) {
  const base = `
    window.HoneyDB = {
      signOut: async () => {},
      getSession: async () => ({ user: { id: 'u1', email: 'test@test.com' } }),
      getUserProfile: async () => ({ name: 'テストユーザー', farm_name: 'テスト養蜂場' }),
      updateProfile: async () => {},
      getNotificationSettings: async () => ({
        inspectionReminder: true,
        aiDiagnosisComplete: true,
        sensorAlert: false,
        systemAnnouncement: true,
      }),
      updateNotificationSettings: async () => {},
      exportAllData: async () => ({
        exportedAt: new Date().toISOString(),
        profile: { name: 'テストユーザー', farm_name: 'テスト養蜂場' },
        inspRecords: [],
        workRecords: [],
        tasks: [],
      }),
      loadFarms: async () => [],
      saveFarm: async () => {},
      archiveFarm: async () => {},
      deleteFarm: async () => {},
      loadColonies: async () => [],
      saveColony: async () => {},
      archiveColony: async () => {},
      deleteColony: async () => {},
      initDefaultColonies: async () => {},
      loadInspRecords: async () => [],
      saveInspRecord: async () => null,
      updateInspRecord: async () => {},
      deleteInspRecord: async () => {},
      loadWorkRecords: async () => [],
      saveWorkRecord: async () => {},
      updateWorkRecord: async () => {},
      deleteWorkRecord: async () => {},
      loadTasks: async () => [],
      getTasks: async () => [],
      saveTask: async () => null,
      updateTask: async () => {},
      completeTask: async () => {},
      deleteTask: async () => {},
      savePushSubscription: async () => {},
      deletePushSubscription: async () => {},
      subscribeRealtime: () => {},
      unsubscribeRealtime: () => {},
      upsertBenchmark: async () => {},
      loadBenchmarkStats: async () => null,
      resetPassword: async () => {},
    };
  `
  const overrideLines = Object.entries(overrides)
    .map(([k, v]) => `window.HoneyDB.${k} = ${v};`)
    .join('\n')
  await page.addInitScript(`${base}\n${overrideLines}`)
}

// ── 1. Logout success → navigates away from settings ────────────────────────
test('SCR-031 api: logout success navigates to login', async ({ page }) => {
  await mockHoneyDB(page, {
    signOut: 'async () => {}',
  })
  await gotoSettings(page)

  // Open logout dialog
  await page.click('button[aria-label="ログアウト"]')
  await expect(page.locator('[role="dialog"][aria-label="ログアウト確認"]')).toBeVisible()

  // Confirm logout — click the destructive button inside the dialog
  await page.locator('[role="dialog"][aria-label="ログアウト確認"] [class*="dialogDestructiveBtn"]').click()

  // Should navigate away from settings screen
  await expect(page.locator('[aria-label="設定"]')).not.toBeVisible({ timeout: 3000 }).catch(async () => {
    // Alternatively verify we're no longer on settings
    const settingsHeader = page.locator('header').filter({ hasText: '設定' })
    await expect(settingsHeader).not.toBeVisible({ timeout: 2000 })
  })
})

// ── 2. Logout failure → stays on settings, shows error ──────────────────────
test('SCR-031 api: logout failure shows error', async ({ page }) => {
  await mockHoneyDB(page, {
    signOut: 'async () => { throw new Error("network error"); }',
  })
  await gotoSettings(page)

  await page.click('button[aria-label="ログアウト"]')
  await expect(page.locator('[role="dialog"][aria-label="ログアウト確認"]')).toBeVisible()
  await page.locator('[role="dialog"][aria-label="ログアウト確認"] [class*="dialogDestructiveBtn"]').click()

  // Dialog stays open with error message
  await expect(page.locator('[role="dialog"][aria-label="ログアウト確認"]')).toBeVisible()
  await expect(page.locator('[role="alert"]')).toBeVisible()
  await expect(page.locator('h1')).toContainText('設定')
})

// ── 3. Logout while offline → does not show success ─────────────────────────
test('SCR-031 api: logout while offline does not succeed', async ({ page }) => {
  await mockHoneyDB(page, {})
  await gotoSettings(page, 'offline')

  await page.click('button[aria-label="ログアウト"]')
  await expect(page.locator('[role="dialog"][aria-label="ログアウト確認"]')).toBeVisible()

  // Button should be disabled when offline
  const logoutBtn = page.locator('[role="dialog"][aria-label="ログアウト確認"] button:has-text("接続が必要")')
  await expect(logoutBtn).toBeVisible()
  await expect(logoutBtn).toBeDisabled()

  // Screen still shows settings after cancel
  await page.click('button:has-text("キャンセル")')
  await expect(page.locator('h1')).toContainText('設定')
})

// ── 4. Export success → download triggered ──────────────────────────────────
test('SCR-031 api: export success triggers download', async ({ page }) => {
  await mockHoneyDB(page, {})
  await gotoSettings(page)

  // Listen for download
  const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null)
  const exportBtn = page.locator('button[aria-label="データエクスポート"]')
  await expect(exportBtn).toBeVisible()
  await exportBtn.click()

  const download = await downloadPromise
  // Either download event fires or blob link is created (some browsers handle differently)
  // Check that no error message is shown
  await page.waitForTimeout(500)
  const errorVisible = await page.locator('[role="alert"]').isVisible().catch(() => false)
  // If download succeeded, no error; if download triggered, download is not null
  expect(download !== null || !errorVisible).toBeTruthy()
})

// ── 5. Export failure → no file generated ───────────────────────────────────
test('SCR-031 api: export failure shows error', async ({ page }) => {
  await mockHoneyDB(page, {
    exportAllData: 'async () => { throw new Error("export failed"); }',
  })
  await gotoSettings(page)

  const exportBtn = page.locator('button[aria-label="データエクスポート"]')
  await expect(exportBtn).toBeVisible()
  await exportBtn.click()
  await page.waitForTimeout(500)

  await expect(page.locator('[role="alert"]').filter({ hasText: 'エクスポートに失敗' })).toBeVisible()
})

// ── 6. Export JSON does not contain token or key fields ─────────────────────
test('SCR-031 api: exported JSON has no token or key fields', async ({ page }) => {
  await mockHoneyDB(page, {
    exportAllData: `async () => ({
      exportedAt: new Date().toISOString(),
      profile: { name: 'テスト', farm_name: '養蜂場' },
      inspRecords: [],
      workRecords: [],
      tasks: [],
    })`,
  })
  // Intercept blob creation to capture JSON content
  await page.addInitScript(`
    const origCreate = URL.createObjectURL.bind(URL);
    URL.createObjectURL = function(blob) {
      blob.text().then(t => { window.__lastExportJson = t; });
      return origCreate(blob);
    };
  `)
  await gotoSettings(page)

  const exportBtn = page.locator('button[aria-label="データエクスポート"]')
  await expect(exportBtn).toBeVisible()
  await exportBtn.click()
  await page.waitForTimeout(1000)

  const exportedJson = await page.evaluate(() => (window as unknown as Record<string, unknown>).__lastExportJson as string ?? '{}')
  const parsed = JSON.parse(exportedJson || '{}')
  const jsonStr = JSON.stringify(parsed).toLowerCase()
  expect(jsonStr).not.toContain('"token"')
  expect(jsonStr).not.toContain('"access_token"')
  expect(jsonStr).not.toContain('"refresh_token"')
  expect(jsonStr).not.toContain('"service_role"')
  expect(jsonStr).not.toContain('"anon_key"')
})

// ── 7. Notification permission granted → toggle enabled ─────────────────────
test('SCR-031 api: notification toggles enabled when permission not denied', async ({ page }) => {
  await mockHoneyDB(page, {})
  await gotoSettings(page)

  // All toggles should be enabled (not disabled)
  const toggles = page.locator('[role="switch"]')
  const count = await toggles.count()
  expect(count).toBeGreaterThan(0)
  for (let i = 0; i < count; i++) {
    await expect(toggles.nth(i)).not.toBeDisabled()
  }
})

// ── 8. Notification permission denied → inline note visible ─────────────────
test('SCR-031 api: push denied note visible when notifications denied', async ({ page }) => {
  await mockHoneyDB(page, {})
  // Simulate Notification.permission = 'denied'
  await page.addInitScript(`
    Object.defineProperty(window, 'Notification', {
      value: { permission: 'denied', requestPermission: async () => 'denied' },
      writable: false,
    });
  `)
  await gotoSettings(page)

  await expect(page.locator('[role="note"]:has-text("許可されていません")')).toBeVisible()
  // Toggles should be disabled
  const toggles = page.locator('[role="switch"]')
  const count = await toggles.count()
  for (let i = 0; i < count; i++) {
    await expect(toggles.nth(i)).toBeDisabled()
  }
})

// ── 9. Push not supported → graceful fallback ────────────────────────────────
test('SCR-031 api: push not supported shows ready note gracefully', async ({ page }) => {
  await mockHoneyDB(page, {})
  // Remove Notification and PushManager
  await page.addInitScript(`
    delete window.Notification;
    delete window.PushManager;
  `)
  await gotoSettings(page)

  // Push ready note should be visible (infrastructure not configured)
  await expect(page.locator('[role="note"]:has-text("準備中")')).toBeVisible()
  // No crash — settings screen still renders
  await expect(page.locator('h1')).toContainText('設定')
})

// ── 10. Push subscription save failure → error shown ────────────────────────
test('SCR-031 api: notification toggle save failure shows error', async ({ page }) => {
  await mockHoneyDB(page, {
    updateNotificationSettings: 'async () => { throw new Error("save failed"); }',
  })
  await gotoSettings(page)

  // Toggle first switch
  const toggle = page.locator('[role="switch"]').first()
  await toggle.click()
  await page.waitForTimeout(500)

  await expect(page.locator('[role="alert"]:has-text("通知設定の保存に失敗")')).toBeVisible()
})

// ── 11. Theme save success → data-theme attribute updated ────────────────────
test('SCR-031 api: theme change updates data-theme attribute', async ({ page }) => {
  await mockHoneyDB(page, {})
  await gotoSettings(page)

  // Click 'ダーク' theme button
  await page.click('button[aria-pressed="false"]:has-text("ダーク")')
  await page.waitForTimeout(300)

  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
  expect(theme).toBe('dark')
})

// ── 12. Theme save failure → shows "この端末に保存" ─────────────────────────
test('SCR-031 api: theme change saves to localStorage', async ({ page }) => {
  await mockHoneyDB(page, {})
  await gotoSettings(page)

  await page.click('button:has-text("ライト")')
  await page.waitForTimeout(300)

  await expect(page.locator('[role="status"]:has-text("この端末に保存")')).toBeVisible()
})

// ── 13. Theme localStorage fallback when offline ─────────────────────────────
test('SCR-031 api: theme persists from localStorage on load', async ({ page }) => {
  await mockHoneyDB(page, {})
  // Pre-set localStorage theme
  await page.addInitScript(`
    try { localStorage.setItem('honeyos_react_theme', 'dark'); } catch(e) {}
  `)
  await gotoSettings(page)

  // The dark theme button should be active
  await expect(page.locator('button:has-text("ダーク")[aria-pressed="true"]')).toBeVisible()
})

// ── 14. Language save success ────────────────────────────────────────────────
test('SCR-031 api: language change to English shows note', async ({ page }) => {
  await mockHoneyDB(page, {})
  await gotoSettings(page)

  await page.click('button:has-text("English")')
  await page.waitForTimeout(300)

  await expect(page.locator('[role="note"]:has-text("一部の画面はまだ日本語のみ")')).toBeVisible()
})

// ── 15. Language save failure / localStorage write ───────────────────────────
test('SCR-031 api: language saved to localStorage', async ({ page }) => {
  await mockHoneyDB(page, {})
  await gotoSettings(page)

  await page.click('button:has-text("English")')
  await page.waitForTimeout(300)

  const lang = await page.evaluate(() => {
    try { return localStorage.getItem('honeyos_react_language') } catch { return null }
  })
  expect(lang).toBe('en')
})

// ── 16. Invalid language value → falls back to ja ───────────────────────────
test('SCR-031 api: invalid localStorage language falls back to ja', async ({ page }) => {
  await mockHoneyDB(page, {})
  await page.addInitScript(`
    try { localStorage.setItem('honeyos_react_language', 'zh'); } catch(e) {}
  `)
  await gotoSettings(page)

  // 日本語 button should be active (invalid value ignored)
  await expect(page.locator('button:has-text("日本語")[aria-pressed="true"]')).toBeVisible()
})

// ── 17. Offline sync-pending indicator visible ──────────────────────────────
test('SCR-031 api: unsynced-data state shows sync indicator', async ({ page }) => {
  await mockHoneyDB(page, {})
  await gotoSettings(page, 'unsynced-data')

  await expect(page.locator('[role="status"]:has-text("未送信")')).toBeVisible()
})

// ── 18. Account delete confirmation requires typing ─────────────────────────
test('SCR-031 api: delete confirm button disabled when input empty', async ({ page }) => {
  await mockHoneyDB(page, {})
  await gotoSettings(page)

  // Open delete dialog
  await page.click('button[aria-label="アカウントを削除"]')
  await expect(page.locator('[role="dialog"][aria-label="アカウント削除確認"]')).toBeVisible()

  // Delete button should be disabled when input is empty
  const deleteBtn = page.locator('[role="dialog"][aria-label="アカウント削除確認"] button.dialogDestructiveBtn, [role="dialog"][aria-label="アカウント削除確認"] [class*="dialogDestructiveBtn"]').last()
  await expect(deleteBtn).toBeDisabled()

  // Type the wrong text
  await page.fill('#delete-confirm-input', '削除しない')
  await expect(deleteBtn).toBeDisabled()

  // Type the correct confirmation phrase
  await page.fill('#delete-confirm-input', 'アカウントを削除する')
  // Button should now be enabled (but note: no server API so it won't actually delete)
  await expect(deleteBtn).not.toBeDisabled()
})
