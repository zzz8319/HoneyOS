/**
 * Verify that mock-specific strings do NOT appear in the production-normal state
 * for the 8 data screens (SCR-006/008/009/026/027/028/029/030).
 *
 * In production, window.HoneyDB is undefined during Playwright test runs
 * (no real Supabase connection).  Each screen should therefore show a loading
 * skeleton or an error state — never the hardcoded mock strings that used to
 * appear before the 5f21683 fix.
 *
 * Pattern mirrors the existing visual specs: dev-server at 5173, devbar buttons.
 */
import { test, expect } from '@playwright/test'

// ── helpers ────────────────────────────────────────────────────────────────

import type { Page } from '@playwright/test'

/** Navigate to a screen + state combo via the dev-server URL */
async function goTo(
  page: Page,
  screen: string,
  state: string,
) {
  await page.goto(`/?screen=${screen}&state=${state}&devbar=0`, {
    waitUntil: 'networkidle',
  })
}

/**
 * Strings that exist only in mock data files and must NEVER appear in the
 * "normal" production state when window.HoneyDB is undefined.
 */
const MOCK_ONLY_STRINGS = ['宮田養蜂場', '川東養蜂場']

// ── Dashboard (SCR-006) ────────────────────────────────────────────────────

test('SCR-006 normal: no mock farm name shown', async ({ page }) => {
  await goTo(page, 'home', 'normal')
  for (const str of MOCK_ONLY_STRINGS) {
    await expect(page.getByText(str, { exact: false })).not.toBeVisible()
  }
})

// ── Colony List / ColonySummary (SCR-008) ──────────────────────────────────

test('SCR-008 normal: no mock apiary name shown', async ({ page }) => {
  await goTo(page, 'farms', 'normal')
  for (const str of MOCK_ONLY_STRINGS) {
    await expect(page.getByText(str, { exact: false })).not.toBeVisible()
  }
})

// ── Colony Detail (SCR-009) ────────────────────────────────────────────────

test('SCR-009 normal: no mock colony/apiary name shown', async ({ page }) => {
  await goTo(page, 'colony-detail', 'normal')
  for (const str of MOCK_ONLY_STRINGS) {
    await expect(page.getByText(str, { exact: false })).not.toBeVisible()
  }
})

// ── Work Record (SCR-026) ──────────────────────────────────────────────────

test('SCR-026 normal-new: no mock colony name shown', async ({ page }) => {
  await goTo(page, 'work-record', 'normal-new')
  // MOCK_COLONIES apiary name used as group label in colony picker
  for (const str of MOCK_ONLY_STRINGS) {
    await expect(page.getByText(str, { exact: false })).not.toBeVisible()
  }
})

// ── Work History (SCR-027) ─────────────────────────────────────────────────

test('SCR-027 normal: no mock strings shown', async ({ page }) => {
  await goTo(page, 'work-history', 'normal')
  for (const str of MOCK_ONLY_STRINGS) {
    await expect(page.getByText(str, { exact: false })).not.toBeVisible()
  }
})

// ── Colony Trend (SCR-029) ─────────────────────────────────────────────────

test('SCR-029 normal: no mock colony/apiary name shown', async ({ page }) => {
  await goTo(page, 'colony-trend', 'normal')
  for (const str of MOCK_ONLY_STRINGS) {
    await expect(page.getByText(str, { exact: false })).not.toBeVisible()
  }
})

// ── Colony Comparison (SCR-030) ────────────────────────────────────────────

test('SCR-030 normal: no mock colony/apiary name shown', async ({ page }) => {
  await goTo(page, 'colony-comparison', 'normal')
  for (const str of MOCK_ONLY_STRINGS) {
    await expect(page.getByText(str, { exact: false })).not.toBeVisible()
  }
})

// ── Report (SCR-028) ───────────────────────────────────────────────────────

test('SCR-028 normal: no mock strings shown', async ({ page }) => {
  await goTo(page, 'report', 'normal')
  for (const str of MOCK_ONLY_STRINGS) {
    await expect(page.getByText(str, { exact: false })).not.toBeVisible()
  }
})
