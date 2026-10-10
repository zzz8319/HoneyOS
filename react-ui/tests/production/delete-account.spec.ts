/**
 * Production E2E tests for account deletion (工程E).
 *
 * Runs against the production bundle (vite preview, port 4173).
 * Uses page.addInitScript() to inject a mock HoneyDB with deleteAccount and
 * reauthenticateForAccountDeletion, similar to existing production E2E test patterns.
 *
 * All tests use a mock that simulates an authenticated user with
 * onboarding completed, so the settings screen is accessible.
 *
 * NOTE: Real deletion E2E is NOT verified here (Edge Function not deployed).
 */

import { test, expect } from '@playwright/test'

// ── Shared mock builder ───────────────────────────────────────────────────────

/**
 * Build the inline HoneyDB mock script.
 * reauthResult:        'success' | 'fail' | 'reauth_required'
 * deleteAccountResult: 'success' | 'fail' | 'reauth_required' | 'network_error'
 * deleteAccountDelayMs: artificial delay for double-submit test
 */
function buildScript(opts: {
  reauthResult: 'success' | 'fail' | 'reauth_required'
  deleteAccountResult: 'success' | 'fail' | 'reauth_required' | 'network_error'
  deleteAccountDelayMs?: number
}): string {
  const { reauthResult, deleteAccountResult, deleteAccountDelayMs = 0 } = opts

  return `
(function() {
  'use strict';

  var _authCallbacks = [];
  var _deleteAccountCalls = [];
  var _reauthCalls = [];

  window.__getDeleteAccountCalls = function() { return _deleteAccountCalls.slice(); };
  window.__getReauthCalls = function() { return _reauthCalls.slice(); };

  window.__triggerAuthEvent = function(event, session) {
    _authCallbacks.slice().forEach(function(cb) {
      try { cb(event, session); } catch(e) {}
    });
  };

  // Simulate authenticated user with completed onboarding
  var _session = { user: { id: 'test-user-123', email: 'test@example.com' }, access_token: 'fake-token' };

  window.HoneyDB = {
    getSession:              async function() { return _session; },
    onAuthStateChange:       function(callback) {
      _authCallbacks.push(callback);
      return function() {
        var i = _authCallbacks.indexOf(callback);
        if (i !== -1) _authCallbacks.splice(i, 1);
      };
    },
    getUserProfile:          async function() { return { name: 'テスト太郎', farm_name: 'テスト養蜂場' }; },
    getUserPreferences:      async function() {
      return { theme: 'system', language: 'ja', default_inspection_mode: 'frame', onboarding_completed: true };
    },
    updateUserPreferences:   async function() { return {}; },
    getNotificationSettings: async function() { return { inspectionReminder: true, aiDiagnosisComplete: true, sensorAlert: true, systemAnnouncement: true }; },
    updateNotificationSettings: async function() {},
    updateProfile:           async function() {},
    loadFarms:               async function() { return []; },
    loadColonies:            async function() { return []; },
    loadInspRecords:         async function() { return []; },
    loadWorkRecords:         async function() { return []; },
    loadTasks:               async function() { return []; },
    getTasks:                async function() { return []; },
    loadBenchmarkStats:      async function() { return null; },
    saveWorkRecord:          async function() {},
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
    signIn:                  async function() { return { error: null }; },
    signOut:                 async function() { return { error: null }; },
    signUp:                  async function() { return {}; },
    exportAllData:           async function() { return { exportedAt: '', profile: null, inspRecords: [], workRecords: [], tasks: [] }; },
    subscribeRealtime:       function() {},
    unsubscribeRealtime:     function() {},
    upsertBenchmark:         async function() {},
    savePushSubscription:    async function() {},
    deletePushSubscription:  async function() {},
    resetPassword:           async function() { return { data: {}, error: null }; },
    updatePassword:          async function() { return { data: { user: null }, error: null }; },

    reauthenticateForAccountDeletion: async function(password) {
      _reauthCalls.push({ password: '***' });  // never log the actual password
      var result = '${reauthResult}';
      if (result === 'success') return { error: null };
      if (result === 'reauth_required') return { error: { message: 'reauth_required', code: 'reauth_required' } };
      return { error: { message: 'パスワードが正しくありません', code: 'invalid_credentials' } };
    },

    deleteAccount: async function(params) {
      _deleteAccountCalls.push({ params: params });
      if (${deleteAccountDelayMs} > 0) {
        await new Promise(function(r) { setTimeout(r, ${deleteAccountDelayMs}); });
      }
      var result = '${deleteAccountResult}';
      if (result === 'success') return { error: null };
      if (result === 'reauth_required') return { error: { message: 'reauth_required', code: 'reauth_required' } };
      if (result === 'network_error') throw new Error('Network error');
      return { error: { message: 'Server error', code: 'server_error' } };
    },
  };
})();
`
}

// ── Helper: open delete dialog and fill both inputs ──────────────────────────

async function openDeleteDialog(page: import('@playwright/test').Page) {
  const settingsTab = page.getByRole('button', { name: /設定/i }).last()
  if (await settingsTab.isVisible()) {
    await settingsTab.click()
  }
  await page.waitForTimeout(200)

  await page.getByRole('button', { name: /アカウントを削除/i }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
}

async function fillDeleteDialog(page: import('@playwright/test').Page, opts: { phrase?: string; password?: string } = {}) {
  const phrase = opts.phrase ?? 'アカウントを削除する'
  const password = opts.password ?? 'correct-password'

  if (phrase) {
    await page.getByRole('textbox', { name: /削除確認テキスト入力/i }).fill(phrase)
  }
  if (password) {
    await page.locator('#delete-password-input').fill(password)
  }
}

// ── Test A: Full success ──────────────────────────────────────────────────────

test('A: successful account deletion navigates to login screen', async ({ page }) => {
  await page.addInitScript(buildScript({ reauthResult: 'success', deleteAccountResult: 'success' }))
  await page.goto('/?screen=settings&tab=settings', { waitUntil: 'networkidle' })

  await page.evaluate(() => {
    ;(window as unknown as { __triggerAuthEvent: (e: string, s: unknown) => void }).__triggerAuthEvent('SIGNED_IN', { user: { id: 'test-user-123', email: 'test@example.com' }, access_token: 'fake-token' })
  })
  await page.waitForTimeout(200)

  await openDeleteDialog(page)
  await fillDeleteDialog(page)

  const deleteBtn = page.getByTestId('delete-account-confirm-btn')
  await expect(deleteBtn).toBeEnabled()
  await deleteBtn.click()

  // Assert login screen shown (LoginScreen shows this catch copy)
  await expect(page.getByText('養蜂を、もっと見えるように。')).toBeVisible({ timeout: 5000 })

  // No previous user profile info visible
  await expect(page.getByText('テスト太郎')).not.toBeVisible()

  // Verify reauth was called exactly once
  const reauthCalls = await page.evaluate(() => (window as unknown as { __getReauthCalls?: () => unknown[] }).__getReauthCalls?.() ?? [])
  expect(reauthCalls.length).toBe(1)
})

// ── Test A2: Phrase only (no password) → delete button disabled ───────────────

test('A2: phrase filled but no password → delete button disabled', async ({ page }) => {
  await page.addInitScript(buildScript({ reauthResult: 'success', deleteAccountResult: 'success' }))
  await page.goto('/?screen=settings&tab=settings', { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    (window as unknown as { __triggerAuthEvent: (e: string, s: unknown) => void }).__triggerAuthEvent('SIGNED_IN', { user: { id: 'test-user-123', email: 'test@example.com' }, access_token: 'fake-token' })
  })
  await page.waitForTimeout(200)

  await openDeleteDialog(page)
  // Fill phrase only, no password
  await page.getByRole('textbox', { name: /削除確認テキスト入力/i }).fill('アカウントを削除する')
  // Leave password empty

  const deleteBtn = page.getByTestId('delete-account-confirm-btn')
  await expect(deleteBtn).toBeDisabled()
})

// ── Test A3: Password only (no phrase) → delete button disabled ───────────────

test('A3: password filled but wrong phrase → delete button disabled', async ({ page }) => {
  await page.addInitScript(buildScript({ reauthResult: 'success', deleteAccountResult: 'success' }))
  await page.goto('/?screen=settings&tab=settings', { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    (window as unknown as { __triggerAuthEvent: (e: string, s: unknown) => void }).__triggerAuthEvent('SIGNED_IN', { user: { id: 'test-user-123', email: 'test@example.com' }, access_token: 'fake-token' })
  })
  await page.waitForTimeout(200)

  await openDeleteDialog(page)
  // Fill password only, wrong phrase
  await page.locator('#delete-password-input').fill('mypassword')
  await page.getByRole('textbox', { name: /削除確認テキスト入力/i }).fill('wrong phrase')

  const deleteBtn = page.getByTestId('delete-account-confirm-btn')
  await expect(deleteBtn).toBeDisabled()
})

// ── Test A4: Phrase + password filled → button enabled ────────────────────────

test('A4: phrase + password both filled → delete button enabled', async ({ page }) => {
  await page.addInitScript(buildScript({ reauthResult: 'success', deleteAccountResult: 'success' }))
  await page.goto('/?screen=settings&tab=settings', { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    (window as unknown as { __triggerAuthEvent: (e: string, s: unknown) => void }).__triggerAuthEvent('SIGNED_IN', { user: { id: 'test-user-123', email: 'test@example.com' }, access_token: 'fake-token' })
  })
  await page.waitForTimeout(200)

  await openDeleteDialog(page)
  await fillDeleteDialog(page)

  const deleteBtn = page.getByTestId('delete-account-confirm-btn')
  await expect(deleteBtn).toBeEnabled()
})

// ── Test B: API failure ───────────────────────────────────────────────────────

test('B: delete API failure keeps dialog open with error message', async ({ page }) => {
  await page.addInitScript(buildScript({ reauthResult: 'success', deleteAccountResult: 'fail' }))
  await page.goto('/?screen=settings&tab=settings', { waitUntil: 'networkidle' })

  await page.evaluate(() => {
    (window as unknown as { __triggerAuthEvent: (e: string, s: unknown) => void }).__triggerAuthEvent('SIGNED_IN', { user: { id: 'test-user-123', email: 'test@example.com' }, access_token: 'fake-token' })
  })
  await page.waitForTimeout(200)

  await openDeleteDialog(page)
  await fillDeleteDialog(page)

  const deleteBtn = page.getByTestId('delete-account-confirm-btn')
  await deleteBtn.click()
  await page.waitForTimeout(500)

  // Dialog still open
  await expect(page.getByRole('dialog')).toBeVisible()
  // Error message shown
  await expect(page.getByRole('alert')).toBeVisible()
  // Not navigated to login
  await expect(page.getByRole('heading', { name: /ログイン/i })).not.toBeVisible()
})

// ── Test B2: Reauth failure → deleteAccount NOT called ────────────────────────

test('B2: reauth failure shows error, deleteAccount not called', async ({ page }) => {
  await page.addInitScript(buildScript({ reauthResult: 'fail', deleteAccountResult: 'success' }))
  await page.goto('/?screen=settings&tab=settings', { waitUntil: 'networkidle' })

  await page.evaluate(() => {
    (window as unknown as { __triggerAuthEvent: (e: string, s: unknown) => void }).__triggerAuthEvent('SIGNED_IN', { user: { id: 'test-user-123', email: 'test@example.com' }, access_token: 'fake-token' })
  })
  await page.waitForTimeout(200)

  await openDeleteDialog(page)
  await fillDeleteDialog(page)

  await page.getByTestId('delete-account-confirm-btn').click()
  await page.waitForTimeout(500)

  // Dialog still open, error shown
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('alert')).toBeVisible()

  // deleteAccount should NOT have been called
  const deleteCalls = await page.evaluate(() => (window as unknown as { __getDeleteAccountCalls?: () => unknown[] }).__getDeleteAccountCalls?.() ?? [])
  expect(deleteCalls.length).toBe(0)

  // Not navigated to login
  await expect(page.getByText('養蜂を、もっと見えるように。')).not.toBeVisible()
})

// ── Test C: Offline ───────────────────────────────────────────────────────────

test('C: offline blocks deletion', async ({ page }) => {
  await page.addInitScript(buildScript({ reauthResult: 'success', deleteAccountResult: 'success' }))

  // Override navigator.onLine to false so handleDeleteAccount sees offline state
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true })
  })

  await page.goto('/?screen=settings&tab=settings', { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    (window as unknown as { __triggerAuthEvent: (e: string, s: unknown) => void }).__triggerAuthEvent('SIGNED_IN', { user: { id: 'test-user-123', email: 'test@example.com' }, access_token: 'fake-token' })
  })
  await page.waitForTimeout(200)

  await openDeleteDialog(page)
  await fillDeleteDialog(page)

  const deleteBtn = page.getByTestId('delete-account-confirm-btn')
  await deleteBtn.click()
  await page.waitForTimeout(300)

  // Offline error shown, no deleteAccount or reauth calls made
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByText(/オフライン/i)).toBeVisible()
  const calls = await page.evaluate(() => (window as unknown as { __getDeleteAccountCalls?: () => unknown[] }).__getDeleteAccountCalls?.() ?? [])
  expect(calls.length).toBe(0)
  const reauthCalls = await page.evaluate(() => (window as unknown as { __getReauthCalls?: () => unknown[] }).__getReauthCalls?.() ?? [])
  expect(reauthCalls.length).toBe(0)
})

// ── Test D: reauth_required from Edge Function ────────────────────────────────

test('D: reauth_required from Edge Function shows re-login message', async ({ page }) => {
  await page.addInitScript(buildScript({ reauthResult: 'success', deleteAccountResult: 'reauth_required' }))
  await page.goto('/?screen=settings&tab=settings', { waitUntil: 'networkidle' })

  await page.evaluate(() => {
    (window as unknown as { __triggerAuthEvent: (e: string, s: unknown) => void }).__triggerAuthEvent('SIGNED_IN', { user: { id: 'test-user-123', email: 'test@example.com' }, access_token: 'fake-token' })
  })
  await page.waitForTimeout(200)

  await openDeleteDialog(page)
  await fillDeleteDialog(page)
  await page.getByTestId('delete-account-confirm-btn').click()
  await page.waitForTimeout(500)

  // Re-login message shown
  await expect(page.getByText('安全のため再ログインしてください')).toBeVisible()
  // Re-login button visible
  await expect(page.getByRole('button', { name: /再ログイン/i })).toBeVisible()
})

// ── Test D2: reauth_required from reauthenticate call ────────────────────────

test('D2: reauth_required from reauthenticate shows re-login message', async ({ page }) => {
  await page.addInitScript(buildScript({ reauthResult: 'reauth_required', deleteAccountResult: 'success' }))
  await page.goto('/?screen=settings&tab=settings', { waitUntil: 'networkidle' })

  await page.evaluate(() => {
    (window as unknown as { __triggerAuthEvent: (e: string, s: unknown) => void }).__triggerAuthEvent('SIGNED_IN', { user: { id: 'test-user-123', email: 'test@example.com' }, access_token: 'fake-token' })
  })
  await page.waitForTimeout(200)

  await openDeleteDialog(page)
  await fillDeleteDialog(page)
  await page.getByTestId('delete-account-confirm-btn').click()
  await page.waitForTimeout(500)

  // Re-login message shown
  await expect(page.getByText('安全のため再ログインしてください')).toBeVisible()
})

// ── Test E: Double-submit prevention ─────────────────────────────────────────

test('E: double-submit prevention calls deleteAccount only once', async ({ page }) => {
  await page.addInitScript(buildScript({ reauthResult: 'success', deleteAccountResult: 'success', deleteAccountDelayMs: 800 }))
  await page.goto('/?screen=settings&tab=settings', { waitUntil: 'networkidle' })

  await page.evaluate(() => {
    (window as unknown as { __triggerAuthEvent: (e: string, s: unknown) => void }).__triggerAuthEvent('SIGNED_IN', { user: { id: 'test-user-123', email: 'test@example.com' }, access_token: 'fake-token' })
  })
  await page.waitForTimeout(200)

  await openDeleteDialog(page)
  await fillDeleteDialog(page)

  const deleteBtn = page.getByTestId('delete-account-confirm-btn')
  // Click twice rapidly
  await deleteBtn.click()
  await deleteBtn.click({ force: true })

  // Wait for deletion to complete
  await page.waitForTimeout(1200)

  // deleteAccount called only once
  const calls = await page.evaluate(() => (window as unknown as { __getDeleteAccountCalls?: () => unknown[] }).__getDeleteAccountCalls?.() ?? [])
  expect(calls.length).toBe(1)
})
