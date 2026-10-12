/**
 * Playwright config for smoke tests against the production build.
 *
 * Tests that /HoneyOS/ serves correctly: window.supabase, window.HoneyDB,
 * unauthenticated redirect, no 404s for JS/CSS assets.
 *
 * Run via: npm run test:smoke
 */
import { defineConfig, devices } from '@playwright/test'

// In the pre-installed local container, Chromium lives at a fixed path.
// On GitHub Actions (and anywhere else), omit executablePath and let
// Playwright find the browser it installed via `playwright install chromium`.
const PREINSTALLED = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const { existsSync } = await import('node:fs')
const executablePath = existsSync(PREINSTALLED) ? PREINSTALLED : undefined

export default defineConfig({
  testDir: './tests/smoke',
  projects: [
    {
      name: 'chromium-smoke',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 },
        ...(executablePath ? { launchOptions: { executablePath } } : {}),
      },
    },
  ],
  use: {
    baseURL: 'http://127.0.0.1:4174/HoneyOS/',
  },
  webServer: {
    command: 'npx vite preview --host 127.0.0.1 --port 4174 --base /HoneyOS/',
    url: 'http://127.0.0.1:4174/HoneyOS/',
    reuseExistingServer: false,
    timeout: 30000,
  },
  reporter: [['list'], ['junit', { outputFile: 'test-results/smoke-junit.xml' }]],
})
