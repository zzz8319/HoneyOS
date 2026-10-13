import { expect, test } from '@playwright/test'
import { injectMockHoneyDB } from './helpers/mockHoneyDB'

test('app shell matches the approved mobile baseline', async ({ page }) => {
  await injectMockHoneyDB(page)
  await page.goto('/')
  await expect(page).toHaveScreenshot('app-shell.png', { fullPage: true })
})
