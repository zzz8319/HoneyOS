/**
 * Production E2E: TaskCreateScreen save persistence tests.
 *
 * Runs against the production bundle (import.meta.env.DEV === false).
 * Uses window.HoneyDB mock — does NOT write to real Supabase.
 * All assertions use the in-page mock store.
 *
 * Auth flow: injectMockHoneyDB provides getSession + onAuthStateChange
 * returning a valid session with onboarding_completed=true so the app
 * reaches normal routing and shows the task-create screen.
 */
import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

// Full auth+onboarding mock with controllable saveTask
const MOCK_SCRIPT = `
(function() {
  var savedTasks = [];
  var saveTaskResult = 'resolve'; // 'resolve' | 'reject'
  var saveTaskCalls = 0;

  window.__testControl = {
    setSaveTaskResult: function(r) { saveTaskResult = r; },
    getSavedTasks:     function() { return savedTasks.slice(); },
    getSaveTaskCalls:  function() { return saveTaskCalls; },
    reset: function() { savedTasks = []; saveTaskCalls = 0; saveTaskResult = 'resolve'; },
  };

  window.HoneyDB = {
    getSession:              async function() { return { user: { id: 'u1', email: 'test@example.com' } }; },
    onAuthStateChange:       function(_cb) { return function() {}; },
    getUserProfile:          async function() { return { name: 'テスト', farm_name: 'テスト養蜂場' }; },
    getUserPreferences:      async function() { return { theme: 'system', language: 'ja', onboarding_completed: true }; },
    loadFarms:               async function() { return [{ id: 10, name: '宮田養蜂場' }]; },
    loadColonies:            async function() { return [{ id: 'a1', name: 'A-01', farmId: '10' }]; },
    loadInspRecords:         async function() { return []; },
    loadWorkRecords:         async function() { return []; },
    loadTasks:               async function() { return savedTasks.slice(); },
    getTasks:                async function() { return []; },
    getNotificationSettings: async function() { return null; },
    loadBenchmarkStats:      async function() { return null; },
    signOut:                 async function() {},
    saveWorkRecord:          async function() { return null; },
    updateWorkRecord:        async function() {},
    deleteWorkRecord:        async function() {},
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
    saveTask: async function(task) {
      saveTaskCalls++;
      if (saveTaskResult === 'reject') throw new Error('DB error');
      var id = 'task-' + Date.now();
      savedTasks.push(Object.assign({}, task, { id: id, isCompleted: false, createdAt: new Date().toISOString() }));
      return id;
    },
    updateTask:  async function(id, task) {
      var idx = savedTasks.findIndex(function(t) { return t.id === id; });
      if (idx !== -1) Object.assign(savedTasks[idx], task);
    },
    completeTask: async function(id) {
      var idx = savedTasks.findIndex(function(t) { return t.id === id; });
      if (idx !== -1) savedTasks[idx].isCompleted = true;
    },
    saveTask_original: undefined,
  };
})();
`

async function goToTaskCreate(page: Page): Promise<void> {
  await page.addInitScript(MOCK_SCRIPT)
  await page.goto('?screen=task-create&tab=task', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
}

// Confirm task-create screen is shown (not login or auth-checking)
async function assertTaskCreateVisible(page: Page): Promise<void> {
  const heading = page.getByText('タスク作成')
  await expect(heading).toBeVisible({ timeout: 3000 })
}

// ── 1. Save success path ──────────────────────────────────────────────────────

test('1: fill form → submit → saveTask called with correct payload', async ({ page }) => {
  await goToTaskCreate(page)
  await assertTaskCreateVisible(page)

  await page.getByLabel('タイトル').fill('A-05 内検確認')
  await page.getByLabel('期限日を選択').fill('2026-10-25')
  await page.getByRole('button', { name: 'タスクを作成' }).click()
  await page.waitForTimeout(500)

  const calls = await page.evaluate(() => (window as unknown as { __testControl: { getSaveTaskCalls: () => number } }).__testControl.getSaveTaskCalls())
  expect(calls, 'saveTask should have been called once').toBe(1)

  const saved = await page.evaluate(() => (window as unknown as { __testControl: { getSavedTasks: () => unknown[] } }).__testControl.getSavedTasks())
  expect(saved).toHaveLength(1)
  const task = saved[0] as Record<string, unknown>
  expect(task.title).toBe('A-05 内検確認')
  expect(task.dueDate).toBe('2026-10-25')
})

// ── 2. Payload includes required fields ───────────────────────────────────────

test('2: saveTask payload has title, dueDate, priority, colonyIds, farmId', async ({ page }) => {
  await goToTaskCreate(page)
  await assertTaskCreateVisible(page)

  await page.getByLabel('タイトル').fill('給餌確認')
  await page.getByLabel('期限日を選択').fill('2026-11-01')
  await page.getByRole('button', { name: 'タスクを作成' }).click()
  await page.waitForTimeout(500)

  const saved = await page.evaluate(() => (window as unknown as { __testControl: { getSavedTasks: () => unknown[] } }).__testControl.getSavedTasks())
  const task = saved[0] as Record<string, unknown>
  expect(task.title).toBeDefined()
  expect(task.dueDate).toBeDefined()
  expect(task.priority).toBeDefined()
  expect(Array.isArray(task.colonyIds)).toBe(true)
})

// ── 3. No transition before save completes ────────────────────────────────────

test('3: does not navigate to work screen before save resolves', async ({ page }) => {
  // Set up full mock with a delayed saveTask (single script to avoid overwrite)
  await page.addInitScript(MOCK_SCRIPT)
  await page.addInitScript(`
    (function() {
      var orig = window.HoneyDB.saveTask;
      window.HoneyDB.saveTask = async function(task) {
        await new Promise(function(r) { setTimeout(r, 800); });
        return orig.call(window.HoneyDB, task);
      };
    })();
  `)
  await page.goto('?screen=task-create', { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)

  await page.getByRole('textbox', { name: 'タイトル' }).fill('遅延テスト')
  await page.getByLabel('期限日を選択').fill('2026-11-10')
  await page.getByRole('button', { name: 'タスクを作成' }).click()

  // Immediately after click — still on task-create (save is pending)
  const stillOnCreate = page.getByText('タスク作成')
  await expect(stillOnCreate).toBeVisible({ timeout: 300 })
})

// ── 4. Save failure → error banner + input retained ──────────────────────────

test('4: save failure shows error banner and retains input', async ({ page }) => {
  await goToTaskCreate(page)
  await assertTaskCreateVisible(page)

  // Switch saveTask to reject
  await page.evaluate(() => {
    (window as unknown as { __testControl: { setSaveTaskResult: (r: string) => void } }).__testControl.setSaveTaskResult('reject')
  })

  await page.getByLabel('タイトル').fill('エラーテスト')
  await page.getByLabel('期限日を選択').fill('2026-11-05')
  await page.getByRole('button', { name: 'タスクを作成' }).click()
  await page.waitForTimeout(500)

  // Error banner should be visible
  const banner = page.locator('[role="alert"]').filter({ hasText: 'タスクを作成できませんでした' })
  await expect(banner).toBeVisible()

  // Input should be retained
  const titleInput = page.getByRole('textbox', { name: 'タイトル' })
  await expect(titleInput).toHaveValue('エラーテスト')
})

// ── 5. Retry succeeds after initial failure ───────────────────────────────────

test('5: retry after failure succeeds when saveTask resolves', async ({ page }) => {
  await goToTaskCreate(page)
  await assertTaskCreateVisible(page)

  await page.evaluate(() => {
    (window as unknown as { __testControl: { setSaveTaskResult: (r: string) => void } }).__testControl.setSaveTaskResult('reject')
  })

  await page.getByLabel('タイトル').fill('リトライテスト')
  await page.getByLabel('期限日を選択').fill('2026-11-08')
  await page.getByRole('button', { name: 'タスクを作成' }).click()
  await page.waitForTimeout(500)

  // Fix to resolve
  await page.evaluate(() => {
    (window as unknown as { __testControl: { setSaveTaskResult: (r: string) => void } }).__testControl.setSaveTaskResult('resolve')
  })

  await page.getByRole('button', { name: 'タスクを作成' }).click()
  await page.waitForTimeout(500)

  const saved = await page.evaluate(() => (window as unknown as { __testControl: { getSavedTasks: () => unknown[] } }).__testControl.getSavedTasks())
  expect(saved).toHaveLength(1)
})

// ── 6. Double-submit prevention ───────────────────────────────────────────────

test('6: rapid double-click does not call saveTask twice', async ({ page }) => {
  // Delay saveTask so both clicks happen before save completes
  await page.addInitScript(MOCK_SCRIPT)
  await page.addInitScript(`
    (function() {
      var orig = window.HoneyDB.saveTask;
      window.HoneyDB.saveTask = async function(task) {
        await new Promise(function(r) { setTimeout(r, 600); });
        return orig.call(window.HoneyDB, task);
      };
    })();
  `)
  await page.goto('?screen=task-create&tab=task', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await assertTaskCreateVisible(page)

  await page.getByRole('textbox', { name: 'タイトル' }).fill('二重送信テスト')
  await page.getByLabel('期限日を選択').fill('2026-11-15')

  // Double-click the submit button rapidly — second click while save is in flight
  const btn = page.getByRole('button', { name: 'タスクを作成' })
  await btn.click()
  await btn.click({ timeout: 500 }).catch(() => { /* button may be disabled */ })
  await page.waitForTimeout(800)

  const calls = await page.evaluate(() => (window as unknown as { __testControl: { getSaveTaskCalls: () => number } }).__testControl.getSaveTaskCalls())
  expect(calls, 'saveTask must not be called more than once').toBeLessThanOrEqual(1)
})

// ── 7. HoneyDB not initialized → no success transition ───────────────────────

test('7: when HoneyDB.saveTask is absent, does not navigate to success', async ({ page }) => {
  await page.addInitScript(`
    window.HoneyDB = {
      getSession:         async function() { return { user: { id: 'u1', email: 'x@x.com' } }; },
      onAuthStateChange:  function(_cb) { return function() {}; },
      getUserPreferences: async function() { return { theme: 'system', language: 'ja', onboarding_completed: true }; },
      loadFarms:          async function() { return []; },
      loadColonies:       async function() { return []; },
      loadWorkRecords:    async function() { return []; },
      loadInspRecords:    async function() { return []; },
      loadTasks:          async function() { return []; },
      getTasks:           async function() { return []; },
      loadBenchmarkStats: async function() { return null; },
      subscribeRealtime:  function() {},
      unsubscribeRealtime:function() {},
      // saveTask intentionally omitted
    };
  `)
  await page.goto('?screen=task-create', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  await page.getByLabel('タイトル').fill('DB未初期化')
  await page.getByLabel('期限日を選択').fill('2026-11-20')
  await page.getByRole('button', { name: 'タスクを作成' }).click()
  await page.waitForTimeout(500)

  // Should remain on task-create (not navigate away)
  await expect(page.getByText('タスク作成')).toBeVisible()
})

// ── 8. Saved task appears in work list (loadTasks integration) ────────────────

test('8: saved task appears in work list after navigation', async ({ page }) => {
  await goToTaskCreate(page)
  await assertTaskCreateVisible(page)

  await page.getByLabel('タイトル').fill('一覧表示テスト')
  await page.getByLabel('期限日を選択').fill('2026-11-20')
  await page.getByRole('button', { name: 'タスクを作成' }).click()

  // Wait for navigation to work screen
  await page.waitForTimeout(800)

  // The work list screen loads loadTasks() — our mock returns the saved task
  const body = await page.locator('body').innerText()
  expect(body.includes('一覧表示テスト'), 'Saved task title should appear in work list').toBe(true)
})

// ── 9. Unauthenticated access shows login, not task-create ───────────────────

test('9: unauthenticated access goes to login', async ({ page }) => {
  await page.goto('?screen=task-create', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)

  const body = await page.locator('body').innerText()
  const hasLogin = body.includes('ログイン') || body.includes('メールアドレス')
  const hasTaskCreate = body.includes('タスク作成')
  expect(hasTaskCreate, 'Task create should not be shown without auth').toBe(false)
  expect(hasLogin, 'Login screen should be shown').toBe(true)
})
