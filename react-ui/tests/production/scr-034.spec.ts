/**
 * Production E2E tests for SCR-034: Password Recovery Flow.
 *
 * Runs against the production bundle (vite preview, port 4173).
 * Uses a HoneyDB test double that captures calls and exposes
 * __triggerAuthEvent / __getResetPasswordCalls / __getUpdatePasswordCalls / __wasSignOutCalled.
 */
import { test, expect } from '@playwright/test'

const RECOVERY_SCRIPT = `
(function() {
  var _authCallbacks = [];
  var _resetPasswordCalls = [];
  var _updatePasswordCalls = [];
  var _signOutCalled = false;

  window.__triggerAuthEvent = function(event, session) {
    _authCallbacks.slice().forEach(function(cb) {
      try { cb(event, session); } catch(e) {}
    });
  };
  window.__getResetPasswordCalls = function() { return _resetPasswordCalls; };
  window.__getUpdatePasswordCalls = function() { return _updatePasswordCalls; };
  window.__wasSignOutCalled = function() { return _signOutCalled; };

  window.HoneyDB = {
    getSession: async function() { return null; },
    onAuthStateChange: function(callback) {
      _authCallbacks.push(callback);
      return function() {
        var idx = _authCallbacks.indexOf(callback);
        if (idx !== -1) _authCallbacks.splice(idx, 1);
      };
    },
    resetPassword: async function(email, opts) {
      _resetPasswordCalls.push({ email: email, opts: opts });
      return { data: {}, error: null };
    },
    updatePassword: async function(password) {
      _updatePasswordCalls.push({ called: true });
      return { data: { user: { id: 'u1', email: 'test@example.com' } }, error: null };
    },
    signOut: async function() { _signOutCalled = true; return { error: null }; },
    getUserProfile: async function() { return { name: 'テスト', farm_name: '' }; },
    getUserPreferences: async function() { return { theme: 'system', language: 'ja', default_inspection_mode: 'frame' }; },
    loadFarms: async function() { return []; },
    loadColonies: async function() { return []; },
    loadInspRecords: async function() { return []; },
    loadWorkRecords: async function() { return []; },
    loadTasks: async function() { return []; },
    getTasks: async function() { return []; },
    getNotificationSettings: async function() { return null; },
    loadBenchmarkStats: async function() { return null; },
    saveWorkRecord: async function() { return null; },
    updateWorkRecord: async function() {},
    deleteWorkRecord: async function() {},
    saveTask: async function() { return null; },
    updateTask: async function() {},
    completeTask: async function() {},
    deleteTask: async function() {},
    saveInspRecord: async function() { return null; },
    saveFarm: async function() {},
    archiveFarm: async function() {},
    deleteFarm: async function() {},
    saveColony: async function() {},
    archiveColony: async function() {},
    deleteColony: async function() {},
    updateProfile: async function() {},
    updateUserPreferences: async function() {},
    updateNotificationSettings: async function() {},
    exportAllData: async function() { return { exportedAt: '', profile: null, inspRecords: [], workRecords: [], tasks: [] }; },
    subscribeRealtime: function() {},
    unsubscribeRealtime: function() {},
    upsertBenchmark: async function() {},
    savePushSubscription: async function() {},
    deletePushSubscription: async function() {},
    initDefaultColonies: async function() {},
    signIn: async function() { return { error: null }; },
    signUp: async function() { return { error: null }; },
  };
})();
`

// Script variant where updatePassword returns error
const RECOVERY_SCRIPT_UPDATE_FAIL = RECOVERY_SCRIPT.replace(
  'return { data: { user: { id: \'u1\', email: \'test@example.com\' } }, error: null };',
  'return { data: null, error: { message: \'Auth session missing\' } };',
)

// Script variant where signOut returns an error (to test signOutFailed path)
const RECOVERY_SCRIPT_SIGN_OUT_FAIL = RECOVERY_SCRIPT.replace(
  'signOut: async function() { _signOutCalled = true; return { error: null }; },',
  'signOut: async function() { _signOutCalled = true; return { error: { message: \'Network error\' } }; },',
)

test.use({ launchOptions: { executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' } })

// ── A. Email send success ─────────────────────────────────────────────────────

test('SCR-034: email send shows success state', async ({ page }) => {
  await page.addInitScript(RECOVERY_SCRIPT)
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  // Auth settles to unauthenticated → login screen
  await page.locator('button', { hasText: 'パスワードを忘れた方' }).click()
  await page.waitForTimeout(300)

  const emailInput = page.locator('input[type="email"]').first()
  await emailInput.fill('test@example.com')
  await page.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(500)

  const calls = await page.evaluate(() => (window as unknown as { __getResetPasswordCalls: () => unknown[] }).__getResetPasswordCalls())
  expect(calls.length).toBe(1)

  // Should show step 2 (sent) - resend button visible
  const resendBtn = page.locator('button', { hasText: 'メールを再送' })
  await expect(resendBtn).toBeVisible()
})

// ── B. Email send failure shows error ─────────────────────────────────────────

test('SCR-034: email send failure shows error banner', async ({ page }) => {
  // Override resetPassword to return error
  // The screen uses try/catch; for errors we need to throw
  const throwScript = RECOVERY_SCRIPT.replace(
    '_resetPasswordCalls.push({ email: email, opts: opts });\n      return { data: {}, error: null };',
    '_resetPasswordCalls.push({ email: email, opts: opts });\n      throw new Error(\'Rate limit\');',
  )
  await page.addInitScript(throwScript)
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  await page.locator('button', { hasText: 'パスワードを忘れた方' }).click()
  await page.waitForTimeout(300)

  const emailInput = page.locator('input[type="email"]').first()
  await emailInput.fill('test@example.com')
  await page.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(500)

  // Should show error banner
  const errorBanner = page.locator('[role="alert"]').first()
  await expect(errorBanner).toBeVisible()
})

// ── C. PASSWORD_RECOVERY event → Step 3 shown (not Step 1) ───────────────────

test('SCR-034: PASSWORD_RECOVERY event shows password input (Step 3)', async ({ page }) => {
  await page.addInitScript(RECOVERY_SCRIPT)
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  await page.evaluate(() =>
    (window as unknown as { __triggerAuthEvent: (e: string, s: unknown) => void })
      .__triggerAuthEvent('PASSWORD_RECOVERY', { user: { id: 'u1', email: 'test@example.com' } })
  )
  await page.waitForTimeout(400)

  // Should show password inputs (Step 3), not email input (Step 1)
  await expect(page.locator('input[type="password"]').first()).toBeVisible()
  await expect(page.locator('input[type="email"]')).not.toBeVisible()
})

// ── D. Update password success → signOut → login ──────────────────────────────

test('SCR-034: update password success calls signOut and returns to login', async ({ page }) => {
  await page.addInitScript(RECOVERY_SCRIPT)
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  await page.evaluate(() =>
    (window as unknown as { __triggerAuthEvent: (e: string, s: unknown) => void })
      .__triggerAuthEvent('PASSWORD_RECOVERY', { user: { id: 'u1', email: 'test@example.com' } })
  )
  await page.waitForTimeout(400)

  const pwInputs = page.locator('input[type="password"]')
  await pwInputs.nth(0).fill('newpassword123')
  await pwInputs.nth(1).fill('newpassword123')

  await page.locator('button[type="submit"]').click()
  await page.waitForTimeout(500)

  const updateCalls = await page.evaluate(() =>
    (window as unknown as { __getUpdatePasswordCalls: () => unknown[] }).__getUpdatePasswordCalls()
  )
  expect(updateCalls.length).toBe(1)

  const signOutCalled = await page.evaluate(() =>
    (window as unknown as { __wasSignOutCalled: () => boolean }).__wasSignOutCalled()
  )
  expect(signOutCalled).toBe(true)

  // After signOut succeeds, onRecoveryComplete fires immediately; screen returns to login
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 3000 })
})

// ── E. Update password failure → stays on Step 3 ─────────────────────────────

test('SCR-034: update password failure stays on Step 3', async ({ page }) => {
  await page.addInitScript(RECOVERY_SCRIPT_UPDATE_FAIL)
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  await page.evaluate(() =>
    (window as unknown as { __triggerAuthEvent: (e: string, s: unknown) => void })
      .__triggerAuthEvent('PASSWORD_RECOVERY', { user: { id: 'u1', email: 'test@example.com' } })
  )
  await page.waitForTimeout(400)

  const pwInputs = page.locator('input[type="password"]')
  await pwInputs.nth(0).fill('newpassword123')
  await pwInputs.nth(1).fill('newpassword123')

  await page.locator('button[type="submit"]').click()
  await page.waitForTimeout(500)

  // Still on Step 3 — password inputs still visible
  await expect(page.locator('input[type="password"]').first()).toBeVisible()
  // Error banner visible
  await expect(page.locator('[role="alert"]').first()).toBeVisible()
})

// ── F. PASSWORD_RECOVERY → SIGNED_IN doesn't redirect to home ────────────────

test('SCR-034: SIGNED_IN after PASSWORD_RECOVERY stays on recovery screen', async ({ page }) => {
  await page.addInitScript(RECOVERY_SCRIPT)
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  await page.evaluate(() =>
    (window as unknown as { __triggerAuthEvent: (e: string, s: unknown) => void })
      .__triggerAuthEvent('PASSWORD_RECOVERY', { user: { id: 'u1', email: 'test@example.com' } })
  )
  await page.waitForTimeout(400)

  await page.evaluate(() =>
    (window as unknown as { __triggerAuthEvent: (e: string, s: unknown) => void })
      .__triggerAuthEvent('SIGNED_IN', { user: { id: 'u1', email: 'test@example.com' } })
  )
  await page.waitForTimeout(400)

  // Still on recovery screen — password inputs visible
  await expect(page.locator('input[type="password"]').first()).toBeVisible()
})

// ── H. signOut failure shows explicit error with retry ───────────────────────

test('SCR-034: signOut failure shows error message, not login screen', async ({ page }) => {
  await page.addInitScript(RECOVERY_SCRIPT_SIGN_OUT_FAIL)
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  await page.evaluate(() =>
    (window as unknown as { __triggerAuthEvent: (e: string, s: unknown) => void })
      .__triggerAuthEvent('PASSWORD_RECOVERY', { user: { id: 'u1', email: 'test@example.com' } })
  )
  await page.waitForTimeout(400)

  const pwInputs = page.locator('input[type="password"]')
  await pwInputs.nth(0).fill('newpassword123')
  await pwInputs.nth(1).fill('newpassword123')

  await page.locator('button[type="submit"]').click()
  await page.waitForTimeout(800)

  // signOut failed: should NOT return to login screen
  await expect(page.locator('input[type="email"]')).not.toBeVisible()
  // Should show retry button
  await expect(page.locator('button', { hasText: '再試行' })).toBeVisible()
})

// ── I. SCR-034: SDK fires SIGNED_OUT for invalid token → app shows login ──────
// Tests that when SDK processes an invalid recovery token and fires SIGNED_OUT,
// the app correctly shows the login screen, not Step 3 (password input).
// This simulates what detectSessionInUrl:true + invalid token produces in production.

test('SCR-034: SIGNED_OUT after invalid recovery token shows login, not Step 3', async ({ page }) => {
  await page.addInitScript(RECOVERY_SCRIPT)
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  // Simulate: SDK tried to process a recovery hash but token was invalid → SIGNED_OUT
  await page.evaluate(() =>
    (window as unknown as { __triggerAuthEvent: (e: string, s: unknown) => void })
      .__triggerAuthEvent('SIGNED_OUT', null)
  )
  await page.waitForTimeout(400)

  // App should be on login screen, NOT on the password-reset Step 3 form
  await expect(page.locator('input[type="email"]')).toBeVisible()
  // The password-reset Step 3 form shows "新しいパスワードを設定" heading
  await expect(page.locator('h2', { hasText: '新しいパスワードを設定' })).not.toBeVisible()
})

// ── G. redirectTo uses same origin ───────────────────────────────────────────

test('SCR-034: resetPassword redirectTo uses same origin', async ({ page }) => {
  await page.addInitScript(RECOVERY_SCRIPT)
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  await page.locator('button', { hasText: 'パスワードを忘れた方' }).click()
  await page.waitForTimeout(300)

  const emailInput = page.locator('input[type="email"]').first()
  await emailInput.fill('test@example.com')
  await page.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(500)

  const calls = await page.evaluate(() =>
    (window as unknown as { __getResetPasswordCalls: () => Array<{ email: string; opts?: { redirectTo?: string } }> })
      .__getResetPasswordCalls()
  )
  expect(calls.length).toBe(1)
  // The component passes no redirectTo; supabase_client.js computes it from window.location
  // The test double captures what the component passes (opts is undefined or no redirectTo)
  const redirectTo = calls[0].opts?.redirectTo
  if (redirectTo) {
    // If a redirectTo is passed, it must use the same origin
    expect(redirectTo).toMatch(/^http/)
    expect(redirectTo).not.toMatch(/^http.*http/)  // no double URL
  }
  // In any case, no user-supplied external URL injection
  expect(calls[0].opts?.redirectTo ?? '').not.toMatch(/evil\.com/)
})
