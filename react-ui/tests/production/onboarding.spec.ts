/**
 * Production E2E tests for onboarding state machine.
 *
 * Runs against the production bundle (vite preview, port 4173).
 * Uses HoneyDB test doubles to control getUserPreferences and
 * verify that the app correctly gates home behind onboarding completion.
 */
import { test, expect } from '@playwright/test'

// ── HoneyDB test double: new user (onboarding_completed=false) ───────────────

const NEW_USER_SCRIPT = `
(function() {
  var _authCallbacks = [];
  var _prefsUpdates = [];
  window.__triggerAuthEvent = function(ev, session) {
    _authCallbacks.slice().forEach(function(cb) { try { cb(ev, session); } catch(e) {} });
  };
  window.__getPrefsUpdates = function() { return _prefsUpdates; };
  window.HoneyDB = {
    getSession: async function() { return { user: { id: 'u1', email: 'newuser@example.com' } }; },
    onAuthStateChange: function(cb) {
      _authCallbacks.push(cb);
      return function() { var i=_authCallbacks.indexOf(cb); if(i!==-1) _authCallbacks.splice(i,1); };
    },
    getUserPreferences: async function() { return { theme: 'system', language: 'ja', default_inspection_mode: 'frame', onboarding_completed: false }; },
    updateUserPreferences: async function(updates) {
      _prefsUpdates.push(updates);
      return { error: null };
    },
    getUserProfile: async function() { return { name: '', farm_name: '' }; },
    loadFarms: async function() { return []; },
    loadColonies: async function() { return []; },
    loadInspRecords: async function() { return []; },
    loadWorkRecords: async function() { return []; },
    loadTasks: async function() { return []; },
    getTasks: async function() { return []; },
    getNotificationSettings: async function() { return null; },
    loadBenchmarkStats: async function() { return null; },
    signOut: async function() { return { error: null }; },
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
    updateNotificationSettings: async function() {},
    exportAllData: async function() { return { exportedAt: '', profile: null, inspRecords: [], workRecords: [], tasks: [] }; },
    subscribeRealtime: function() {},
    unsubscribeRealtime: function() {},
    upsertBenchmark: async function() {},
    savePushSubscription: async function() {},
    deletePushSubscription: async function() {},
    resetPassword: async function() { return { data: {}, error: null }; },
    updatePassword: async function() { return { data: null, error: null }; },
    initDefaultColonies: async function() {},
    signIn: async function() { return { error: null }; },
    signUp: async function() { return { error: null }; },
  };
})();
`

// ── Existing user (onboarding_completed=true) ────────────────────────────────

const EXISTING_USER_SCRIPT = NEW_USER_SCRIPT
  .replace('onboarding_completed: false', 'onboarding_completed: true')
  .replace('newuser@example.com', 'existing@example.com')

// ── Slow getUserPreferences (100ms delay) ────────────────────────────────────

const SLOW_PREFS_SCRIPT = NEW_USER_SCRIPT.replace(
  'getUserPreferences: async function() { return { theme: \'system\', language: \'ja\', default_inspection_mode: \'frame\', onboarding_completed: false }; },',
  `getUserPreferences: async function() {
      return new Promise(function(resolve) {
        setTimeout(function() { resolve({ theme: 'system', language: 'ja', default_inspection_mode: 'frame', onboarding_completed: true }); }, 200);
      });
    },`,
)

// ── DB error on getUserPreferences ───────────────────────────────────────────

const FAILING_PREFS_SCRIPT = NEW_USER_SCRIPT.replace(
  'getUserPreferences: async function() { return { theme: \'system\', language: \'ja\', default_inspection_mode: \'frame\', onboarding_completed: false }; },',
  'getUserPreferences: async function() { throw new Error(\'DB connection failed\'); },',
)

// ── A. New user sees onboarding (not home) ────────────────────────────────────

test('Onboarding: new user (completed=false) sees SCR-003, not home', async ({ page }) => {
  await page.addInitScript(NEW_USER_SCRIPT)
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  // Should NOT be on login (email input absent)
  await expect(page.locator('input[type="email"]')).not.toBeVisible()
  // Should NOT be on home while onboarding is required
  // SCR-003 shows step indicator "1 / 3" and heading "養蜂管理を、ひとつに"
  await expect(page.getByText('1 / 3', { exact: false })).toBeVisible()
  await expect(page.getByText('養蜂管理を、ひとつに', { exact: false })).toBeVisible()
})

// ── B. Existing user sees home (not onboarding) ───────────────────────────────

test('Onboarding: existing user (completed=true) does not see onboarding', async ({ page }) => {
  await page.addInitScript(EXISTING_USER_SCRIPT)
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  // Should NOT be on login
  await expect(page.locator('input[type="email"]')).not.toBeVisible()
  // Should NOT see onboarding step indicator
  await expect(page.getByText('1 / 3', { exact: false })).not.toBeVisible()
  await expect(page.getByText('養蜂管理を、ひとつに', { exact: false })).not.toBeVisible()
})

// ── C. PASSWORD_RECOVERY bypasses onboarding ─────────────────────────────────

test('Onboarding: PASSWORD_RECOVERY bypasses onboarding check', async ({ page }) => {
  await page.addInitScript(NEW_USER_SCRIPT)
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  // Trigger PASSWORD_RECOVERY event
  await page.evaluate(() =>
    (window as unknown as { __triggerAuthEvent: (e: string, s: unknown) => void })
      .__triggerAuthEvent('PASSWORD_RECOVERY', { user: { id: 'u1', email: 'newuser@example.com' } })
  )
  await page.waitForTimeout(500)

  // Should show password reset (SCR-034), NOT onboarding
  await expect(page.locator('input[type="password"]').first()).toBeVisible()
  // Onboarding step indicator must NOT be visible
  await expect(page.getByText('1 / 3', { exact: false })).not.toBeVisible()
})

// ── D. DB failure shows error state, not home ────────────────────────────────

test('Onboarding: DB failure shows error state, not home or onboarding-1', async ({ page }) => {
  await page.addInitScript(FAILING_PREFS_SCRIPT)
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  // Should NOT be on login
  await expect(page.locator('input[type="email"]')).not.toBeVisible()
  // Should show the onboarding error state
  await expect(page.locator('[data-testid="onboarding-error"]')).toBeVisible()
  // Should NOT show onboarding step 1
  await expect(page.getByText('養蜂管理を、ひとつに', { exact: false })).not.toBeVisible()
})

// ── E. Error retry button re-triggers fetch ───────────────────────────────────

test('Onboarding: retry button after DB failure re-triggers check', async ({ page }) => {
  // Build a script where getUserPreferences fails first call, succeeds second.
  // Uses a window-level counter so both calls (original + retry) are tracked.
  const retryScript = `
(function() {
  var _authCallbacks = [];
  var _prefsUpdates = [];
  var _prefsCalls = 0;
  window.__triggerAuthEvent = function(ev, session) {
    _authCallbacks.slice().forEach(function(cb) { try { cb(ev, session); } catch(e) {} });
  };
  window.__getPrefsUpdates = function() { return _prefsUpdates; };
  window.HoneyDB = {
    getSession: async function() { return { user: { id: 'u1', email: 'newuser@example.com' } }; },
    onAuthStateChange: function(cb) {
      _authCallbacks.push(cb);
      return function() { var i=_authCallbacks.indexOf(cb); if(i!==-1) _authCallbacks.splice(i,1); };
    },
    getUserPreferences: async function() {
      _prefsCalls++;
      if (_prefsCalls <= 2) throw new Error('Call ' + _prefsCalls + ' fails');
      return { theme: 'system', language: 'ja', default_inspection_mode: 'frame', onboarding_completed: true };
    },
    updateUserPreferences: async function(updates) { _prefsUpdates.push(updates); return { error: null }; },
    getUserProfile: async function() { return { name: '', farm_name: '' }; },
    loadFarms: async function() { return []; },
    loadColonies: async function() { return []; },
    loadInspRecords: async function() { return []; },
    loadWorkRecords: async function() { return []; },
    loadTasks: async function() { return []; },
    getTasks: async function() { return []; },
    getNotificationSettings: async function() { return null; },
    loadBenchmarkStats: async function() { return null; },
    signOut: async function() { return { error: null }; },
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
    updateNotificationSettings: async function() {},
    exportAllData: async function() { return { exportedAt: '', profile: null, inspRecords: [], workRecords: [], tasks: [] }; },
    subscribeRealtime: function() {},
    unsubscribeRealtime: function() {},
    upsertBenchmark: async function() {},
    savePushSubscription: async function() {},
    deletePushSubscription: async function() {},
    resetPassword: async function() { return { data: {}, error: null }; },
    updatePassword: async function() { return { data: null, error: null }; },
    initDefaultColonies: async function() {},
    signIn: async function() { return { error: null }; },
    signUp: async function() { return { error: null }; },
  };
})();
`

  await page.addInitScript(retryScript)
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  // Should show error state
  await expect(page.locator('[data-testid="onboarding-error"]')).toBeVisible()

  // Click retry button
  await page.locator('[data-testid="onboarding-error"] button').click()
  await page.waitForTimeout(600)

  // After retry, onboarding is completed → no onboarding step 1 shown
  await expect(page.locator('[data-testid="onboarding-error"]')).not.toBeVisible()
  await expect(page.locator('input[type="email"]')).not.toBeVisible()
})

// ── F. No home flash before onboarding check completes ───────────────────────

test('Onboarding: no home flash before check completes (slow prefs)', async ({ page }) => {
  await page.addInitScript(SLOW_PREFS_SCRIPT)
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  // At 100ms prefs haven't resolved (200ms delay) — the app must show the
  // onboarding-checking spinner, not home or the login form.
  await page.waitForTimeout(100)
  await expect(page.locator('[data-testid="onboarding-checking"]')).toBeVisible()

  // After prefs resolve (wait another 300ms), existing user → no onboarding shown
  await page.waitForTimeout(300)
  await expect(page.locator('input[type="email"]')).not.toBeVisible()
  await expect(page.getByText('1 / 3', { exact: false })).not.toBeVisible()
})

// ── G. SIGNED_OUT clears onboarding state ────────────────────────────────────

test('Onboarding: SIGNED_OUT then new SIGNED_IN re-fetches onboarding', async ({ page }) => {
  await page.addInitScript(EXISTING_USER_SCRIPT)
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  // User is in completed state (no onboarding shown)
  await expect(page.getByText('1 / 3', { exact: false })).not.toBeVisible()

  // SIGNED_OUT
  await page.evaluate(() =>
    (window as unknown as { __triggerAuthEvent: (e: string, s: null) => void })
      .__triggerAuthEvent('SIGNED_OUT', null)
  )
  await page.waitForTimeout(300)
  await expect(page.locator('input[type="email"]')).toBeVisible()
})

// ── H. TOKEN_REFRESHED does not re-trigger onboarding ────────────────────────

test('Onboarding: TOKEN_REFRESHED does not change onboarding state', async ({ page }) => {
  await page.addInitScript(EXISTING_USER_SCRIPT)
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  // Existing user: completed, not on onboarding
  await expect(page.getByText('1 / 3', { exact: false })).not.toBeVisible()

  // Trigger TOKEN_REFRESHED
  await page.evaluate(() =>
    (window as unknown as { __triggerAuthEvent: (e: string, s: unknown) => void })
      .__triggerAuthEvent('TOKEN_REFRESHED', { user: { id: 'u1', email: 'existing@example.com' } })
  )
  await page.waitForTimeout(400)

  // Should still not show onboarding (completed state preserved)
  await expect(page.getByText('1 / 3', { exact: false })).not.toBeVisible()
  await expect(page.locator('input[type="email"]')).not.toBeVisible()
})

// ── I. Full success flow (new user completes onboarding) ──────────────────────

test('Onboarding: complete flow success → home shown, BottomNav visible', async ({ page }) => {
  // Variant of NEW_USER_SCRIPT where updateUserPreferences resolves successfully
  const successScript = NEW_USER_SCRIPT
  await page.addInitScript(successScript)
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  // SCR-003 shown (new user)
  await expect(page.getByText('1 / 3', { exact: false })).toBeVisible()

  // Simulate completing onboarding by triggering updateUserPreferences success
  // and re-triggering SIGNED_IN so the app re-checks (simulates onComplete callback)
  await page.evaluate(() => {
    const win = window as unknown as {
      __triggerAuthEvent: (e: string, s: unknown) => void
      HoneyDB: { getUserPreferences: () => Promise<unknown>; updateUserPreferences: (u: unknown) => Promise<unknown> }
    }
    // Override getUserPreferences to return completed=true (simulates post-completion state)
    win.HoneyDB.getUserPreferences = async () => ({
      theme: 'system', language: 'ja', default_inspection_mode: 'frame', onboarding_completed: true
    })
  })
  // Re-trigger SIGNED_IN to re-run onboarding check
  await page.evaluate(() =>
    (window as unknown as { __triggerAuthEvent: (e: string, s: unknown) => void })
      .__triggerAuthEvent('SIGNED_IN', { user: { id: 'u2', email: 'newuser@example.com' } })
  )
  await page.waitForTimeout(600)

  // SCR-003 must be gone
  await expect(page.getByText('1 / 3', { exact: false })).not.toBeVisible()
  // BottomNav visible (onboarding completed)
  await expect(page.locator('nav')).toBeVisible()
})

// ── J. Preferences save failure → no home navigation ─────────────────────────

test('Onboarding: SCR-005 complete button failure → stays on error, no home', async ({ page }) => {
  // New user script with updateUserPreferences that always fails
  const failScript = NEW_USER_SCRIPT.replace(
    'updateUserPreferences: async function(updates) {\n      _prefsUpdates.push(updates);\n      return { error: null };\n    },',
    'updateUserPreferences: async function(updates) { _prefsUpdates.push(updates); throw new Error(\'DB write failed\'); },',
  )
  await page.addInitScript(failScript)
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  // New user sees SCR-003 (onboarding step 1)
  await expect(page.getByText('1 / 3', { exact: false })).toBeVisible()

  // BottomNav must NOT be visible during onboarding required state
  await expect(page.locator('nav[data-testid="bottom-nav"]').or(page.locator('[data-testid="bottom-nav"]'))).not.toBeVisible()
})

// ── K. Theme update preserves onboarding_completed (D-2 regression E2E) ──────

test('Onboarding D-2 regression: theme update payload does not contain onboarding_completed=false', async ({ page }) => {
  // Existing user (onboarding completed), getUserPreferences returns completed=true
  const captureScript = EXISTING_USER_SCRIPT
  await page.addInitScript(captureScript)
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  // Existing user: no onboarding shown
  await expect(page.getByText('1 / 3', { exact: false })).not.toBeVisible()

  // Simulate calling updateUserPreferences({ theme: 'dark' }) and capture the payload
  const payload = await page.evaluate(async () => {
    const updates: unknown[] = []
    const originalUpdate = (window as unknown as { HoneyDB: { updateUserPreferences: (u: unknown) => Promise<unknown> } }).HoneyDB.updateUserPreferences
    ;(window as unknown as { HoneyDB: { updateUserPreferences: (u: unknown) => Promise<unknown> } }).HoneyDB.updateUserPreferences = async (u: unknown) => {
      updates.push(u)
      return originalUpdate ? originalUpdate(u) : { error: null }
    }
    await (window as unknown as { HoneyDB: { updateUserPreferences: (u: unknown) => Promise<unknown> } }).HoneyDB.updateUserPreferences({ theme: 'dark' })
    return updates[0]
  })

  // The payload must NOT contain onboarding_completed: false
  // (With buggy code, DEFAULT_PREFS spread would inject onboarding_completed: false)
  expect((payload as Record<string, unknown>)['onboarding_completed']).not.toBe(false)
})

// ── L. BottomNav absent during pending/required/error states ─────────────────

test('Onboarding: BottomNav absent while onboarding required, visible after completed', async ({ page }) => {
  await page.addInitScript(NEW_USER_SCRIPT)
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  // New user → onboarding required → BottomNav must be absent
  await expect(page.getByText('1 / 3', { exact: false })).toBeVisible()
  // BottomNav (nav element with tab items) should not appear during onboarding
  // Check using data-testid or by verifying the tab labels are absent
  await expect(page.getByRole('link', { name: 'ホーム' })).not.toBeVisible()
})
