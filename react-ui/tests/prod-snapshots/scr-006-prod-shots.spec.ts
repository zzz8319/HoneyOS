import { test, expect } from '@playwright/test'

const SCRATCHPAD = '/tmp/claude-0/-home-user-HoneyOS/1aa7a80d-0932-5402-b2d6-ab2baf4ef61a/scratchpad'
const BASE = 'http://localhost:5174'

const STATES = [
  { id: 'normal',  label: '通常' },
  { id: 'loading', label: '読込' },
  { id: 'empty',   label: '空' },
  { id: 'error',   label: 'エラー' },
  { id: 'offline', label: 'オフライン' },
] as const

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
})

for (const { id, label } of STATES) {
  test(`prod SCR-006 ${label}状態`, async ({ page }) => {
    await page.goto(`${BASE}/?state=${id}`, { waitUntil: 'networkidle' })

    // devbar が存在しないことを確認
    const devBar = await page.$('[role="toolbar"]')
    expect(devBar).toBeNull()

    // overflow 検証
    const sw = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(sw).toBe(390)

    await page.screenshot({
      path: `${SCRATCHPAD}/prod-${id}.png`,
      clip: { x: 0, y: 0, width: 390, height: 844 },
    })
  })
}

test('prod SCR-006 通常スクロール後', async ({ page }) => {
  await page.goto(`${BASE}/?state=normal`, { waitUntil: 'networkidle' })
  await page.evaluate(() => window.scrollTo(0, 800))
  await page.waitForTimeout(80)
  await page.screenshot({
    path: `${SCRATCHPAD}/prod-normal-scrolled.png`,
    clip: { x: 0, y: 0, width: 390, height: 844 },
  })
})
