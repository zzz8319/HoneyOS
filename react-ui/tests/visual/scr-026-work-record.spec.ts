import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173'

function url(state: string) {
  return `${BASE}/?screen=work-record&state=${state}&devbar=0`
}

test('SCR-026 normal-linked-top', async ({ page }) => {
  await page.goto(url('normal-linked-top'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-026-normal-linked-top.png')
})

test('SCR-026 normal-linked-bottom', async ({ page }) => {
  await page.goto(url('normal-linked-top'))
  await page.waitForLoadState('networkidle')
  await page.getByTestId('work-record-body').evaluate(el => { el.scrollTop = el.scrollHeight })
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('scr-026-normal-linked-bottom.png')
})

test('SCR-026 normal-new', async ({ page }) => {
  await page.goto(url('normal-new'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-026-normal-new.png')
})

test('SCR-026 validation-error', async ({ page }) => {
  await page.goto(url('validation-error'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-026-validation-error.png')
})

test('SCR-026 loading', async ({ page }) => {
  await page.goto(url('loading'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-026-loading.png')
})

test('SCR-026 context-missing', async ({ page }) => {
  await page.goto(url('context-missing'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-026-context-missing.png')
})

test('SCR-026 saving-draft', async ({ page }) => {
  await page.goto(url('saving-draft'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-026-saving-draft.png')
})

test('SCR-026 saving', async ({ page }) => {
  await page.goto(url('saving'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-026-saving.png')
})

test('SCR-026 save-error', async ({ page }) => {
  await page.goto(url('save-error'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-026-save-error.png')
})

test('SCR-026 offline', async ({ page }) => {
  await page.goto(url('offline'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-026-offline.png')
})

test('SCR-026 photo-added', async ({ page }) => {
  await page.goto(url('photo-added'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-026-photo-added.png')
})

test('SCR-026 photo-upload-error', async ({ page }) => {
  await page.goto(url('photo-upload-error'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-026-photo-upload-error.png')
})

test('SCR-026 camera-permission-denied', async ({ page }) => {
  await page.goto(url('camera-permission-denied'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-026-camera-permission-denied.png')
})

test('SCR-026 discard-confirm', async ({ page }) => {
  await page.goto(url('discard-confirm'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-026-discard-confirm.png')
})

test('SCR-026 colony-selector', async ({ page }) => {
  await page.goto(url('colony-selector'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-026-colony-selector.png')
})

test('SCR-026 date-picker', async ({ page }) => {
  await page.goto(url('date-picker'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-026-date-picker.png')
})

test('SCR-026 time-picker', async ({ page }) => {
  await page.goto(url('time-picker'))
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('scr-026-time-picker.png')
})
