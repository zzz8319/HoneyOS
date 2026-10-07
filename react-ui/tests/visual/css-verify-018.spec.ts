import { test, expect } from '@playwright/test'

const BASE = '/?screen=sensor-graph&devbar=0&state=normal-day'

test('SCR-018 CSS computed style verification', async ({ page }) => {
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')

  // 1. Font is sans-serif
  const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily)
  console.log('body font:', bodyFont)
  expect(bodyFont).not.toMatch(/^serif|Times|Georgia/i)

  // 2. Kind button has border and border-radius
  const kindBtn = await page.evaluate(() => {
    const btn = document.querySelector('[aria-haspopup="listbox"]') as HTMLElement | null
    if (!btn) return null
    const cs = getComputedStyle(btn)
    return { borderRadius: cs.borderRadius, borderStyle: cs.borderStyle }
  })
  console.log('kindBtn:', kindBtn)
  expect(kindBtn).not.toBeNull()
  expect(kindBtn!.borderRadius).not.toBe('0px')
  expect(kindBtn!.borderStyle).toBe('solid')

  // 3. Active period tab has non-transparent amber background
  const activeBg = await page.evaluate(() => {
    const btn = document.querySelector('[aria-pressed="true"]') as HTMLElement | null
    if (!btn) return null
    return getComputedStyle(btn).backgroundColor
  })
  console.log('active period bg:', activeBg)
  expect(activeBg).not.toBeNull()
  expect(activeBg).not.toBe('rgba(0, 0, 0, 0)')
  expect(activeBg).not.toBe('transparent')

  // 4. Graph card = white bg + border-radius + padding
  const card = await page.evaluate(() => {
    const el = document.querySelector('[aria-label="センサーグラフ"]') as HTMLElement | null
    if (!el) return null
    const cs = getComputedStyle(el)
    return { bg: cs.backgroundColor, radius: cs.borderRadius, padTop: cs.paddingTop }
  })
  console.log('card:', card)
  expect(card).not.toBeNull()
  expect(card!.bg).toBe('rgb(255, 255, 255)')
  expect(card!.radius).not.toBe('0px')
  expect(parseFloat(card!.padTop)).toBeGreaterThan(0)

  // 5. h1 title font-size ≤ 18px
  const titlePx = await page.evaluate(() => {
    const h1 = document.querySelector('h1')
    return h1 ? parseFloat(getComputedStyle(h1).fontSize) : null
  })
  console.log('h1 fontSize:', titlePx)
  expect(titlePx).not.toBeNull()
  expect(titlePx!).toBeLessThanOrEqual(18)

  // 6. No horizontal scroll
  const scrollW = await page.evaluate(() => document.documentElement.scrollWidth)
  console.log('scrollWidth:', scrollW)
  expect(scrollW).toBeLessThanOrEqual(390)

  // 7. SVG chart is visible
  await expect(page.locator('svg').first()).toBeVisible()
})
