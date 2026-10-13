/**
 * Smoke tests for the production build at /HoneyOS/.
 *
 * Verifies:
 * - window.supabase is set (supabase.min.js loaded)
 * - window.HoneyDB is set (supabase_client.js loaded)
 * - Unauthenticated visit redirects to login screen
 * - JS/CSS assets load without 404
 */
import { test, expect } from '@playwright/test'

test('window.supabase is defined after page load', async ({ page }) => {
  await page.goto('./', { waitUntil: 'networkidle' })
  const defined = await page.evaluate(() => typeof (window as { supabase?: unknown }).supabase !== 'undefined')
  expect(defined).toBe(true)
})

test('window.HoneyDB is defined after page load', async ({ page }) => {
  await page.goto('./', { waitUntil: 'networkidle' })
  const defined = await page.evaluate(() => typeof (window as { HoneyDB?: unknown }).HoneyDB !== 'undefined')
  expect(defined).toBe(true)
})

test('unauthenticated visit shows login screen', async ({ page }) => {
  await page.goto('./', { waitUntil: 'networkidle' })
  // App should render the login/auth screen, not the main OS
  await expect(page.locator('#root')).not.toBeEmpty()
  // The home/dashboard should NOT be visible without auth
  const homeVisible = await page.locator('[data-screen="home"], [data-testid="home-screen"]').isVisible().catch(() => false)
  expect(homeVisible).toBe(false)
})

test('no 404s for JS and CSS assets', async ({ page }) => {
  const failed: string[] = []
  page.on('response', (response) => {
    const url = response.url()
    if ((url.endsWith('.js') || url.endsWith('.css')) && response.status() === 404) {
      failed.push(`${response.status()} ${url}`)
    }
  })
  await page.goto('./', { waitUntil: 'networkidle' })
  expect(failed).toEqual([])
})
