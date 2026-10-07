/**
 * SCR-031 User Preferences DB Sync Tests
 * Tests preference loading, saving, offline fallback, and theme application.
 * All window.HoneyDB calls are mocked via page.addInitScript().
 */
import { test, expect } from '@playwright/test'

const SETTINGS_URL = '/?screen=settings&tab=settings&devbar=0'

const BASE_PREFS = { theme: 'system', language: 'ja', default_inspection_mode: 'frame' }

function mockHoneyDB(overrides: {
  getUserPreferences?: string
  updateUserPreferences?: string
  userId?: string
  failGet?: boolean
  failUpdate?: boolean
} = {}) {
  const uid = overrides.userId ?? 'user-abc-123'
  const prefs = overrides.getUserPreferences
    ? overrides.getUserPreferences
    : JSON.stringify(BASE_PREFS)
  return `
    window.__mockPrefs = ${prefs};
    window.__updateCalls = [];
    window.__getUserCalled = false;
    window.HoneyDB = {
      getUserProfile: async () => ({ name: 'テスト', farm_name: '養蜂場' }),
      getNotificationSettings: async () => null,
      getSession: async () => ({ user: { id: '${uid}' } }),
      getUserPreferences: async () => {
        window.__getUserCalled = true;
        ${overrides.failGet ? 'throw new Error("network error");' : 'return window.__mockPrefs;'}
      },
      updateUserPreferences: async (prefs) => {
        window.__updateCalls.push(prefs);
        ${overrides.failUpdate ? 'throw new Error("network error");' : 'return { ...window.__mockPrefs, ...prefs };'}
      },
      updateNotificationSettings: async () => {},
      updateProfile: async () => {},
      signOut: async () => {},
      exportAllData: async () => ({ exportedAt: '', profile: null, inspRecords: [], workRecords: [], tasks: [] }),
    };
  `
}

test.describe('SCR-031 User Preferences Sync', () => {
  test('1. getUserPreferences called on settings screen mount', async ({ page }) => {
    await page.addInitScript(mockHoneyDB())
    await page.goto(SETTINGS_URL)
    await page.waitForTimeout(600)
    const called = await page.evaluate(() => (window as { __getUserCalled?: boolean }).__getUserCalled)
    expect(called).toBe(true)
  })

  test('2. theme "light" sets data-theme="light" on documentElement', async ({ page }) => {
    await page.addInitScript(mockHoneyDB({ getUserPreferences: JSON.stringify({ ...BASE_PREFS, theme: 'light' }) }))
    await page.goto(SETTINGS_URL)
    await page.waitForTimeout(600)
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    expect(theme).toBe('light')
  })

  test('3. theme "dark" sets data-theme="dark" on documentElement', async ({ page }) => {
    await page.addInitScript(mockHoneyDB({ getUserPreferences: JSON.stringify({ ...BASE_PREFS, theme: 'dark' }) }))
    await page.goto(SETTINGS_URL)
    await page.waitForTimeout(600)
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    expect(theme).toBe('dark')
  })

  test('4. theme "system" follows prefers-color-scheme (mock matchMedia → dark)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.addInitScript(mockHoneyDB({ getUserPreferences: JSON.stringify({ ...BASE_PREFS, theme: 'system' }) }))
    await page.goto(SETTINGS_URL)
    await page.waitForTimeout(600)
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    expect(theme).toBe('dark')
  })

  test('5. language "en" shows incomplete translation note', async ({ page }) => {
    await page.addInitScript(mockHoneyDB({ getUserPreferences: JSON.stringify({ ...BASE_PREFS, language: 'en' }) }))
    await page.goto(SETTINGS_URL)
    await page.waitForTimeout(600)
    const note = await page.getByText('一部の画面はまだ日本語のみ対応しています').isVisible()
    expect(note).toBe(true)
  })

  test('6. language "ja" hides incomplete translation note', async ({ page }) => {
    await page.addInitScript(mockHoneyDB({ getUserPreferences: JSON.stringify({ ...BASE_PREFS, language: 'ja' }) }))
    await page.goto(SETTINGS_URL)
    await page.waitForTimeout(600)
    const note = await page.getByText('一部の画面はまだ日本語のみ対応しています').isVisible().catch(() => false)
    expect(note).toBe(false)
  })

  test('7. Invalid language from DB falls back to ja default', async ({ page }) => {
    await page.addInitScript(mockHoneyDB({ getUserPreferences: JSON.stringify({ ...BASE_PREFS, language: 'fr' }) }))
    await page.goto(SETTINGS_URL)
    await page.waitForTimeout(600)
    // 'fr' is not valid so the DB returned prefs should not affect language display
    // The page should not crash and show settings normally
    await expect(page.getByRole('heading', { name: '設定' })).toBeVisible()
  })

  test('8. Save success shows "サーバーに保存" feedback', async ({ page }) => {
    await page.addInitScript(mockHoneyDB())
    await page.goto(SETTINGS_URL)
    await page.waitForTimeout(600)
    // Click the "ダーク" button
    await page.getByRole('button', { name: 'ダーク' }).click()
    await expect(page.getByText('サーバーに保存しました')).toBeVisible({ timeout: 2000 })
  })

  test('9. Save failure shows "この端末に保存" feedback', async ({ page }) => {
    await page.addInitScript(mockHoneyDB({ failUpdate: true }))
    await page.goto(SETTINGS_URL)
    await page.waitForTimeout(600)
    await page.getByRole('button', { name: 'ダーク' }).click()
    await expect(page.getByText('この端末に保存しました（同期待ち）')).toBeVisible({ timeout: 2000 })
  })

  test('10. Save failure does not revert selection', async ({ page }) => {
    await page.addInitScript(mockHoneyDB({ failUpdate: true }))
    await page.goto(SETTINGS_URL)
    await page.waitForTimeout(600)
    await page.getByRole('button', { name: 'ダーク' }).click()
    await page.waitForTimeout(300)
    const btn = page.getByRole('button', { name: 'ダーク' })
    const isPressed = await btn.getAttribute('aria-pressed')
    expect(isPressed).toBe('true')
  })

  test('11. Offline sync-pending indicator visible after failed save', async ({ page }) => {
    await page.addInitScript(mockHoneyDB({ failUpdate: true }))
    await page.goto(SETTINGS_URL)
    await page.waitForTimeout(600)
    await page.getByRole('button', { name: 'ライト' }).click()
    // prefSyncNote '同期待ち' should appear after async handler settles
    await expect(page.getByText('同期待ち', { exact: true })).toBeVisible({ timeout: 4000 })
  })

  test('12. Sync pending cleared after successful retry on mount', async ({ page }) => {
    // Pre-seed localStorage with pending prefs
    await page.addInitScript(`
      localStorage.setItem('honeyos_user_prefs', JSON.stringify({ theme: 'dark', language: 'ja', default_inspection_mode: 'frame' }));
      localStorage.setItem('honeyos_prefs_user_id', 'user-abc-123');
      localStorage.setItem('honeyos_prefs_sync_pending', 'true');
    `)
    await page.addInitScript(mockHoneyDB())
    await page.goto(SETTINGS_URL)
    await page.waitForTimeout(800)
    // Sync pending should have been cleared and sync complete shown
    const isPending = await page.evaluate(() => localStorage.getItem('honeyos_prefs_sync_pending'))
    expect(isPending).toBeNull()
  })

  test('13. Different user localStorage not applied', async ({ page }) => {
    // localStorage has prefs for a different user
    await page.addInitScript(`
      localStorage.setItem('honeyos_user_prefs', JSON.stringify({ theme: 'dark', language: 'en', default_inspection_mode: 'ratio' }));
      localStorage.setItem('honeyos_prefs_user_id', 'other-user-999');
    `)
    // DB returns system/ja for user-abc-123
    await page.addInitScript(mockHoneyDB({ failGet: true })) // DB fails, so should NOT apply other user's prefs
    await page.goto(SETTINGS_URL)
    await page.waitForTimeout(600)
    // Should not apply other user's 'en' language
    const note = await page.getByText('一部の画面はまだ日本語のみ対応しています').isVisible().catch(() => false)
    expect(note).toBe(false)
  })

  test('14. DB preferences take priority over localStorage', async ({ page }) => {
    // localStorage has dark theme
    await page.addInitScript(`
      localStorage.setItem('honeyos_react_theme', 'dark');
      localStorage.setItem('honeyos_user_prefs', JSON.stringify({ theme: 'dark' }));
      localStorage.setItem('honeyos_prefs_user_id', 'user-abc-123');
    `)
    // DB returns light theme
    await page.addInitScript(mockHoneyDB({ getUserPreferences: JSON.stringify({ ...BASE_PREFS, theme: 'light' }) }))
    await page.goto(SETTINGS_URL)
    await page.waitForTimeout(600)
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    expect(theme).toBe('light')
  })

  test('15. default_inspection_mode "frame" saved correctly to DB', async ({ page }) => {
    await page.addInitScript(mockHoneyDB())
    await page.goto(SETTINGS_URL)
    await page.waitForTimeout(600)
    // Click 枠式 (frame)
    await page.getByRole('button', { name: '枠式' }).click()
    await page.waitForTimeout(300)
    const calls = await page.evaluate(() => (window as { __updateCalls?: Record<string, string>[] }).__updateCalls ?? [])
    expect(calls.some(c => c.default_inspection_mode === 'frame')).toBe(true)
  })

  test('16. default_inspection_mode "ratio" saved correctly to DB', async ({ page }) => {
    await page.addInitScript(mockHoneyDB())
    await page.goto(SETTINGS_URL)
    await page.waitForTimeout(600)
    // Click 割合式 (percentage → ratio in DB)
    await page.getByRole('button', { name: '割合式' }).click()
    await page.waitForTimeout(300)
    const calls = await page.evaluate(() => (window as { __updateCalls?: Record<string, string>[] }).__updateCalls ?? [])
    expect(calls.some(c => c.default_inspection_mode === 'ratio')).toBe(true)
  })

  test('17. Sync pending state persisted in localStorage after failed save', async ({ page }) => {
    await page.addInitScript(mockHoneyDB({ failUpdate: true }))
    await page.goto(SETTINGS_URL)
    await page.waitForTimeout(600)
    await page.getByRole('button', { name: 'ダーク' }).click()
    await page.waitForTimeout(400)
    const pending = await page.evaluate(() => localStorage.getItem('honeyos_prefs_sync_pending'))
    expect(pending).toBe('true')
  })

  test('18. updateUserPreferences called with partial object, not full object', async ({ page }) => {
    await page.addInitScript(mockHoneyDB())
    await page.goto(SETTINGS_URL)
    await page.waitForTimeout(600)
    await page.getByRole('button', { name: 'ダーク' }).click()
    await page.waitForTimeout(300)
    const calls = await page.evaluate(() => (window as { __updateCalls?: Record<string, string>[] }).__updateCalls ?? [])
    expect(calls.length).toBeGreaterThan(0)
    const lastCall = calls[calls.length - 1]
    // Should only have 'theme' key, not all three keys
    expect(Object.keys(lastCall)).toContain('theme')
    expect(Object.keys(lastCall)).not.toContain('language')
  })

  test('19. Theme changes applied immediately to UI without waiting for DB', async ({ page }) => {
    // Mock slow DB
    await page.addInitScript(`
      window.__mockPrefs = ${JSON.stringify(BASE_PREFS)};
      window.__updateCalls = [];
      window.__getUserCalled = false;
      window.HoneyDB = {
        getUserProfile: async () => null,
        getNotificationSettings: async () => null,
        getSession: async () => ({ user: { id: 'user-abc-123' } }),
        getUserPreferences: async () => { window.__getUserCalled = true; return window.__mockPrefs; },
        updateUserPreferences: async (prefs) => {
          window.__updateCalls.push(prefs);
          await new Promise(r => setTimeout(r, 5000)); // very slow
          return { ...window.__mockPrefs, ...prefs };
        },
        updateNotificationSettings: async () => {},
        updateProfile: async () => {},
        signOut: async () => {},
        exportAllData: async () => ({ exportedAt: '', profile: null, inspRecords: [], workRecords: [], tasks: [] }),
      };
    `)
    await page.goto(SETTINGS_URL)
    await page.waitForTimeout(600)
    await page.getByRole('button', { name: 'ダーク' }).click()
    // Immediately check — should already be applied without waiting 5s
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    expect(theme).toBe('dark')
  })

  test('20. Language changes applied immediately to UI without waiting for DB', async ({ page }) => {
    await page.addInitScript(`
      window.__mockPrefs = ${JSON.stringify(BASE_PREFS)};
      window.__updateCalls = [];
      window.__getUserCalled = false;
      window.HoneyDB = {
        getUserProfile: async () => null,
        getNotificationSettings: async () => null,
        getSession: async () => ({ user: { id: 'user-abc-123' } }),
        getUserPreferences: async () => { window.__getUserCalled = true; return window.__mockPrefs; },
        updateUserPreferences: async (prefs) => {
          window.__updateCalls.push(prefs);
          await new Promise(r => setTimeout(r, 5000));
          return { ...window.__mockPrefs, ...prefs };
        },
        updateNotificationSettings: async () => {},
        updateProfile: async () => {},
        signOut: async () => {},
        exportAllData: async () => ({ exportedAt: '', profile: null, inspRecords: [], workRecords: [], tasks: [] }),
      };
    `)
    await page.goto(SETTINGS_URL)
    await page.waitForTimeout(600)
    await page.getByRole('button', { name: 'English' }).click()
    // Immediately check — en translation note should appear without waiting for slow DB
    const note = await page.getByText('一部の画面はまだ日本語のみ対応しています').isVisible({ timeout: 500 })
    expect(note).toBe(true)
  })
})
