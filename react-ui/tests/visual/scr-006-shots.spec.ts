import { test, expect } from '@playwright/test'

const SCRATCHPAD = '/tmp/claude-0/-home-user-HoneyOS/1aa7a80d-0932-5402-b2d6-ab2baf4ef61a/scratchpad'

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
  test(`SCR-006 ${label}状態`, async ({ page }) => {
    await page.goto(`http://localhost:5173/`, { waitUntil: 'networkidle' })

    // 開発用ボタンで状態切り替え
    if (id !== 'normal') {
      await page.getByRole('button', { name: label }).click()
      await page.waitForTimeout(100)
    }

    // overflow 検証
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }))
    expect(overflow.scrollWidth).toBe(overflow.innerWidth)

    await page.screenshot({
      path: `${SCRATCHPAD}/scr006-${id}.png`,
      clip: { x: 0, y: 0, width: 390, height: 844 },
    })
  })
}

test('SCR-006 通常状態スクロール後', async ({ page }) => {
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await page.evaluate(() => window.scrollTo(0, 800))
  await page.waitForTimeout(100)
  await page.screenshot({
    path: `${SCRATCHPAD}/scr006-normal-scrolled.png`,
    clip: { x: 0, y: 0, width: 390, height: 844 },
  })
})
