import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173'

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
