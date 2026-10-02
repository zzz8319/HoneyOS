import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173/?screen=notification-center&devbar=0'

test('card position metrics - normal', async ({ page }) => {
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')

  const card = page.locator('button[class*="notifCard"]').first()
  const box = await card.boundingBox()
  console.log('Normal card box:', JSON.stringify(box))

  expect(box!.x).toBeGreaterThanOrEqual(12)
  expect(box!.x).toBeLessThanOrEqual(20)
  const rightGap = 390 - (box!.x + box!.width)
  expect(rightGap).toBeGreaterThanOrEqual(12)
  expect(rightGap).toBeLessThanOrEqual(20)
  console.log('Right gap:', rightGap)

  const br = await card.evaluate(el => parseFloat(getComputedStyle(el).borderRadius))
  expect(br).toBeGreaterThanOrEqual(10)
  console.log('Border radius:', br)

  // Gap between 1st and 2nd card
  const cards = page.locator('button[class*="notifCard"]')
  if (await cards.count() >= 2) {
    const box1 = await cards.nth(0).boundingBox()
    const box2 = await cards.nth(1).boundingBox()
    const gap = box2!.y - (box1!.y + box1!.height)
    expect(gap).toBeGreaterThanOrEqual(6)
    console.log('Card gap:', gap)
  }

  // Unread dot inside card
  const dot = page.locator('[class*="unreadDot"]').first()
  if (await dot.count() > 0) {
    const dotBox = await dot.boundingBox()
    expect(dotBox!.x).toBeGreaterThan(box!.x)
    console.log('Dot x:', dotBox!.x, 'Card x:', box!.x, 'Diff:', dotBox!.x - box!.x)
  }

  // No horizontal scroll
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth
  )
  expect(overflow).toBe(false)
})

test('card position metrics - loading skeleton', async ({ page }) => {
  await page.goto(`${BASE}&state=loading`)
  await page.waitForLoadState('networkidle')

  const skCard = page.locator('[class*="skeletonCard"]').first()
  const box = await skCard.boundingBox()
  console.log('Skeleton card box:', JSON.stringify(box))

  expect(box!.x).toBeGreaterThanOrEqual(12)
  expect(box!.x).toBeLessThanOrEqual(20)
  const rightGap = 390 - (box!.x + box!.width)
  expect(rightGap).toBeGreaterThanOrEqual(12)
  expect(rightGap).toBeLessThanOrEqual(20)

  const br = await skCard.evaluate(el => parseFloat(getComputedStyle(el).borderRadius))
  expect(br).toBeGreaterThanOrEqual(10)

  const skIcon = page.locator('[class*="skeletonIcon"]').first()
  const iconBox = await skIcon.boundingBox()
  expect(iconBox!.width).toBeGreaterThanOrEqual(40)
  expect(iconBox!.width).toBeLessThanOrEqual(44)
  const iconBR = await skIcon.evaluate(el => getComputedStyle(el).borderRadius)
  expect(iconBR).toBe('50%')
  console.log('Skeleton icon:', JSON.stringify(iconBox), 'BR:', iconBR)

  // Gap between 1st and 2nd skeleton card
  const skCards = page.locator('[class*="skeletonCard"]')
  if (await skCards.count() >= 2) {
    const b1 = await skCards.nth(0).boundingBox()
    const b2 = await skCards.nth(1).boundingBox()
    const gap = b2!.y - (b1!.y + b1!.height)
    expect(gap).toBeGreaterThanOrEqual(6)
    console.log('Skeleton gap:', gap)
  }

  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth
  )
  expect(overflow).toBe(false)
})

test('normal vs loading card x position diff <= 2px', async ({ page }) => {
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  const normalX = (await page.locator('button[class*="notifCard"]').first().boundingBox())!.x

  await page.goto(`${BASE}&state=loading`)
  await page.waitForLoadState('networkidle')
  const skX = (await page.locator('[class*="skeletonCard"]').first().boundingBox())!.x

  console.log('Normal x:', normalX, 'Skeleton x:', skX, 'Diff:', Math.abs(normalX - skX))
  expect(Math.abs(normalX - skX)).toBeLessThanOrEqual(2)
})
