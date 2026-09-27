import { test, expect } from '@playwright/test'

const URL = 'http://localhost:5173/?screen=work-history&state=normal&devbar=0'

// ── helpers ──────────────────────────────────────────────────────────────────

async function getCardDates(page: import('@playwright/test').Page) {
  return page.locator('[class*="cardDate"]').allInnerTexts()
}

async function openMenu(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'メニュー' }).click()
  await page.waitForTimeout(200)
}

async function closeMenuIfOpen(page: import('@playwright/test').Page) {
  const backdrop = page.locator('[class*="menuBackdrop"]')
  if (await backdrop.count() > 0) {
    await backdrop.click({ force: true })
    await page.waitForTimeout(200)
  }
}

// ── tests ─────────────────────────────────────────────────────────────────────

test.describe('SCR-027 sort', () => {
  test('initial order is 新しい順 (descending)', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('networkidle')

    const dates = await getCardDates(page)
    // newest first: September before August
    const sep = dates.findIndex(d => d.includes('9月'))
    const aug = dates.findIndex(d => d.includes('8月'))
    expect(sep).toBeGreaterThanOrEqual(0)
    expect(aug).toBeGreaterThan(sep)
  })

  test('新しい順 shows correct descending date order', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('networkidle')

    const dates = await getCardDates(page)
    // Expected order: 9月7日, 9月6日, 9月2日, 8月28日, 8月20日
    expect(dates[0]).toContain('9月7日')
    expect(dates[1]).toContain('9月6日')
    expect(dates[2]).toContain('9月2日')
    expect(dates[3]).toContain('8月28日')
    expect(dates[4]).toContain('8月20日')
  })

  test('menu shows 新しい順 checked on initial open', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('networkidle')

    await openMenu(page)

    const newFirst = page.getByRole('menuitem', { name: '新しい順' })
    const oldFirst = page.getByRole('menuitem', { name: '古い順' })
    // active item has menuItemActive class (primary color)
    await expect(newFirst).toHaveClass(/menuItemActive/)
    await expect(oldFirst).not.toHaveClass(/menuItemActive/)
  })

  test('switching to 古い順 shows ascending date order', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('networkidle')

    await openMenu(page)
    await page.getByRole('menuitem', { name: '古い順' }).click()
    await page.waitForTimeout(200)

    const dates = await getCardDates(page)
    // Expected order: 8月20日, 8月28日, 9月2日, 9月6日, 9月7日
    expect(dates[0]).toContain('8月20日')
    expect(dates[1]).toContain('8月28日')
    expect(dates[2]).toContain('9月2日')
    expect(dates[3]).toContain('9月6日')
    expect(dates[4]).toContain('9月7日')
  })

  test('menu shows 古い順 checked after switching', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('networkidle')

    await openMenu(page)
    await page.getByRole('menuitem', { name: '古い順' }).click()
    await page.waitForTimeout(200)

    await closeMenuIfOpen(page)
    await openMenu(page)

    const newFirst = page.getByRole('menuitem', { name: '新しい順' })
    const oldFirst = page.getByRole('menuitem', { name: '古い順' })
    await expect(oldFirst).toHaveClass(/menuItemActive/)
    await expect(newFirst).not.toHaveClass(/menuItemActive/)
  })

  test('can revert to 新しい順 after switching to 古い順', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('networkidle')

    // switch to old-first
    await openMenu(page)
    await page.getByRole('menuitem', { name: '古い順' }).click()
    await page.waitForTimeout(200)

    // revert to new-first
    await closeMenuIfOpen(page)
    await openMenu(page)
    await page.getByRole('menuitem', { name: '新しい順' }).click()
    await page.waitForTimeout(200)

    const dates = await getCardDates(page)
    expect(dates[0]).toContain('9月7日')
    expect(dates[4]).toContain('8月20日')
  })

  test('sort works with 作業種別 filter (feeding)', async ({ page }) => {
    await page.goto('http://localhost:5173/?screen=work-history&state=filtered-feeding&devbar=0')
    await page.waitForLoadState('networkidle')

    // switch to old-first
    await openMenu(page)
    await page.getByRole('menuitem', { name: '古い順' }).click()
    await page.waitForTimeout(200)

    const dates = await getCardDates(page)
    // only feeding records; oldest should be first
    expect(dates.length).toBeGreaterThan(0)
    // verify ascending — each date string should be <= next
    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i] <= dates[i + 1] || dates[i].includes('8月') && dates[i + 1].includes('9月')).toBeTruthy()
    }
  })

  test('sort does not mutate original data (multiple round-trips)', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('networkidle')

    const originalDates = await getCardDates(page)

    // switch old → new → old → new
    for (let i = 0; i < 2; i++) {
      await closeMenuIfOpen(page)
      await openMenu(page)
      await page.getByRole('menuitem', { name: '古い順' }).click()
      await page.waitForTimeout(200)
      await closeMenuIfOpen(page)
      await openMenu(page)
      await page.getByRole('menuitem', { name: '新しい順' }).click()
      await page.waitForTimeout(200)
    }

    const finalDates = await getCardDates(page)
    expect(finalDates).toEqual(originalDates)
  })
})
