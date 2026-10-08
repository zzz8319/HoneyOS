/**
 * Production no-mock-data verification.
 *
 * Mirrors tests/visual/no-mock-data.spec.ts but runs against the production
 * bundle (vite preview, port 4173) where import.meta.env.DEV === false.
 *
 * Key differences from the dev version:
 *   - Auth guard is active: we inject an authenticated session test double
 *     so the app proceeds past the auth check normally
 *   - window.HoneyDB is initialized but returns empty data (no mock strings)
 *   - Tests confirm mock-only strings never appear in the normal state
 *   - Auth guard remains fully active (getSession always called)
 */
import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

/** Authenticated HoneyDB with empty data — no mock strings leak through. */
const AUTH_EMPTY_SCRIPT = `
(function() {
  window.HoneyDB = {
    getSession:              async function() { return { user: { id: 'u1', email: 'test@example.com' } }; },
    getUserProfile:          async function() { return { name: 'テスト', farm_name: '' }; },
    getUserPreferences:      async function() { return null; },
    loadFarms:               async function() { return []; },
    loadColonies:            async function() { return []; },
    loadInspRecords:         async function() { return []; },
    loadWorkRecords:         async function() { return []; },
    loadTasks:               async function() { return []; },
    getTasks:                async function() { return []; },
    getNotificationSettings: async function() { return null; },
    loadBenchmarkStats:      async function() { return null; },
    signOut:                 async function() {},
    saveWorkRecord:          async function() { return null; },
    updateWorkRecord:        async function() {},
    deleteWorkRecord:        async function() {},
    saveTask:                async function() { return null; },
    updateTask:              async function() {},
    completeTask:            async function() {},
    deleteTask:              async function() {},
    saveInspRecord:          async function() { return null; },
    saveFarm:                async function() {},
    archiveFarm:             async function() {},
    deleteFarm:              async function() {},
    saveColony:              async function() {},
    archiveColony:           async function() {},
    deleteColony:            async function() {},
    updateProfile:           async function() {},
    updateUserPreferences:   async function() {},
    updateNotificationSettings: async function() {},
    exportAllData:           async function() { return { exportedAt: '', profile: null, inspRecords: [], workRecords: [], tasks: [] }; },
    subscribeRealtime:       function() {},
    unsubscribeRealtime:     function() {},
    upsertBenchmark:         async function() {},
    savePushSubscription:    async function() {},
    deletePushSubscription:  async function() {},
    resetPassword:           async function() {},
    initDefaultColonies:     async function() {},
    signIn:                  async function() { return { error: null }; },
    signUp:                  async function() { return { error: null }; },
  };
})();
`

/** Strings that are only present in mock data — must never appear in production normal state. */
const MOCK_ONLY_STRINGS = ['宮田養蜂場', '川東養蜂場']

async function goTo(page: Page, screen: string, state: string) {
  await page.addInitScript(AUTH_EMPTY_SCRIPT)
  await page.goto(`/?screen=${screen}&state=${state}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  // Auth guard must not have redirected to login
  const heading = await page.getByRole('heading', { level: 1 }).filter({ hasText: 'ログイン' })
  const isLogin = await heading.isVisible()
  if (isLogin) throw new Error(`Auth guard redirected to login unexpectedly for screen=${screen}`)
}

test('SCR-006 production: no mock farm name shown', async ({ page }) => {
  await goTo(page, 'home', 'normal')
  for (const str of MOCK_ONLY_STRINGS) {
    await expect(page.getByText(str, { exact: false })).not.toBeVisible()
  }
})

test('SCR-008 production: no mock apiary name shown', async ({ page }) => {
  await goTo(page, 'farms', 'normal')
  for (const str of MOCK_ONLY_STRINGS) {
    await expect(page.getByText(str, { exact: false })).not.toBeVisible()
  }
})

test('SCR-009 production: no mock colony/apiary name shown', async ({ page }) => {
  await goTo(page, 'colony-detail', 'normal')
  for (const str of MOCK_ONLY_STRINGS) {
    await expect(page.getByText(str, { exact: false })).not.toBeVisible()
  }
})

test('SCR-026 production: no mock colony name shown', async ({ page }) => {
  await goTo(page, 'work-record', 'normal-new')
  for (const str of MOCK_ONLY_STRINGS) {
    await expect(page.getByText(str, { exact: false })).not.toBeVisible()
  }
})

test('SCR-027 production: no mock strings shown', async ({ page }) => {
  await goTo(page, 'work-history', 'normal')
  for (const str of MOCK_ONLY_STRINGS) {
    await expect(page.getByText(str, { exact: false })).not.toBeVisible()
  }
})

test('SCR-029 production: no mock colony/apiary name shown', async ({ page }) => {
  await goTo(page, 'colony-trend', 'normal')
  for (const str of MOCK_ONLY_STRINGS) {
    await expect(page.getByText(str, { exact: false })).not.toBeVisible()
  }
})

test('SCR-030 production: no mock colony/apiary name shown', async ({ page }) => {
  await goTo(page, 'colony-comparison', 'normal')
  for (const str of MOCK_ONLY_STRINGS) {
    await expect(page.getByText(str, { exact: false })).not.toBeVisible()
  }
})

test('SCR-028 production: no mock strings shown', async ({ page }) => {
  await goTo(page, 'report', 'normal')
  for (const str of MOCK_ONLY_STRINGS) {
    await expect(page.getByText(str, { exact: false })).not.toBeVisible()
  }
})
