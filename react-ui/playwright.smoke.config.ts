/**
 * Playwright config for smoke tests against the production build.
 *
 * Tests that /HoneyOS/ serves correctly: window.supabase, window.HoneyDB,
 * unauthenticated redirect, no 404s for JS/CSS assets.
 *
 * Run via: npm run test:smoke
 */
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/smoke',
  projects: [
    {
      name: 'chromium-smoke',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 },
        launchOptions: {
          executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
        },
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
