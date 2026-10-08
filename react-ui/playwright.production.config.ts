/**
 * Playwright config for production auth-guard tests.
 *
 * Uses `vite preview` (port 4173) so tests run against the actual
 * production bundle. import.meta.env.DEV === false in the bundle,
 * meaning the authentication guard is fully active.
 *
 * Run via: npm run test:auth:production
 * Steps:  npm run build && vite preview (started by webServer below)
 */
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/production',
  projects: [
    {
      name: 'chromium-mobile-prod',
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
    baseURL: 'http://127.0.0.1:4173',
  },
  webServer: {
    command: 'npx vite preview --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 30000,
  },
  reporter: [['list'], ['junit', { outputFile: 'test-results/auth-guard-junit.xml' }]],
})
