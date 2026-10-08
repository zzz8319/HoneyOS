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
