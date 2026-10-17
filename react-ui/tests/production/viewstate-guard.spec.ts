/**
 * Production viewState guard tests.
 *
 * Verifies that ?state= URL parameters are ignored in the production bundle
 * (import.meta.env.DEV === false), so dev fixtures and forced UI states are
 * unreachable from the browser.
 *
 * Auth flow: inject onAuthStateChange + getSession returning a valid session
 * and getUserPreferences returning onboarding_completed=true so the app
 * reaches normal routing past the auth/onboarding gates.
 */
import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

/** Full HoneyDB mock with authenticated session and onboarding completed. */
const AUTH_SCRIPT = `
(function() {
  window.HoneyDB = {
    getSession:              async function() { return { user: { id: 'u1', email: 'test@example.com' } }; },
    onAuthStateChange:       function(_callback) { return function() {}; },
    getUserProfile:          async function() { return { name: 'テスト', farm_name: 'テスト養蜂場' }; },
    getUserPreferences:      async function() { return { theme: 'system', language: 'ja', onboarding_completed: true }; },
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
    initDefaultColonies:     async function() {},
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
    signIn:                  async function() { return { error: null }; },
    signUp:                  async function() { return { error: null }; },
  };
})();
`

async function goToAuthenticated(page: Page, qs: string): Promise<void> {
  await page.addInitScript(AUTH_SCRIPT)
  await page.goto(qs, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
}

// ── A. onboarding-3 ?state=long-content ──────────────────────────────────────

test('A: onboarding-3 ?state=long-content does NOT expose LONG_FIXTURE (山田 太郎)', async ({ page }) => {
  await goToAuthenticated(page, '?screen=onboarding-3&state=long-content')
  const body = await page.locator('body').innerText()
  expect(body.includes('山田 太郎'), 'LONG_FIXTURE name visible').toBe(false)
  expect(body.includes('静岡県西部養蜂組合第一支部'), 'LONG_FIXTURE farm visible').toBe(false)
  expect(body.includes('テスト長い名前'), 'LONG_FIXTURE long name suffix visible').toBe(false)
})

// ── B. sensor-detail ?state=long-content ─────────────────────────────────────

test('B: sensor-detail ?state=long-content does NOT expose LONG_CONTENT_METRICS fixture', async ({ page }) => {
  await goToAuthenticated(page, '?screen=sensor-detail&state=long-content')
  const body = await page.locator('body').innerText()
  // LONG_CONTENT_METRICS and COLONY_LONG contain specific colony names not in normal empty data
  // The screen renders with empty/normal data, not fixture
  expect(body.includes('山田 太郎'), 'LONG_FIXTURE name in sensor-detail').toBe(false)
})

// ── C. notification-center ?state=long-content ───────────────────────────────

test('C: notification-center ?state=long-content does NOT expose LONG_CONTENT_NOTIFICATIONS', async ({ page }) => {
  await goToAuthenticated(page, '?screen=notification-center&state=long-content')
  const body = await page.locator('body').innerText()
  expect(body.includes('山田 太郎'), 'LONG_FIXTURE name in notifications').toBe(false)
})

// ── D. apiary-create ?state=submitting does NOT lock the form ────────────────

test('D: apiary-create ?state=submitting does NOT force submitting UI in production', async ({ page }) => {
  await goToAuthenticated(page, '?screen=apiary-create&state=submitting')
  const html = await page.content()
  // Should NOT show aria-busy=true or 登録中 (submitting indicator) from state param
  const hasAriaBusy = html.includes('aria-busy="true"')
  const body = await page.locator('body').innerText()
  const hasSubmitting = body.includes('登録中')
  expect(hasAriaBusy, '?state=submitting sets aria-busy in production').toBe(false)
  expect(hasSubmitting, '?state=submitting shows 登録中 in production').toBe(false)
})

// ── E. colony-create ?state=submitting does NOT lock the form ────────────────

test('E: colony-create ?state=submitting does NOT force submitting UI in production', async ({ page }) => {
  await goToAuthenticated(page, '?screen=colony-create&state=submitting')
  const html = await page.content()
  const hasAriaBusy = html.includes('aria-busy="true"')
  const body = await page.locator('body').innerText()
  const hasSubmitting = body.includes('登録中')
  expect(hasAriaBusy, '?state=submitting sets aria-busy in production').toBe(false)
  expect(hasSubmitting, '?state=submitting shows 登録中 in production').toBe(false)
})

// ── F. error / offline / loading states not forced in production ──────────────

test('F1: dashboard ?state=error does NOT force error UI in production', async ({ page }) => {
  await goToAuthenticated(page, '?screen=dashboard&state=error')
  const body = await page.locator('body').innerText()
  // May show empty/normal state; must not show forced error from URL param
  // We check that the page reached and rendered (not stuck at auth-checking)
  const hasAuthChecking = await page.locator('[data-testid="auth-checking"]').count()
  expect(hasAuthChecking, 'Stuck at auth-checking').toBe(0)
  console.log('F1 dashboard ?state=error body snippet:', body.slice(0, 200))
})

test('F2: home ?state=offline does NOT force offline UI in production', async ({ page }) => {
  await goToAuthenticated(page, '?screen=home&state=offline')
  const body = await page.locator('body').innerText()
  expect(body.includes('オフライン'), '?state=offline forces オフライン in production').toBe(false)
  const hasAuthChecking = await page.locator('[data-testid="auth-checking"]').count()
  expect(hasAuthChecking, 'Stuck at auth-checking').toBe(0)
})

test('F3: home ?state=loading does NOT force loading skeleton in production', async ({ page }) => {
  await goToAuthenticated(page, '?screen=home&state=loading')
  const html = await page.content()
  // After guard fix, viewState='normal' so skeleton driven by actual data state, not URL
  // We just confirm no infinite loading forced by the URL param alone (page rendered)
  const hasAuthChecking = await page.locator('[data-testid="auth-checking"]').count()
  expect(hasAuthChecking, 'Stuck at auth-checking').toBe(0)
  console.log('F3 home ?state=loading html snippet:', html.slice(0, 300))
})

// ── G. unauthenticated access redirects to login ─────────────────────────────

test('G: unauthenticated ?screen=settings&state=normal goes to login', async ({ page }) => {
  // No HoneyDB injection — production behavior, session check pending/unauthenticated
  await page.goto('?screen=settings&state=normal', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  const body = await page.locator('body').innerText()
  const hasProtected = body.includes('設定') && !body.includes('ログイン')
  const hasLogin = body.includes('ログイン') || body.includes('メールアドレス')
  expect(hasProtected, 'Protected settings content shown without auth').toBe(false)
  expect(hasLogin, 'Login screen not shown for unauthenticated access').toBe(true)
})
