import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173/?screen=onboarding-3&devbar=0'

async function scrollToTop(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    document.documentElement.style.scrollBehavior = 'auto'
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    document.querySelectorAll('[class*="body"], [class*="form"]').forEach(el => {
      (el as HTMLElement).scrollTop = 0
    })
  })
  await page.waitForFunction(() => window.scrollY === 0)
}

// ── スクリーンショット ───────────────────────────────────────────

test('SCR-005 onboarding3 — normal', async ({ page }) => {
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await scrollToTop(page)
  await expect(page).toHaveScreenshot('scr-005-normal.png')
})

test('SCR-005 onboarding3 — no-apiary', async ({ page }) => {
  await page.goto(`${BASE}&state=no-apiary`)
  await page.waitForLoadState('networkidle')
  await scrollToTop(page)
  await expect(page).toHaveScreenshot('scr-005-no-apiary.png')
})

test('SCR-005 onboarding3 — no-colony', async ({ page }) => {
  await page.goto(`${BASE}&state=no-colony`)
  await page.waitForLoadState('networkidle')
  await scrollToTop(page)
  await expect(page).toHaveScreenshot('scr-005-no-colony.png')
})

test('SCR-005 onboarding3 — long-content', async ({ page }) => {
  await page.goto(`${BASE}&state=long-content`)
  await page.waitForLoadState('networkidle')
  await scrollToTop(page)
  await expect(page).toHaveScreenshot('scr-005-long-content.png')
})

test('SCR-005 onboarding3 — loading', async ({ page }) => {
  await page.goto(`${BASE}&state=loading`)
  await page.waitForLoadState('networkidle')
  await scrollToTop(page)
  await expect(page).toHaveScreenshot('scr-005-loading.png')
})

test('SCR-005 onboarding3 — error', async ({ page }) => {
  await page.goto(`${BASE}&state=error`)
  await page.waitForLoadState('networkidle')
  await scrollToTop(page)
  await expect(page).toHaveScreenshot('scr-005-error.png')
})

test('SCR-005 onboarding3 — offline-cached', async ({ page }) => {
  await page.goto(`${BASE}&state=offline-cached`)
  await page.waitForLoadState('networkidle')
  await scrollToTop(page)
  await expect(page).toHaveScreenshot('scr-005-offline-cached.png')
})

test('SCR-005 onboarding3 — offline-no-cache', async ({ page }) => {
  await page.goto(`${BASE}&state=offline-no-cache`)
  await page.waitForLoadState('networkidle')
  await scrollToTop(page)
  await expect(page).toHaveScreenshot('scr-005-offline-no-cache.png')
})

// ── 機能テスト ───────────────────────────────────────────────────

test('SCR-005 onboarding3 — BottomNavが表示されない', async ({ page }) => {
  await page.goto(BASE)
  await expect(page.locator('nav[aria-label]')).not.toBeVisible()
})

test('SCR-005 onboarding3 — 全状態でBottomNavがない', async ({ page }) => {
  const states = ['normal', 'no-apiary', 'no-colony', 'long-content', 'loading', 'error', 'offline-cached', 'offline-no-cache']
  for (const state of states) {
    await page.goto(`${BASE}&state=${state}`)
    await expect(page.locator('nav[aria-label]'), `${state}でBottomNavあり`).not.toBeVisible()
  }
})

test('SCR-005 onboarding3 — 全状態で横スクロールがない', async ({ page }) => {
  const states = ['normal', 'no-apiary', 'no-colony', 'loading', 'error', 'offline-cached', 'offline-no-cache']
  for (const state of states) {
    await page.goto(`${BASE}&state=${state}`)
    await page.waitForLoadState('networkidle')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(overflow, `${state}で横スクロールあり`).toBe(false)
  }
})

test('SCR-005 onboarding3 — ヘッダー要素が表示される', async ({ page }) => {
  await page.goto(BASE)
  await expect(page.getByRole('button', { name: '戻る' })).toBeVisible()
  await expect(page.getByText('3 / 3')).toBeVisible()
})

test('SCR-005 onboarding3 — スキップボタンが表示されない', async ({ page }) => {
  await page.goto(BASE)
  await expect(page.getByRole('button', { name: 'スキップ' })).not.toBeVisible()
})

test('SCR-005 onboarding3 — 主要コンテンツが表示される', async ({ page }) => {
  await page.goto(BASE)
  await expect(page.getByText('準備ができました')).toBeVisible()
  await expect(page.getByText('HoneyOSのご利用準備が完了しました。')).toBeVisible()
  await expect(page.getByText('はじめにやってみましょう')).toBeVisible()
})

test('SCR-005 onboarding3 — 主ボタンと副ボタンが表示される', async ({ page }) => {
  await page.goto(BASE)
  await expect(page.getByRole('button', { name: '最初の内検を始める' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'ダッシュボードを見る' })).toBeVisible()
})

test('SCR-005 onboarding3 — 通常状態で補足文まで表示される', async ({ page }) => {
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('内検データはあとから編集できます。')).toBeVisible()
})

// ── カード内容アサーション ────────────────────────────────────────

test('SCR-005 onboarding3 — normalに3群が表示される', async ({ page }) => {
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('3 群')).toBeVisible()
})

test('SCR-005 onboarding3 — no-apiaryに0群が表示される', async ({ page }) => {
  await page.goto(`${BASE}&state=no-apiary`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('0 群')).toBeVisible()
})

test('SCR-005 onboarding3 — no-colonyに0群が表示される', async ({ page }) => {
  await page.goto(`${BASE}&state=no-colony`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('0 群')).toBeVisible()
})

test('SCR-005 onboarding3 — offline-cachedに所在地と3群が表示される', async ({ page }) => {
  await page.goto(`${BASE}&state=offline-cached`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('静岡県磐田市宮田')).toBeVisible()
  await expect(page.getByText('3 群')).toBeVisible()
})

test('SCR-005 onboarding3 — loadingのスケルトンが4行ある', async ({ page }) => {
  await page.goto(`${BASE}&state=loading`)
  await page.waitForLoadState('networkidle')
  const card = page.locator('[aria-busy="true"]')
  await expect(card).toBeVisible()
  // 4つのスケルトン行 (skeletonRow)
  const rows = card.locator('[class*="skeletonRow"]')
  await expect(rows).toHaveCount(4)
})

test('SCR-005 onboarding3 — long-contentでカードの内容が切れていない', async ({ page }) => {
  await page.goto(`${BASE}&state=long-content`)
  await page.waitForLoadState('networkidle')
  // 養蜂場名が表示されている
  await expect(page.getByText('静岡県西部養蜂組合第一支部宮田養蜂場分場')).toBeVisible()
  // 所在地が表示されている
  await expect(page.getByText('静岡県浜松市浜名区引佐町奥山特別地域長い住所テスト')).toBeVisible()
})

test('SCR-005 onboarding3 — long-contentで蜂群数行まで存在する', async ({ page }) => {
  await page.goto(`${BASE}&state=long-content`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('20 群')).toBeVisible()
})

test('SCR-005 onboarding3 — errorで2行だけの不完全なカードを表示しない', async ({ page }) => {
  await page.goto(`${BASE}&state=error`)
  await page.waitForLoadState('networkidle')
  // エラー時はカード内に"取得できませんでした"を表示
  await expect(page.getByText('登録情報を取得できませんでした。')).toBeVisible()
  // 不完全なデータ (—) が表示されていないこと
  await expect(page.getByText('—')).not.toBeVisible()
})

test('SCR-005 onboarding3 — errorバナーに再読み込みが表示される', async ({ page }) => {
  await page.goto(`${BASE}&state=error`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('button', { name: '再読み込み' })).toBeVisible()
})

test('SCR-005 onboarding3 — errorでキャッシュなしの場合は主ボタンが実行不能', async ({ page }) => {
  await page.goto(`${BASE}&state=error`)
  await page.waitForLoadState('networkidle')
  const primaryBtn = page.getByRole('button', { name: '最初の内検を始める' })
  await expect(primaryBtn).toBeDisabled()
})

test('SCR-005 onboarding3 — errorでもダッシュボードを見るは利用可能', async ({ page }) => {
  await page.goto(`${BASE}&state=error`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('button', { name: 'ダッシュボードを見る' })).toBeEnabled()
})

test('SCR-005 onboarding3 — offline-no-cacheで主ボタンが実行不能', async ({ page }) => {
  await page.goto(`${BASE}&state=offline-no-cache`)
  await page.waitForLoadState('networkidle')
  const primaryBtn = page.getByRole('button', { name: '最初の内検を始める' })
  await expect(primaryBtn).toBeDisabled()
})

// ── 画面遷移 ────────────────────────────────────────────────────

test('SCR-005 onboarding3 — no-apiary状態で主ボタンが「養蜂場を追加する」', async ({ page }) => {
  await page.goto(`${BASE}&state=no-apiary`)
  await expect(page.getByRole('button', { name: '養蜂場を追加する' })).toBeVisible()
})

test('SCR-005 onboarding3 — no-colony状態で主ボタンが「蜂群を追加する」', async ({ page }) => {
  await page.goto(`${BASE}&state=no-colony`)
  await expect(page.getByRole('button', { name: '蜂群を追加する' })).toBeVisible()
})

test('SCR-005 onboarding3 — 戻るボタンでSCR-004へ', async ({ page }) => {
  await page.goto(BASE)
  await page.getByRole('button', { name: '戻る' }).click()
  await expect(page.getByText('2 / 3')).toBeVisible()
})

test('SCR-005 onboarding3 — 副ボタンでダッシュボードへ', async ({ page }) => {
  await page.goto(BASE)
  await page.getByRole('button', { name: 'ダッシュボードを見る' }).click()
  await expect(page.locator('nav[aria-label]')).toBeVisible()
})

test('SCR-005 onboarding3 — SCR-004の保存完了でSCR-005へ遷移', async ({ page }) => {
  await page.goto('http://localhost:5173/?screen=onboarding-2&devbar=0&state=filled')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: '設定して次へ' }).click()
  await expect(page.getByText('3 / 3')).toBeVisible()
})

test('SCR-005 onboarding3 — SCR-004の今は設定しないでSCR-005へ遷移', async ({ page }) => {
  await page.goto('http://localhost:5173/?screen=onboarding-2&devbar=0')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: '今は設定しない' }).click()
  await expect(page.getByText('3 / 3')).toBeVisible()
})

test('SCR-005 onboarding3 — SCR-004のスキップでSCR-005へ遷移', async ({ page }) => {
  await page.goto('http://localhost:5173/?screen=onboarding-2&devbar=0')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'スキップ' }).click()
  await expect(page.getByText('3 / 3')).toBeVisible()
})

test('SCR-005 onboarding3 — 横スクロールがない', async ({ page }) => {
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflow).toBe(false)
})

test('SCR-005 onboarding3 — 二重クリックで二重遷移しない', async ({ page }) => {
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  const btn = page.getByRole('button', { name: 'ダッシュボードを見る' })
  await btn.dblclick()
  await expect(page.locator('nav[aria-label]')).toBeVisible()
})
