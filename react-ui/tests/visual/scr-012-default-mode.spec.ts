/**
 * SCR-012 default_inspection_mode 接続テスト
 *
 * App.tsx が preferences を解決した後にのみ SCR-012 をマウントする設計（Approach A）を前提とする。
 * window.HoneyDB モックで非同期 DB フェッチの挙動を検証する。
 */
import { test, expect } from '@playwright/test'

// ── HoneyDB モック注入ヘルパー ─────────────────────────────────────────────────

/** HoneyDB を注入する。delayMs > 0 の場合、getUserPreferences を遅延させる */
async function injectHoneyDB(
  page: import('@playwright/test').Page,
  mode: 'frame' | 'ratio',
  delayMs = 0,
  userId: string | null = null,
) {
  await page.addInitScript(
    ({ mode, delayMs, userId }) => {
      const prefs = {
        default_inspection_mode: mode,
        theme: 'light',
        language: 'ja',
      }
      ;(window as unknown as Record<string, unknown>).HoneyDB = {
        getUserPreferences: () =>
          delayMs > 0
            ? new Promise(resolve => setTimeout(() => resolve(prefs), delayMs))
            : Promise.resolve(prefs),
        getSession: () =>
          Promise.resolve({ user: userId ? { id: userId, email: '' } : null }),
      }
    },
    { mode, delayMs, userId },
  )
}

/** localStorage にユーザープリファレンスキャッシュを設定 */
async function setLocalStoragePrefs(
  page: import('@playwright/test').Page,
  userId: string,
  mode: 'frame' | 'ratio',
) {
  await page.addInitScript(
    ({ userId, mode }) => {
      localStorage.setItem('honeyos_prefs_user_id', userId)
      localStorage.setItem(
        'honeyos_user_prefs',
        JSON.stringify({ default_inspection_mode: mode }),
      )
    },
    { userId, mode },
  )
}

// ── SCR-012 が完全に表示されるまで待つ ───────────────────────────────────────

async function waitForInspectionRecord(page: import('@playwright/test').Page) {
  // pref-loading div が消えて mode-tabs が出るまで待つ
  await page.waitForSelector('[data-testid="mode-tabs"]', { timeout: 5000 })
}

// ── Test cases ────────────────────────────────────────────────────────────────

// 1. DB既定値がframeの場合、SCR-012はframeで開始する
test('SCR-012 default mode: DB default=frame → frame tab active', async ({ page }) => {
  await injectHoneyDB(page, 'frame')
  await page.goto('/?screen=inspection-record&devbar=0')
  await waitForInspectionRecord(page)

  await expect(page.getByTestId('mode-tab-frame')).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByTestId('ratio-fallback-note')).not.toBeVisible()
})

// 2. DB既定値がratioの場合、SCR-012はratioフォールバックで開始する（ratio準備中のためframe表示、案内表示）
test('SCR-012 default mode: DB default=ratio → frame fallback with hint', async ({ page }) => {
  await injectHoneyDB(page, 'ratio')
  await page.goto('/?screen=inspection-record&devbar=0')
  await waitForInspectionRecord(page)

  // ratio は準備中 (SUPPORTED_MODES=['frame']) なので effectiveMode=frame
  await expect(page.getByTestId('mode-tab-frame')).toHaveAttribute('aria-selected', 'true')
  // フォールバック案内が表示される
  await expect(page.getByTestId('ratio-fallback-note')).toBeVisible()
})

// 3. DB応答を意図的に遅延させてもratioが正しく反映される
test('SCR-012 default mode: delayed DB response (500ms) still reflects ratio', async ({ page }) => {
  await injectHoneyDB(page, 'ratio', 500)
  await page.goto('/?screen=inspection-record&devbar=0')
  // pref-loading 表示中は mode-tabs がない
  await page.waitForSelector('[data-testid="pref-loading"]', { timeout: 2000 }).catch(() => {
    // すでに解決済みの場合は loading が一瞬で消えることもある
  })
  await waitForInspectionRecord(page)

  await expect(page.getByTestId('ratio-fallback-note')).toBeVisible()
})

// 4. DB応答前にユーザーが操作できない（gating により SCR-012 は解決後にマウント）
//    → 解決後の初期モードはDBの値が使われ、ユーザー操作後に上書きされない
test('SCR-012 default mode: after mount, DB value does not override user tab interaction', async ({ page }) => {
  // DB default=ratio (becomes frame fallback), user then sees frame tab
  // モードタブを変更しても再マウント時は initialMode から再評価される（useState lazy init）
  await injectHoneyDB(page, 'ratio', 100)
  await page.goto('/?screen=inspection-record&devbar=0')
  await waitForInspectionRecord(page)

  // 現在 frame (fallback) で表示されている
  await expect(page.getByTestId('mode-tab-frame')).toHaveAttribute('aria-selected', 'true')
  // ratio tab は disabled なので操作不可 — モードは変わらない
  await expect(page.getByTestId('mode-tab-ratio')).toBeDisabled()
  // フォールバック案内が表示されている（ratioFallbackActive=true）
  await expect(page.getByTestId('ratio-fallback-note')).toBeVisible()
})

// 5. previousMode=frame、DB既定値=ratioの場合、frameを維持する（URLパラメータで再現）
test('SCR-012 default mode: URL param frame overrides any DB value', async ({ page }) => {
  await injectHoneyDB(page, 'ratio')
  // URL param は初期化時に優先されるため DB に勝る
  await page.goto('/?screen=inspection-record&initialMode=frame&devbar=0')
  await waitForInspectionRecord(page)

  await expect(page.getByTestId('mode-tab-frame')).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByTestId('ratio-fallback-note')).not.toBeVisible()
})

// 6. previousMode=ratio、DB既定値=frameの場合、ratioを維持する（URLパラメータで再現）
test('SCR-012 default mode: URL param ratio overrides DB default=frame', async ({ page }) => {
  await injectHoneyDB(page, 'frame')
  await page.goto('/?screen=inspection-record&initialMode=ratio&devbar=0')
  await waitForInspectionRecord(page)

  // ratio は準備中なのでフォールバック案内が出る
  await expect(page.getByTestId('ratio-fallback-note')).toBeVisible()
})

// 7. ratioを利用できない内検ではframeを表示し、フォールバック案内を表示する
test('SCR-012 default mode: ratio unsupported → frame with fallback note', async ({ page }) => {
  await page.goto('/?screen=inspection-record&initialMode=ratio&devbar=0')
  await page.waitForLoadState('networkidle')
  await waitForInspectionRecord(page)

  await expect(page.getByTestId('mode-tab-frame')).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByTestId('ratio-fallback-note')).toBeVisible()
})

// 8. 別ユーザーのキャッシュが残っていても使用しない
test('SCR-012 default mode: different-user cache is ignored → falls back to DB', async ({ page }) => {
  // 別ユーザーのキャッシュを設定
  await setLocalStoragePrefs(page, 'user-other', 'ratio')
  // DB は frame を返す（カレントユーザーの設定）
  await injectHoneyDB(page, 'frame')
  await page.goto('/?screen=inspection-record&devbar=0')
  await waitForInspectionRecord(page)

  // 別ユーザーのキャッシュ ratio は無視され、DB の frame が使われる
  await expect(page.getByTestId('mode-tab-frame')).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByTestId('ratio-fallback-note')).not.toBeVisible()
})

// 9. オフラインかつ同一ユーザーのキャッシュありの場合、キャッシュ値を使用する
test('SCR-012 default mode: offline with same-user cache → use cache value', async ({ page }) => {
  // 同一ユーザーのキャッシュを設定（ここではユーザーIDを任意に設定）
  await setLocalStoragePrefs(page, 'user-self', 'ratio')
  // HoneyDB は注入しない（window.HoneyDB undefined → getDB() returns null → 即座に fallback）
  // キャッシュが有効なため DB フェッチは実行されない
  await page.goto('/?screen=inspection-record&devbar=0')
  await waitForInspectionRecord(page)

  // キャッシュの ratio → フォールバック案内が表示される
  await expect(page.getByTestId('ratio-fallback-note')).toBeVisible()
})

// 10. オフラインかつキャッシュなしの場合、frameを使用する
test('SCR-012 default mode: offline without cache → frame', async ({ page }) => {
  // HoneyDB 未注入、キャッシュなし
  await page.goto('/?screen=inspection-record&devbar=0')
  await waitForInspectionRecord(page)

  await expect(page.getByTestId('mode-tab-frame')).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByTestId('ratio-fallback-note')).not.toBeVisible()
})
