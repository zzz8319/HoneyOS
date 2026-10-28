/**
 * Production E2E tests for:
 *  - P1-B: saveColony must pass farmId as 4th argument
 *  - P1-C: Colonies with no inspection records show '未評価' (unknown), not '危険'
 *
 * Runs against the production bundle (vite preview, port 4173).
 * window.HoneyDB is injected as a test double.
 */
import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

function makeAuthStub(overrides: string = ''): string {
  return `
(function() {
  var _saveColonyCalls = [];
  window.__getSaveColonyCalls = function() { return _saveColonyCalls; };

  window.HoneyDB = {
    getSession: async function() { return { user: { id: 'u1', email: 'test@example.com' } }; },
    onAuthStateChange: function(cb) { return function() {}; },
    getUserProfile:    async function() { return { name: 'テスト', farm_name: '' }; },
    getUserPreferences: async function() { return { theme: 'system', language: 'ja', default_inspection_mode: 'frame', onboarding_completed: true }; },
    getNotificationSettings: async function() { return null; },
    loadBenchmarkStats: async function() { return null; },
    loadFarms:   async function() {
      return [{ id: 1, name: '山田養蜂場' }, { id: 2, name: '川東養蜂場' }];
    },
    loadColonies: async function() { return []; },
    loadInspRecords: async function() { return []; },
    loadWorkRecords: async function() { return []; },
    loadTasks:   async function() { return []; },
    getTasks:    async function() { return []; },
    saveFarm:    async function() { return { id: 1 }; },
    archiveFarm: async function() {},
    deleteFarm:  async function() {},
    saveColony:  async function(id, name, sortOrder, opts) {
      _saveColonyCalls.push({ id: id, name: name, sortOrder: sortOrder, opts: opts });
    },
    archiveColony: async function() {},
    deleteColony: async function() {},
    saveTask:    async function() { return null; },
    updateTask:  async function() {},
    completeTask: async function() {},
    deleteTask:  async function() {},
    saveInspRecord: async function() { return null; },
    saveWorkRecord: async function() { return null; },
    updateWorkRecord: async function() {},
    deleteWorkRecord: async function() {},
    updateProfile: async function() {},
    updateUserPreferences: async function() {},
    updateNotificationSettings: async function() {},
    exportAllData: async function() { return { exportedAt: '', profile: null, inspRecords: [], workRecords: [], tasks: [] }; },
    subscribeRealtime: function() {},
    unsubscribeRealtime: function() {},
    upsertBenchmark: async function() {},
    savePushSubscription: async function() {},
    deletePushSubscription: async function() {},
    resetPassword: async function() { return { data: {}, error: null }; },
    initDefaultColonies: async function() {},
    signIn: async function() { return { error: null }; },
    signUp: async function() { return { error: null }; },
    signOut: async function() { return { error: null }; },
    ${overrides}
  };
})();
`
}

async function goToScreen(page: Page, screen: string, extraScript?: string): Promise<void> {
  const script = extraScript ?? makeAuthStub()
  await page.addInitScript(script)
  await page.goto(`?screen=${screen}&state=normal`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
}

// ─── P1-B: saveColony farmId ────────────────────────────────────────────────

test('P1-B: saveColony 4th arg contains farmId when apiary is selected', async ({ page }) => {
  await goToScreen(page, 'colony-create')

  // Wait for apiary select to load
  await page.waitForSelector('select', { timeout: 5000 })

  // Fill in colony name
  const nameInput = page.locator('input[type="text"]').first()
  await nameInput.fill('テスト蜂群1')

  // Select the first farm option (id=1)
  const select = page.locator('select').first()
  await select.selectOption({ index: 1 })

  // Submit
  const submitBtn = page.locator('button[type="submit"], button:has-text("登録"), button:has-text("作成")').first()
  await submitBtn.click()
  await page.waitForTimeout(800)

  // Check saveColony was called with farmId
  const calls = await page.evaluate(() => (window as unknown as Record<string, unknown>).__getSaveColonyCalls?.())
  expect(Array.isArray(calls)).toBe(true)
  expect(calls.length).toBeGreaterThan(0)

  const lastCall = calls[calls.length - 1] as { opts?: { farmId?: string } }
  expect(lastCall.opts).toBeDefined()
  expect(lastCall.opts?.farmId).toBeTruthy()
})

test('P1-B: saveColony opts.farmId is a string (not null) for selected apiary', async ({ page }) => {
  await goToScreen(page, 'colony-create')

  await page.waitForSelector('select', { timeout: 5000 })
  const nameInput = page.locator('input[type="text"]').first()
  await nameInput.fill('テスト蜂群2')

  const select = page.locator('select').first()
  await select.selectOption({ index: 1 })

  const submitBtn = page.locator('button[type="submit"], button:has-text("登録"), button:has-text("作成")').first()
  await submitBtn.click()
  await page.waitForTimeout(800)

  const calls = await page.evaluate(() => (window as unknown as Record<string, unknown>).__getSaveColonyCalls?.())
  const lastCall = (calls as { opts?: { farmId?: unknown } }[])[0]
  // farmId must be a non-null string, not null or undefined
  expect(typeof lastCall?.opts?.farmId).toBe('string')
  expect(lastCall?.opts?.farmId).not.toBeNull()
})

// ─── P1-C: unknown status for uninspected colonies ──────────────────────────

function makeColonyListStub(colonies: unknown[], inspRecords: unknown[]): string {
  return `
(function() {
  window.HoneyDB = {
    getSession: async function() { return { user: { id: 'u1', email: 'test@example.com' } }; },
    onAuthStateChange: function(cb) { return function() {}; },
    getUserProfile:    async function() { return { name: 'テスト', farm_name: '' }; },
    getUserPreferences: async function() { return { theme: 'system', language: 'ja', default_inspection_mode: 'frame', onboarding_completed: true }; },
    getNotificationSettings: async function() { return null; },
    loadBenchmarkStats: async function() { return null; },
    loadFarms:   async function() { return [{ id: 1, name: '山田養蜂場' }]; },
    loadColonies: async function() { return ${JSON.stringify(colonies)}; },
    loadInspRecords: async function() { return ${JSON.stringify(inspRecords)}; },
    loadWorkRecords: async function() { return []; },
    loadTasks:   async function() { return []; },
    getTasks:    async function() { return []; },
    saveFarm:    async function() { return { id: 1 }; },
    archiveFarm: async function() {},
    deleteFarm:  async function() {},
    saveColony:  async function() {},
    archiveColony: async function() {},
    deleteColony: async function() {},
    saveTask:    async function() { return null; },
    updateTask:  async function() {},
    completeTask: async function() {},
    deleteTask:  async function() {},
    saveInspRecord: async function() { return null; },
    saveWorkRecord: async function() { return null; },
    updateWorkRecord: async function() {},
    deleteWorkRecord: async function() {},
    updateProfile: async function() {},
    updateUserPreferences: async function() {},
    updateNotificationSettings: async function() {},
    exportAllData: async function() { return { exportedAt: '', profile: null, inspRecords: [], workRecords: [], tasks: [] }; },
    subscribeRealtime: function() {},
    unsubscribeRealtime: function() {},
    upsertBenchmark: async function() {},
    savePushSubscription: async function() {},
    deletePushSubscription: async function() {},
    resetPassword: async function() { return { data: {}, error: null }; },
    initDefaultColonies: async function() {},
    signIn: async function() { return { error: null }; },
    signUp: async function() { return { error: null }; },
    signOut: async function() { return { error: null }; },
  };
})();
`
}

const uninspectedColony = { id: 'c1', name: 'テスト群', farmId: 1, sort_order: 0 }

test('P1-C: colony with no inspection shows 未評価 badge (not 危険)', async ({ page }) => {
  await page.addInitScript(makeColonyListStub([uninspectedColony], []))
  await page.goto('?tab=farms&state=normal', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  // Should show 未評価, never 危険 badge
  await expect(page.locator('text=未評価').first()).toBeVisible()
  const dangerBadge = page.locator('span').filter({ hasText: /^危険$/ })
  await expect(dangerBadge).toHaveCount(0)
})

test('P1-C: colony with no inspection has no danger (red) border', async ({ page }) => {
  await page.addInitScript(makeColonyListStub([uninspectedColony], []))
  await page.goto('?tab=farms&state=normal', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  // No colony card with danger CSS class
  const dangerCards = page.locator('button[class*="danger"]')
  await expect(dangerCards).toHaveCount(0)
})

test('P1-C: colony with valid inspection and low bee count shows 危険', async ({ page }) => {
  const colony = { id: 'c2', name: '危険群A', farmId: 1, sort_order: 0 }
  const inspRecord = {
    id: 'r1', colony: 'c2', date: '2026-10-01',
    frames: [{ bee: 10, brood: 5, honey: 5 }],  // bee < 25 → danger
  }
  await page.addInitScript(makeColonyListStub([colony], [inspRecord]))
  await page.goto('?tab=farms&state=normal', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  // Badge text 危険 should be visible
  const dangerBadge = page.locator('span').filter({ hasText: /^危険$/ })
  await expect(dangerBadge.first()).toBeVisible()
})

test('P1-C: no console errors on colony list with uninspected colonies', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await page.addInitScript(makeColonyListStub([uninspectedColony], []))
  await page.goto('?tab=farms&state=normal', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  const relevantErrors = consoleErrors.filter(e =>
    !e.includes('favicon') &&
    !e.includes('manifest') &&
    !e.includes('404') &&  // static asset 404s are outside our scope
    !e.includes('supabase')
  )
  expect(relevantErrors).toHaveLength(0)
})
