import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5175'

// ── SCR-009 → SCR-013 (内検履歴を見る) ──────────────────────────────────
test('SCR-009 → SCR-013: 内検履歴を見る opens frame-viewer', async ({ page }) => {
  await page.goto(`${BASE}/?screen=colony-detail&devbar=0`)
  await page.waitForLoadState('networkidle')
  const historyBtn = page.getByText('内検履歴を見る ›')
  await expect(historyBtn).toBeVisible()
  await historyBtn.click()
  await expect(page.locator('h1')).toContainText('枠ビューア')
})

// ── SCR-009 → SCR-027 (作業記録) ─────────────────────────────────────────
test('SCR-009 → SCR-027: 作業記録 opens work-history', async ({ page }) => {
  await page.goto(`${BASE}/?screen=colony-detail&devbar=0`)
  await page.waitForLoadState('networkidle')
  const workBtn = page.locator('[data-testid="quick-links"]').getByText('作業記録')
  await expect(workBtn).toBeVisible()
  await workBtn.click()
  await expect(page.locator('h1')).toHaveText('作業履歴')
})

// ── SCR-009 → SCR-021 (カメラ画像) ───────────────────────────────────────
test('SCR-009 → SCR-021: カメラ画像 opens camera-images', async ({ page }) => {
  await page.goto(`${BASE}/?screen=colony-detail&devbar=0`)
  await page.waitForLoadState('networkidle')
  const camBtn = page.locator('[data-testid="quick-links"]').getByText('カメラ画像')
  await expect(camBtn).toBeVisible()
  await camBtn.click()
  // camera-images screen has no h1; check header text
  await expect(page.getByText('カメラ画像').first()).toBeVisible()
  // Confirm we are no longer on colony-detail (back button exists)
  const backBtn = page.locator('button[aria-label="戻る"]')
  await expect(backBtn).toBeVisible()
})

// ── SCR-009 → SCR-022 (AI診断) ───────────────────────────────────────────
test('SCR-009 → SCR-022: AI診断 opens ai-diagnosis', async ({ page }) => {
  await page.goto(`${BASE}/?screen=colony-detail&devbar=0`)
  await page.waitForLoadState('networkidle')
  const aiBtn = page.locator('[data-testid="quick-links"]').getByText('AI診断')
  await expect(aiBtn).toBeVisible()
  await aiBtn.click()
  await expect(page.getByText('AI診断結果').first()).toBeVisible()
})

// ── SCR-015 → SCR-026 (作業記録を追加) ───────────────────────────────────
test('SCR-015 → SCR-026: 作業記録を追加 opens work-record', async ({ page }) => {
  await page.goto(`${BASE}/?screen=inspection-complete&devbar=0`)
  await page.waitForLoadState('networkidle')
  const addNoteBtn = page.getByText('作業記録を追加')
  await expect(addNoteBtn).toBeVisible()
  await addNoteBtn.click()
  // work-record screen: check for distinguishing text
  await expect(page.getByText('作業記録').first()).toBeVisible()
  const backBtn = page.locator('button[aria-label="戻る"]')
  await expect(backBtn).toBeVisible()
})

// ── SCR-015 → SCR-014 (AI解析を行う) ─────────────────────────────────────
test('SCR-015 → SCR-014: AI解析を行う opens ai-analysis', async ({ page }) => {
  await page.goto(`${BASE}/?screen=inspection-complete&devbar=0`)
  await page.waitForLoadState('networkidle')
  const aiBtn = page.getByText('AI解析を行う')
  await expect(aiBtn).toBeVisible()
  await aiBtn.click()
  await expect(page.getByText('AI解析').first()).toBeVisible()
  const backBtn = page.locator('button[aria-label="戻る"]')
  await expect(backBtn).toBeVisible()
})

// ── SCR-023 → SCR-025 (タスクに追加) ─────────────────────────────────────
test('SCR-023 → SCR-025: タスクに追加 opens task-create', async ({ page }) => {
  await page.goto(`${BASE}/?screen=recommended-work&devbar=0`)
  await page.waitForLoadState('networkidle')
  const taskBtn = page.getByText('タスクに追加').first()
  await expect(taskBtn).toBeVisible()
  await taskBtn.click()
  await expect(page.getByText('タスク作成').first()).toBeVisible()
})

// ── SCR-023 → SCR-026 (作業記録を残す) ───────────────────────────────────
test('SCR-023 → SCR-026: 作業記録を残す opens work-record', async ({ page }) => {
  await page.goto(`${BASE}/?screen=recommended-work&devbar=0`)
  await page.waitForLoadState('networkidle')
  const recBtn = page.getByText('作業記録を残す').first()
  await expect(recBtn).toBeVisible()
  await recBtn.click()
  await expect(page.getByText('作業記録').first()).toBeVisible()
  const backBtn = page.locator('button[aria-label="戻る"]')
  await expect(backBtn).toBeVisible()
})

// ── SCR-027 → SCR-026 (記録行タップ) ─────────────────────────────────────
test('SCR-027 → SCR-026: record row tap opens work-record', async ({ page }) => {
  await page.goto(`${BASE}/?screen=work-history&devbar=0`)
  await page.waitForLoadState('networkidle')
  const row = page.locator('[class*="recordRow"]').first()
  if (await row.isVisible()) {
    await row.click()
    await expect(page.getByText('作業記録').first()).toBeVisible()
    const backBtn = page.locator('button[aria-label="戻る"]')
    await expect(backBtn).toBeVisible()
  }
})

// ── SCR-027 → SCR-028 (詳しく分析する) ───────────────────────────────────
test('SCR-027 → SCR-028: 詳しく分析する opens report', async ({ page }) => {
  await page.goto(`${BASE}/?screen=work-history&devbar=0`)
  await page.waitForLoadState('networkidle')
  const analyzeBtn = page.locator('button[aria-label="詳しく分析する"]')
  await expect(analyzeBtn).toBeVisible()
  await analyzeBtn.click()
  await expect(page.locator('h1')).toHaveText('レポート')
})

// ── SCR-028 → SCR-027 (作業履歴を見る) ───────────────────────────────────
test('SCR-028 → SCR-027: 作業履歴を見る opens work-history', async ({ page }) => {
  await page.goto(`${BASE}/?screen=report&devbar=0`)
  await page.waitForLoadState('networkidle')
  const histBtn = page.getByText('履歴を見る ›')
  await expect(histBtn).toBeVisible()
  await histBtn.click()
  await expect(page.locator('h1')).toHaveText('作業履歴')
})

// ── BottomNav work tab → SCR-024 ─────────────────────────────────────────
test('BottomNav work tab navigates to SCR-024', async ({ page }) => {
  await page.goto(`${BASE}/?screen=home&devbar=0`)
  await page.waitForLoadState('networkidle')
  const workTab = page.locator('nav[aria-label="メインナビゲーション"] button').filter({ hasText: '作業' })
  await expect(workTab).toBeVisible()
  await workTab.click()
  // WorkListScreen has no h1; check for nav still visible and work tab active
  await expect(workTab).toHaveAttribute('aria-current', 'page')
  // The screen should render work content, not DashboardScreen empty state
  const emptyDash = page.getByText('このタブは未実装です')
  await expect(emptyDash).not.toBeVisible()
})

// ── BottomNav analytics tab → SCR-028 ────────────────────────────────────
test('BottomNav analytics tab navigates to SCR-028', async ({ page }) => {
  await page.goto(`${BASE}/?screen=home&devbar=0`)
  await page.waitForLoadState('networkidle')
  const analyticsTab = page.locator('nav[aria-label="メインナビゲーション"] button').filter({ hasText: '分析' })
  await expect(analyticsTab).toBeVisible()
  await analyticsTab.click()
  await expect(page.locator('h1')).toHaveText('レポート')
})
