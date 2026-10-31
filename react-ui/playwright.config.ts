import { defineConfig, devices } from '@playwright/test'
import { resolveLaunchOptions } from './tests/chromiumLaunchOptions'

const launchOptions = resolveLaunchOptions()

export default defineConfig({
  testDir: './tests/visual',
  projects: [
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 },
        ...(launchOptions ? { launchOptions } : {}),
      },
    },
  ],
  use: {
    baseURL: 'http://127.0.0.1:5173',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
  },
})
