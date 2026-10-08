/**
 * Production authentication guard tests.
 *
 * These tests run against the real production bundle (vite preview, port 4173)
 * where import.meta.env.DEV === false and the auth guard is fully active.
 *
 * Test strategy:
 *   - Inject a HoneyDB test double via page.addInitScript() before page.goto()
 *   - The test double controls getSession() without touching production code
 *   - Unauthenticated: getSession() returns { user: null }
 *   - Authenticated:   getSession() returns { user: { id, email } }
 *   - Protected-API call counters verify data loads never occur when unauthed
 *
 * Login screen identification:
 *   LoginScreen has no <h1>. The submit button reads "ログイン" and the email
 *   input has type="email". We detect the login screen by the submit button.
 *
 * getSession call count:
 *   App.tsx calls getSession() in two independent effects:
 *     1. Auth guard effect (always in prod)
 *     2. defaultInspectionMode resolution effect
 *   Therefore getSession is called ≥1 times in production. Tests assert ≥1,
 *   or assert "exactly 2" when both effects are expected to run.
 */
import { test, expect } from '@playwright/test'

// ── Test double helpers ─────────────────────────────────────────────────────

/** Inject an UNAUTHENTICATED HoneyDB test double.
 *  - getSession() → { user: null }
 *  - Protected APIs count calls so we can assert they were never invoked.
 */
function unauthScript(): string {
  return `
(function() {
  var getSessionCallCount = 0;
  var protectedCallCount = 0;
  var protectedCalls = [];

  function protectedApi(name) {
    return async function() {
      protectedCallCount++;
      protectedCalls.push(name);
      throw new Error('Protected API called while unauthenticated: ' + name);
    };
  }

  window.__authTestCounters = {
    get getSessionCount() { return getSessionCallCount; },
    get protectedCount() { return protectedCallCount; },
    get protectedCalls() { return protectedCalls.slice(); },
  };

  window.HoneyDB = {
    getSession: async function() {
      getSessionCallCount++;
      return { user: null };
    },
    getUserProfile:          protectedApi('getUserProfile'),
    getUserPreferences:      async function() { return null; }, // called by inspectionMode effect (benign)
    loadFarms:               protectedApi('loadFarms'),
    loadColonies:            protectedApi('loadColonies'),
    loadInspRecords:         protectedApi('loadInspRecords'),
    loadWorkRecords:         protectedApi('loadWorkRecords'),
    loadTasks:               protectedApi('loadTasks'),
    getTasks:                protectedApi('getTasks'),
    getNotificationSettings: protectedApi('getNotificationSettings'),
    loadBenchmarkStats:      protectedApi('loadBenchmarkStats'),
    signOut:                 protectedApi('signOut'),
    saveWorkRecord:          protectedApi('saveWorkRecord'),
    updateWorkRecord:        protectedApi('updateWorkRecord'),
    deleteWorkRecord:        protectedApi('deleteWorkRecord'),
    saveTask:                protectedApi('saveTask'),
    updateTask:              protectedApi('updateTask'),
    completeTask:            protectedApi('completeTask'),
    deleteTask:              protectedApi('deleteTask'),
    saveInspRecord:          protectedApi('saveInspRecord'),
    saveFarm:                protectedApi('saveFarm'),
    archiveFarm:             protectedApi('archiveFarm'),
    deleteFarm:              protectedApi('deleteFarm'),
    saveColony:              protectedApi('saveColony'),
    archiveColony:           protectedApi('archiveColony'),
    deleteColony:            protectedApi('deleteColony'),
    updateProfile:           protectedApi('updateProfile'),
    updateUserPreferences:   protectedApi('updateUserPreferences'),
    updateNotificationSettings: protectedApi('updateNotificationSettings'),
    exportAllData:           protectedApi('exportAllData'),
    subscribeRealtime:       function() {},
    unsubscribeRealtime:     function() {},
    upsertBenchmark:         protectedApi('upsertBenchmark'),
    savePushSubscription:    protectedApi('savePushSubscription'),
    deletePushSubscription:  protectedApi('deletePushSubscription'),
    resetPassword:           async function() {},
    initDefaultColonies:     protectedApi('initDefaultColonies'),
    signIn:                  async function() { return { error: null }; },
    signUp:                  async function() { return { error: null }; },
  };
})();
`
}

/** Inject an AUTHENTICATED HoneyDB test double.
 *  - getSession() → { user: { id: 'u1', email: 'test@example.com' } }
 */
function authScript(): string {
  return `
(function() {
  var getSessionCallCount = 0;
  window.__authTestCounters = {
    get getSessionCount() { return getSessionCallCount; },
  };
  window.HoneyDB = {
    getSession: async function() {
      getSessionCallCount++;
      return { user: { id: 'u1', email: 'test@example.com' } };
    },
    getUserProfile:          async function() { return { name: 'テスト太郎', farm_name: 'テスト養蜂場' }; },
    getUserPreferences:      async function() { return { theme: 'system', language: 'ja', default_inspection_mode: 'frame' }; },
    getNotificationSettings: async function() { return null; },
    loadFarms:               async function() { return []; },
    loadColonies:            async function() { return []; },
    loadInspRecords:         async function() { return []; },
    loadWorkRecords:         async function() { return []; },
    loadTasks:               async function() { return []; },
    getTasks:                async function() { return []; },
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
}

/** Inject an UNINITIALIZED HoneyDB (window.HoneyDB = undefined). */
function noHoneyDBScript(): string {
  return `
(function() {
  Object.defineProperty(window, 'HoneyDB', {
    get: function() { return undefined; },
    configurable: true,
  });
})();
`
}

/** Inject a HoneyDB where getSession() rejects. */
function failingSessionScript(): string {
  return `
(function() {
  window.HoneyDB = {
    getSession: async function() {
      throw new Error('Network error: getSession failed');
    },
    getUserPreferences: async function() { return null; },
    signIn:  async function() { return { error: null }; },
    signUp:  async function() { return { error: null }; },
    resetPassword: async function() {},
  };
})();
`
}

// ── Selectors ───────────────────────────────────────────────────────────────

/** The login screen submit button - unique to LoginScreen */
const LOGIN_BUTTON = 'button[type="submit"]'
/** Email input - present only on login screen */
const EMAIL_INPUT  = 'input[type="email"]'

// Protected content markers (only shown when authenticated with mock data)
const PROTECTED_MARKERS = ['山田 太郎', 'A-03']

// ── Protected URL fixtures ──────────────────────────────────────────────────

const PROTECTED_URLS = [
  { name: 'dashboard',         url: '/?screen=home' },
  { name: 'settings',          url: '/?screen=settings' },
  { name: 'colony-detail',     url: '/?screen=colony-detail&colonyId=a3' },
  { name: 'inspection-record', url: '/?screen=inspection-record' },
  { name: 'work-history',      url: '/?screen=work-history' },
  { name: 'report',            url: '/?screen=report' },
]

// ── Section 1: Unauthenticated session → login shown, protected content hidden
test.describe('Production auth guard — unauthenticated session', () => {
  for (const { name, url } of PROTECTED_URLS) {
    test(`${name}: redirects to login, no protected content`, async ({ page }) => {
      const pageErrors: string[] = []
      page.on('pageerror', err => pageErrors.push(err.message))

      // Flash detection: track elements added to DOM before auth resolves
      const observer = `
(function() {
  window.__flashedElements = [];
  var labels = ['A-03', '山田 太郎'];
  function startObserver() {
    var root = document.documentElement || document.body || document;
    if (!root) { setTimeout(startObserver, 10); return; }
    var obs = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        m.addedNodes.forEach(function(node) {
          if (node.nodeType !== 1) return;
          var text = node.textContent || '';
          labels.forEach(function(label) {
            if (text.includes(label)) {
              window.__flashedElements.push('text:' + label + '@' + (node.tagName || ''));
            }
          });
        });
      });
    });
    try { obs.observe(root, { childList: true, subtree: true }); } catch(e) {}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
  } else {
    startObserver();
  }
})();
`
      await page.addInitScript(unauthScript())
      await page.addInitScript(observer)
      await page.goto(url, { waitUntil: 'networkidle' })
      await page.waitForTimeout(500)

      // Login screen must be visible (identified by email input)
      await expect(page.locator(EMAIL_INPUT)).toBeVisible({ timeout: 5000 })
      await expect(page.locator(LOGIN_BUTTON)).toBeVisible({ timeout: 5000 })

      // Protected markers must not be visible
      for (const marker of PROTECTED_MARKERS) {
        await expect(page.getByText(marker, { exact: false })).not.toBeVisible()
      }

      // getSession must have been called (auth check ran)
      const counters = await page.evaluate(() => (window as unknown as { __authTestCounters: { getSessionCount: number; protectedCount: number; protectedCalls: string[] } }).__authTestCounters)
      expect(counters.getSessionCount, 'getSession must be called in production').toBeGreaterThanOrEqual(1)
      expect(counters.protectedCount, `protected API calls for ${name}: ${counters.protectedCalls.join(',')}`).toBe(0)

      // Flash detection: protected content must never appear in DOM
      const flashed = await page.evaluate(() => (window as unknown as { __flashedElements: string[] }).__flashedElements)
      expect(flashed, `Protected content flashed for ${name}: ${flashed.join(', ')}`).toHaveLength(0)

      // No page crashes
      expect(pageErrors, `Page errors for ${name}`).toHaveLength(0)
    })
  }
})

// ── Section 2: auth-checking element shown before redirect ──────────────────
test.describe('Production auth guard — checking state is shown', () => {
  test('auth-checking element appears before login on unauthenticated load', async ({ page }) => {
    // Use a slow getSession (200ms) so there is time to observe auth-checking
    const slowAuthScript = `
(function() {
  window.HoneyDB = {
    getSession: function() {
      return new Promise(function(resolve) {
        setTimeout(function() { resolve({ user: null }); }, 200);
      });
    },
    getUserPreferences: async function() { return null; },
    signIn:  async function() { return { error: null }; },
    signUp:  async function() { return { error: null }; },
    resetPassword: async function() {},
  };
  window.__seenCheckingThenLogin = [];
  function setupCheckObserver() {
    var root = document.documentElement || document.body || document;
    if (!root) { setTimeout(setupCheckObserver, 10); return; }
    var obs = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        m.addedNodes.forEach(function(node) {
          if (node.nodeType !== 1) return;
          var el = node;
          if (el.dataset && el.dataset.testid === 'auth-checking') {
            window.__seenCheckingThenLogin.push('auth-checking');
          }
          var found = el.querySelector && el.querySelector('[data-testid="auth-checking"]');
          if (found) window.__seenCheckingThenLogin.push('auth-checking-child');
          if (el.querySelector && el.querySelector('input[type="email"]')) {
            window.__seenCheckingThenLogin.push('login-form');
          }
          if (el.matches && el.matches('input[type="email"]')) {
            window.__seenCheckingThenLogin.push('login-form');
          }
        });
      });
    });
    try { obs.observe(root, { childList: true, subtree: true }); } catch(e) {}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupCheckObserver);
  } else {
    setupCheckObserver();
  }
})();
`
    await page.addInitScript(slowAuthScript)
    await page.goto('/?screen=home', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(600)

    const seen: string[] = await page.evaluate(() => (window as unknown as { __seenCheckingThenLogin: string[] }).__seenCheckingThenLogin)
    const checkingIdx = seen.findIndex(s => s.startsWith('auth-checking'))
    const loginIdx = seen.findIndex(s => s === 'login-form')

    expect(checkingIdx, `auth-checking appeared (seen: ${JSON.stringify(seen)})`).toBeGreaterThanOrEqual(0)
    expect(loginIdx, 'login form appeared after checking').toBeGreaterThan(checkingIdx)
  })
})

// ── Section 3: HoneyDB uninitialized ───────────────────────────────────────
test.describe('Production auth guard — HoneyDB uninitialized', () => {
  test('shows login screen, no page crash', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', err => pageErrors.push(err.message))

    await page.addInitScript(noHoneyDBScript())
    await page.goto('/?screen=home', { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)

    await expect(page.locator(EMAIL_INPUT)).toBeVisible({ timeout: 5000 })
    expect(pageErrors).toHaveLength(0)
  })
})

// ── Section 4: getSession() throws ─────────────────────────────────────────
test.describe('Production auth guard — getSession fails', () => {
  test('shows login screen, no page crash, no personal data shown', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', err => pageErrors.push(err.message))

    await page.addInitScript(failingSessionScript())
    await page.goto('/?screen=settings', { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)

    await expect(page.locator(EMAIL_INPUT)).toBeVisible({ timeout: 5000 })
    for (const marker of PROTECTED_MARKERS) {
      await expect(page.getByText(marker, { exact: false })).not.toBeVisible()
    }
    expect(pageErrors).toHaveLength(0)
  })
})

// ── Section 5: Authenticated session ───────────────────────────────────────
test.describe('Production auth guard — authenticated session', () => {
  test('after checking, shows app (not login), getSession called', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', err => pageErrors.push(err.message))

    await page.addInitScript(authScript())
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)

    // Should NOT show login
    await expect(page.locator(EMAIL_INPUT)).not.toBeVisible()
    // auth-checking should be gone by now
    await expect(page.locator('[data-testid="auth-checking"]')).not.toBeVisible()

    // getSession must have been called (auth check ran)
    const counters = await page.evaluate(() => (window as unknown as { __authTestCounters: { getSessionCount: number } }).__authTestCounters)
    expect(counters.getSessionCount, 'getSession must be called in production').toBeGreaterThanOrEqual(1)

    expect(pageErrors).toHaveLength(0)
  })

  test('?screen= does not bypass getSession in production', async ({ page }) => {
    // In production, ?screen= does NOT bypass auth. Even with ?screen=settings,
    // getSession() must still be called to resolve auth before any screen renders.
    const pageErrors: string[] = []
    page.on('pageerror', err => pageErrors.push(err.message))

    await page.addInitScript(authScript())
    await page.goto('/?screen=settings', { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)

    // getSession was called (auth was NOT bypassed by ?screen=)
    const counters = await page.evaluate(() => (window as unknown as { __authTestCounters: { getSessionCount: number } }).__authTestCounters)
    expect(counters.getSessionCount, '?screen= must not skip getSession in production').toBeGreaterThanOrEqual(1)

    expect(pageErrors).toHaveLength(0)
  })
})
