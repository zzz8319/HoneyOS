/**
 * SCR-012 default_inspection_mode 接続テスト
 * initialMode prop の挙動・フォールバックバナー・data-testid を確認する
 */
import { test, expect } from '@playwright/test'

test('SCR-012 default mode: initialMode=frame shows frame tab active', async ({ page }) => {
  await page.goto('/?screen=inspection-record&state=normal&initialMode=frame&devbar=0')
  await page.waitForLoadState('networkidle')

  const frameTab = page.getByTestId('mode-tab-frame')
  await expect(frameTab).toHaveAttribute('aria-selected', 'true')

  const ratioTab = page.getByTestId('mode-tab-ratio')
  await expect(ratioTab).toHaveAttribute('aria-selected', 'false')
})

test('SCR-012 default mode: no initialMode defaults to frame', async ({ page }) => {
  await page.goto('/?screen=inspection-record&state=normal&devbar=0')
  await page.waitForLoadState('networkidle')

  const frameTab = page.getByTestId('mode-tab-frame')
  await expect(frameTab).toHaveAttribute('aria-selected', 'true')
})

test('SCR-012 default mode: ratio-fallback hint is shown when initialMode=ratio', async ({ page }) => {
  // ratio is 準備中 (SUPPORTED_MODES = ['frame']), so fallback hint should appear
  await page.goto('/?screen=inspection-record&state=normal&initialMode=ratio&devbar=0')
  await page.waitForLoadState('networkidle')

  const hint = page.getByTestId('ratio-fallback-note')
  await expect(hint).toBeVisible()
})

test('SCR-012 default mode: frame hint shown when initialMode=frame', async ({ page }) => {
  await page.goto('/?screen=inspection-record&state=normal&initialMode=frame&devbar=0')
  await page.waitForLoadState('networkidle')

  const frameHint = page.getByTestId('mode-hint-frame')
  await expect(frameHint).toBeVisible()

  const fallbackHint = page.getByTestId('ratio-fallback-note')
  await expect(fallbackHint).not.toBeVisible()
})

test('SCR-012 default mode: ratio tab is disabled (準備中)', async ({ page }) => {
  await page.goto('/?screen=inspection-record&state=normal&initialMode=frame&devbar=0')
  await page.waitForLoadState('networkidle')

  // ratio tab should be disabled since it is 準備中
  const ratioTab = page.getByTestId('mode-tab-ratio')
  await expect(ratioTab).toBeDisabled()
})
