import { test, expect } from '@playwright/test'

const STATES = [
  { state: 'normal',       label: '通常（宮田養蜂場選択）' },
  { state: 'other-apiary', label: '別養蜂場選択' },
  { state: 'nectar',       label: '蜜源表示' },
  { state: 'alert',        label: '要注意表示' },
  { state: 'no-results',   label: '検索結果なし' },
  { state: 'loading',      label: '読込中' },
  { state: 'error',        label: 'エラー' },
  { state: 'offline',      label: 'オフライン' },
  { state: 'no-location',  label: '位置情報利用不可' },
]

for (const { state, label } of STATES) {
  test(`SCR-010 ${label}`, async ({ page }) => {
    await page.goto(`/?screen=apiary-map&state=${state}&devbar=0`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(300)
    await page.evaluate(() => { document.documentElement.scrollTop = 0 })
    await expect(page).toHaveScreenshot(`scr-010-${state}.png`, {
      maxDiffPixelRatio: 0.02,
    })
  })
}
