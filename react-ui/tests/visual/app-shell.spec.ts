import { expect, test } from '@playwright/test'

test('app shell matches the approved mobile baseline', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveScreenshot('app-shell.png', { fullPage: true })
})
