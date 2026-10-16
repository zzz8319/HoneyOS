import { test, expect } from '@playwright/test'
import { injectMockHoneyDB } from './helpers/mockHoneyDB'

const BASE = ''

// Match old 7-colony/2-apiary MOCK_COLONIES baseline. B-01 is placed in
// 田中養蜂場 (f2) so the colony picker shows the same two apiary groups as
// the original fixture (宮田養蜂場 ×5, 田中養蜂場 ×2).
const COLONY_OVERRIDE = `
window.HoneyDB.loadFarms = async () => [
  { id: 'f1', name: '宮田養蜂場' },
  { id: 'f2', name: '田中養蜂場' },
];
window.HoneyDB.loadColonies = async () => [
  { id: 'a1', name: 'A-01', farmId: 'f1' },
  { id: 'a2', name: 'A-02', farmId: 'f1' },
  { id: 'a3', name: 'A-03', farmId: 'f1' },
  { id: 'a4', name: 'A-04', farmId: 'f1' },
  { id: 'a5', name: 'A-05', farmId: 'f1' },
  { id: 'b1', name: 'B-01', farmId: 'f2' },
  { id: 'b2', name: 'B-02', farmId: 'f2' },
];
`

test.beforeEach(async ({ page }) => {
  await injectMockHoneyDB(page, COLONY_OVERRIDE)
})

function url(state: string) {
  return `${BASE}/?screen=task-create&state=${state}&devbar=0`
}

test('SCR-025 normal-ai', async ({ page }) => {
  await page.goto(url('normal-ai'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-025-normal-ai.png')
})

test('SCR-025 normal-manual', async ({ page }) => {
  await page.goto(url('normal-manual'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-025-normal-manual.png')
})

test('SCR-025 validation-error', async ({ page }) => {
  await page.goto(url('validation-error'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-025-validation-error.png')
})

test('SCR-025 submitting', async ({ page }) => {
  await page.goto(url('submitting'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-025-submitting.png')
})

test('SCR-025 submit-error', async ({ page }) => {
  await page.goto(url('submit-error'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-025-submit-error.png')
})

test('SCR-025 offline', async ({ page }) => {
  await page.goto(url('offline'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-025-offline.png')
})

test('SCR-025 context-missing', async ({ page }) => {
  await page.goto(url('context-missing'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-025-context-missing.png')
})

test('SCR-025 loading', async ({ page }) => {
  await page.goto(url('loading'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-025-loading.png')
})

test('SCR-025 colony-picker', async ({ page }) => {
  await page.goto(url('colony-picker'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-025-colony-picker.png')
})

test('SCR-025 date-picker', async ({ page }) => {
  await page.goto(url('date-picker'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-025-date-picker.png')
})

test('SCR-025 discard-dialog', async ({ page }) => {
  await page.goto(url('discard-dialog'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-025-discard-dialog.png')
})
