import { test, expect } from '@playwright/test'

const SCREEN = 'colony-create'
const BASE_URL = `/?screen=${SCREEN}&devbar=0`
const FIXED_NOW = new Date('2026-09-23T10:00:00+09:00')

async function goto(page: import('@playwright/test').Page, extra = '') {
  await page.clock.install({ time: FIXED_NOW })
  await page.goto(`${BASE_URL}${extra}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
}

// ── 1. 通常（未入力）────────────────────────────────────────────────────────
test('SCR-032 normal', async ({ page }) => {
  await goto(page)
  await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: '蜂群を追加' })).toBeVisible()
  // No BottomNav
  await expect(page.getByRole('navigation', { name: 'メインナビゲーション' })).not.toBeVisible()
  await expect(page.getByText('基本情報だけで登録できます。')).toBeVisible()
  await expect(page.getByLabel('蜂群名')).toBeVisible()
  await expect(page.getByRole('combobox', { name: '所属養蜂場' })).toBeVisible()
  await expect(page.getByText('内検未実施')).toBeVisible()
  await expect(page).toHaveScreenshot('scr-032-normal.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 2. 入力済み（A-07 / 宮田養蜂場）────────────────────────────────────────
test('SCR-032 filled', async ({ page }) => {
  await goto(page)
  await page.getByLabel('蜂群名').fill('A-07')
  await page.waitForTimeout(100)
  // Select 宮田養蜂場
  const apiary = page.getByRole('combobox', { name: '所属養蜂場' })
  await apiary.selectOption({ label: '宮田養蜂場' })
  await page.waitForTimeout(100)
  // Preview reflects name
  await expect(page.getByText('A-07').first()).toBeVisible()
  await expect(page).toHaveScreenshot('scr-032-filled.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 3. バリデーションエラー ──────────────────────────────────────────────────
test('SCR-032 validation-error', async ({ page }) => {
  await goto(page)
  // Submit without filling anything
  await page.getByRole('button', { name: '蜂群を登録' }).click()
  await page.waitForTimeout(100)
  await expect(page.getByText('蜂群名を入力してください')).toBeVisible()
  await expect(page).toHaveScreenshot('scr-032-validation-error.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 4. プレビュー同期 ────────────────────────────────────────────────────────
test('SCR-032 preview-sync', async ({ page }) => {
  await goto(page)
  await page.getByLabel('蜂群名').fill('B-05')
  await page.waitForTimeout(100)
  // Preview should show B-05
  const previewCard = page.getByLabel('登録後の表示プレビュー')
  await expect(previewCard.getByText('B-05')).toBeVisible()
  await expect(page).toHaveScreenshot('scr-032-preview-sync.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 5. 登録中 ────────────────────────────────────────────────────────────────
test('SCR-032 submitting', async ({ page }) => {
  await goto(page, '&state=submitting')
  await page.waitForTimeout(200)
  // Submit button should be disabled/loading
  const submitBtn = page.getByRole('button', { name: '蜂群を登録' })
  await expect(submitBtn).toBeDisabled()
  await expect(page).toHaveScreenshot('scr-032-submitting.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 6. 登録エラー ────────────────────────────────────────────────────────────
test('SCR-032 error', async ({ page }) => {
  await goto(page, '&state=submit-error')
  await page.waitForTimeout(200)
  await expect(page.getByText('蜂群を登録できませんでした。もう一度お試しください。')).toBeVisible()
  await expect(page).toHaveScreenshot('scr-032-error.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 7. オフライン ────────────────────────────────────────────────────────────
test('SCR-032 offline', async ({ page }) => {
  await goto(page, '&state=offline')
  await page.waitForTimeout(200)
  await expect(page.getByText('オフラインのため蜂群を登録できません')).toBeVisible()
  const submitBtn = page.getByRole('button', { name: '蜂群を登録' })
  await expect(submitBtn).toBeDisabled()
  await expect(page).toHaveScreenshot('scr-032-offline.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 8. 養蜂場なし ────────────────────────────────────────────────────────────
test('SCR-032 no-apiary', async ({ page }) => {
  await goto(page, '&state=no-apiary')
  await page.waitForTimeout(200)
  await expect(page.getByText('新しい養蜂場を追加')).toBeVisible()
  const submitBtn = page.getByRole('button', { name: '蜂群を登録' })
  await expect(submitBtn).toBeDisabled()
  await expect(page).toHaveScreenshot('scr-032-no-apiary.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 9. 養蜂場読み込みエラー ──────────────────────────────────────────────────
test('SCR-032 apiary-load-error', async ({ page }) => {
  await goto(page, '&state=apiary-load-error')
  await page.waitForTimeout(200)
  await expect(page.getByText('養蜂場の読み込みに失敗しました。')).toBeVisible()
  await expect(page.getByRole('button', { name: '再試行' })).toBeVisible()
  await expect(page).toHaveScreenshot('scr-032-apiary-load-error.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 10. 蜂群一覧からの遷移 ────────────────────────────────────────────────────
test('SCR-032 from-colony-list', async ({ page }) => {
  await page.clock.install({ time: FIXED_NOW })
  // Start on colony list (farms tab)
  await page.goto('/?tab=farms&devbar=0', { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
  // Click add colony button
  await page.getByRole('button', { name: '蜂群を追加' }).click()
  await page.waitForTimeout(300)
  await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: '蜂群を追加' })).toBeVisible()
  await expect(page).toHaveScreenshot('scr-032-from-colony-list.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 11. 蜂群トレンドからの遷移 ───────────────────────────────────────────────
test('SCR-032 from-colony-trend', async ({ page }) => {
  await page.clock.install({ time: FIXED_NOW })
  await page.goto('/?screen=colony-trend&devbar=0', { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
  await page.getByRole('button', { name: '新しい蜂群を追加' }).click()
  await page.waitForTimeout(300)
  await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: '蜂群を追加' })).toBeVisible()
  await expect(page).toHaveScreenshot('scr-032-from-colony-trend.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 12. 通常画面下部 ─────────────────────────────────────────────────────────
test('SCR-032 normal-bottom', async ({ page }) => {
  await goto(page)
  // Scroll to bottom hint
  await page.getByText('登録後に最初の内検を始められます。').scrollIntoViewIfNeeded()
  await page.waitForTimeout(100)
  await expect(page.getByText('登録後に最初の内検を始められます。')).toBeVisible()
  await expect(page).toHaveScreenshot('scr-032-normal-bottom.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── Functional: no BottomNav ──────────────────────────────────────────────────
test('SCR-032 has no BottomNav', async ({ page }) => {
  await goto(page)
  await expect(page.getByRole('navigation', { name: 'メインナビゲーション' })).not.toBeVisible()
})

// ── Functional: back navigation ───────────────────────────────────────────────
test('SCR-032 back button returns to previous screen', async ({ page }) => {
  await page.clock.install({ time: FIXED_NOW })
  await page.goto('/?tab=farms&devbar=0', { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
  await page.getByRole('button', { name: '蜂群を追加' }).click()
  await page.waitForTimeout(300)
  await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: '蜂群を追加' })).toBeVisible()
  await page.getByRole('button', { name: '戻る' }).click()
  await page.waitForTimeout(200)
  // Should be back on colony list
  await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: '蜂群一覧' })).toBeVisible()
})

// ── Functional: cancel button ────────────────────────────────────────────────
test('SCR-032 cancel button returns to previous screen', async ({ page }) => {
  await page.clock.install({ time: FIXED_NOW })
  await page.goto('/?tab=farms&devbar=0', { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
  await page.getByRole('button', { name: '蜂群を追加' }).click()
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: 'キャンセル' }).click()
  await page.waitForTimeout(200)
  await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: '蜂群一覧' })).toBeVisible()
})

// ── Functional: no horizontal scroll ─────────────────────────────────────────
test('SCR-032 no horizontal scroll', async ({ page }) => {
  await goto(page)
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
})
