import { test, expect, type Page } from '@playwright/test'

const SCREEN = 'apiary-create'
const BASE_URL = `/?screen=${SCREEN}&devbar=0`
const FIXED_NOW = new Date('2026-09-27T10:00:00+09:00')

// Mock tile and geocoding requests so tests are deterministic
async function mockNetworkRequests(page: Page) {
  // OSM tiles → empty 204
  await page.route('https://tile.openstreetmap.org/**', route =>
    route.fulfill({ status: 204, body: '' }),
  )
  // Nominatim geocoding → mock results
  await page.route('https://nominatim.openstreetmap.org/**', route =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        { display_name: '静岡県磐田市宮田', lat: '34.7156', lon: '137.8520' },
        { display_name: '静岡県磐田市中泉', lat: '34.7181', lon: '137.8571' },
      ]),
    }),
  )
}

async function goto(page: Page, extra = '') {
  await page.clock.install({ time: FIXED_NOW })
  await mockNetworkRequests(page)
  await page.goto(`${BASE_URL}${extra}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
}

async function stabilise(page: Page) {
  await page.mouse.move(2, 2)
  await page.waitForTimeout(150)
}

// ── 1. 通常（未入力）────────────────────────────────────────────────────────
test('SCR-033 normal', async ({ page }) => {
  await goto(page)
  await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: '養蜂場を追加' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'メインナビゲーション' })).not.toBeVisible()
  await expect(page.getByLabel('養蜂場名')).toBeVisible()
  await expect(page.getByLabel('住所・地名を検索')).toBeVisible()
  await expect(page.getByText('所在地を選択してください')).toBeVisible()
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-033-normal.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 2. 入力済み ──────────────────────────────────────────────────────────────
test('SCR-033 filled', async ({ page }) => {
  await goto(page)
  const nameInput = page.getByLabel('養蜂場名')
  await nameInput.fill('宮田養蜂場')
  await page.waitForTimeout(100)
  // Select a location from mock data via search
  const searchInput = page.getByLabel('住所・地名を検索')
  await searchInput.fill('磐田')
  await searchInput.press('Enter')
  await page.waitForTimeout(600)
  // Click first result
  await page.getByRole('option').first().click()
  await page.waitForTimeout(200)
  // Blur inputs
  await nameInput.blur()
  await searchInput.blur()
  await stabilise(page)
  await expect(page.getByText('静岡県磐田市宮田')).toBeVisible()
  await expect(page).toHaveScreenshot('scr-033-filled.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 3. 検索結果表示 ──────────────────────────────────────────────────────────
test('SCR-033 search-results', async ({ page }) => {
  await goto(page)
  const searchInput = page.getByLabel('住所・地名を検索')
  await searchInput.fill('磐田')
  await searchInput.press('Enter')
  await page.waitForTimeout(600)
  await expect(page.getByRole('option').first()).toBeVisible()
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-033-search-results.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 4. ピン調整後 ────────────────────────────────────────────────────────────
test('SCR-033 pin-adjusted', async ({ page }) => {
  await goto(page)
  // Select a location first
  const searchInput = page.getByLabel('住所・地名を検索')
  await searchInput.fill('磐田')
  await searchInput.press('Enter')
  await page.waitForTimeout(600)
  await page.getByRole('option').first().click()
  await page.waitForTimeout(200)
  // Click elsewhere on map to move pin
  const mapEl = page.locator('.leaflet-container')
  await mapEl.click({ position: { x: 180, y: 100 } })
  await page.waitForTimeout(200)
  await searchInput.blur()
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-033-pin-adjusted.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 5. 現在地取得中 ──────────────────────────────────────────────────────────
test('SCR-033 locating', async ({ page }) => {
  await page.clock.install({ time: FIXED_NOW })
  await mockNetworkRequests(page)
  // Mock geolocation to hang (never resolves)
  await page.context().setGeolocation({ latitude: 34.7156, longitude: 137.8520 })
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  // Block geolocation to simulate in-progress: click location btn
  // We can't easily freeze geolocation mid-call in Playwright,
  // so we verify the button is present and tap it with a slow mock
  await page.addInitScript(() => {
    const orig = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation)
    navigator.geolocation.getCurrentPosition = (success, error, opts) => {
      // Delay forever to simulate loading state
      setTimeout(() => orig(success, error, opts), 60000)
    }
  })
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  await page.getByRole('button', { name: '現在地を取得' }).click()
  await page.waitForTimeout(150)
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-033-locating.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 6. 位置情報拒否 ──────────────────────────────────────────────────────────
test('SCR-033 geolocation-denied', async ({ page }) => {
  await goto(page, '&state=geolocation-denied')
  await page.waitForTimeout(200)
  await expect(page.getByText('現在地を取得できませんでした。住所を検索するか、地図上で位置を指定してください。')).toBeVisible()
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-033-geolocation-denied.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 7. 地図読み込みエラー ────────────────────────────────────────────────────
test('SCR-033 map-error', async ({ page }) => {
  await goto(page, '&state=map-error')
  await page.waitForTimeout(200)
  await expect(page.getByText('地図を読み込めませんでした。')).toBeVisible()
  await expect(page.getByRole('button', { name: '再試行' })).toBeVisible()
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-033-map-error.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 8. バリデーションエラー ──────────────────────────────────────────────────
test('SCR-033 validation-error', async ({ page }) => {
  await goto(page)
  await page.getByRole('button', { name: '養蜂場を登録' }).click()
  await page.waitForTimeout(100)
  await expect(page.getByText('養蜂場名を入力してください')).toBeVisible()
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-033-validation-error.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 9. 登録中 ────────────────────────────────────────────────────────────────
test('SCR-033 submitting', async ({ page }) => {
  await goto(page, '&state=submitting')
  await page.waitForTimeout(200)
  const submitBtn = page.getByRole('button', { name: '養蜂場を登録' })
  await expect(submitBtn).toBeDisabled()
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-033-submitting.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 10. 登録エラー ────────────────────────────────────────────────────────────
test('SCR-033 error', async ({ page }) => {
  await goto(page, '&state=submit-error')
  await page.waitForTimeout(200)
  await expect(page.getByText('養蜂場を登録できませんでした。もう一度お試しください。')).toBeVisible()
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-033-error.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 11. オフライン ────────────────────────────────────────────────────────────
test('SCR-033 offline', async ({ page }) => {
  await goto(page, '&state=offline')
  await page.waitForTimeout(200)
  await expect(page.getByText('オフラインのため養蜂場を登録できません')).toBeVisible()
  const submitBtn = page.getByRole('button', { name: '養蜂場を登録' })
  await expect(submitBtn).toBeDisabled()
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-033-offline.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── 12. SCR-032からの遷移 ────────────────────────────────────────────────────
test('SCR-033 from-colony-create', async ({ page }) => {
  await page.clock.install({ time: FIXED_NOW })
  await mockNetworkRequests(page)
  await page.goto('/?screen=colony-create&devbar=0', { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: '新しい養蜂場を追加（SCR-033）' }).click()
  await page.waitForTimeout(400)
  await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: '養蜂場を追加' })).toBeVisible()
  await stabilise(page)
  await expect(page).toHaveScreenshot('scr-033-from-colony-create.png', {
    fullPage: false, animations: 'disabled',
  })
})

// ── Functional: no BottomNav ──────────────────────────────────────────────────
test('SCR-033 has no BottomNav', async ({ page }) => {
  await goto(page)
  await expect(page.getByRole('navigation', { name: 'メインナビゲーション' })).not.toBeVisible()
})

// ── Functional: back navigation ───────────────────────────────────────────────
test('SCR-033 back button returns to previous screen', async ({ page }) => {
  await page.clock.install({ time: FIXED_NOW })
  await mockNetworkRequests(page)
  await page.goto('/?screen=colony-create&devbar=0', { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: '新しい養蜂場を追加（SCR-033）' }).click()
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: '戻る' }).click()
  await page.waitForTimeout(200)
  await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: '蜂群を追加' })).toBeVisible()
})

// ── Functional: no horizontal scroll ─────────────────────────────────────────
test('SCR-033 no horizontal scroll', async ({ page }) => {
  await goto(page)
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
})
