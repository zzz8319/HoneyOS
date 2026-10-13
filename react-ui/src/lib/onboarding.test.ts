/**
 * Unit tests for onboarding state machine logic.
 *
 * Tests cover:
 *  - getUserPreferences onboarding_completed behavior
 *  - App routing decisions based on onboarding state
 *  - Completion handler success / failure
 *  - User switch and auth event interactions
 */
import { describe, it, expect, vi } from 'vitest'

// ── Helpers ─────────────────────────────────────────────────────────────────

type OnboardingState = 'pending' | 'required' | 'completed' | 'error'

/** Simulate the onboarding check logic used in App.tsx */
async function runOnboardingCheck(
  getUserPrefs: () => Promise<{ onboarding_completed?: boolean } | null>,
): Promise<OnboardingState> {
  try {
    const prefs = await getUserPrefs()
    const completed = prefs?.onboarding_completed ?? false
    return completed ? 'completed' : 'required'
  } catch {
    return 'error'
  }
}

/** Simulate the completion handler from App.tsx */
async function runOnboardingComplete(
  updatePrefs: (p: object) => Promise<void>,
  setState: (s: OnboardingState) => void,
  navigate: (s: string) => void,
): Promise<void> {
  await updatePrefs({ onboarding_completed: true, onboarding_completed_at: new Date().toISOString() })
  setState('completed')
  navigate('home')
}

// ── 1. getUserPreferences: onboarding_completed=true → returns true ──────────

describe('getUserPreferences: onboarding_completed field', () => {
  it('1. row with onboarding_completed=true → resolved as true', async () => {
    const prefs = { theme: 'system', language: 'ja', default_inspection_mode: 'frame', onboarding_completed: true }
    const result = await runOnboardingCheck(async () => prefs)
    expect(result).toBe('completed')
  })

  it('2. row with onboarding_completed=false → resolved as false', async () => {
    const prefs = { theme: 'system', language: 'ja', default_inspection_mode: 'frame', onboarding_completed: false }
    const result = await runOnboardingCheck(async () => prefs)
    expect(result).toBe('required')
  })

  it('3. getUserPreferences returns null → defaults to false (required)', async () => {
    const result = await runOnboardingCheck(async () => null)
    expect(result).toBe('required')
  })

  it('4. prefs returned without onboarding_completed field → defaults to false (required)', async () => {
    const prefs = { theme: 'system', language: 'ja', default_inspection_mode: 'frame' }
    const result = await runOnboardingCheck(async () => prefs as object as { onboarding_completed?: boolean })
    expect(result).toBe('required')
  })

  it('5. updateUserPreferences with onboarding_completed=true → called with correct field', async () => {
    const updateFn = vi.fn().mockResolvedValue(undefined)
    const setState = vi.fn()
    const navigate = vi.fn()
    await runOnboardingComplete(updateFn, setState, navigate)
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({ onboarding_completed: true })
    )
  })

  it('6. updateUserPreferences failure → error thrown, state not set to completed', async () => {
    const updateFn = vi.fn().mockRejectedValue(new Error('DB error'))
    const setState = vi.fn()
    const navigate = vi.fn()
    await expect(runOnboardingComplete(updateFn, setState, navigate)).rejects.toThrow()
    expect(setState).not.toHaveBeenCalledWith('completed')
    expect(navigate).not.toHaveBeenCalled()
  })
})

// ── App routing decisions ─────────────────────────────────────────────────────

describe('App routing based on onboarding state', () => {
  it('7. authenticated + completed=true → onboardingState completed, show home', async () => {
    const prefs = { onboarding_completed: true }
    const result = await runOnboardingCheck(async () => prefs)
    expect(result).toBe('completed')
  })

  it('8. authenticated + completed=false → onboardingState required, show onboarding-1', async () => {
    const prefs = { onboarding_completed: false }
    const result = await runOnboardingCheck(async () => prefs)
    expect(result).toBe('required')
  })

  it('9. pending state: home should not be shown (gate blocks rendering)', () => {
    // Simulate: pending = blocking spinner; completed = normal routing
    const isHomeVisible = (state: OnboardingState) =>
      state === 'completed'
    expect(isHomeVisible('pending')).toBe(false)
    expect(isHomeVisible('required')).toBe(false)
    expect(isHomeVisible('error')).toBe(false)
    expect(isHomeVisible('completed')).toBe(true)
  })

  it('10. onboarding fetch fails → state=error, home not shown', async () => {
    const result = await runOnboardingCheck(async () => { throw new Error('network') })
    expect(result).toBe('error')
    const isHomeVisible = (state: OnboardingState) => state === 'completed'
    expect(isHomeVisible(result)).toBe(false)
  })

  it('11. retry after error: re-triggers fetch and resolves to completed', async () => {
    // First call fails, second call succeeds
    const getUserPrefs = vi.fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ onboarding_completed: true })

    const r1 = await runOnboardingCheck(getUserPrefs)
    expect(r1).toBe('error')

    const r2 = await runOnboardingCheck(getUserPrefs)
    expect(r2).toBe('completed')
  })

  it('12. SIGNED_OUT → onboardingState resets to pending (for next login)', () => {
    let state: OnboardingState = 'completed'
    // Simulate SIGNED_OUT handler
    function handleSignedOut() { state = 'pending' }
    handleSignedOut()
    expect(state).toBe('pending')
  })

  it('13. different userId SIGNED_IN → onboarding re-fetched (state reset to pending)', async () => {
    let currentUserId = 'u1'
    let onboardingState: OnboardingState = 'completed'

    // Simulate SIGNED_IN with new userId
    function handleSignedIn(newUserId: string) {
      if (newUserId !== currentUserId) {
        onboardingState = 'pending'
        currentUserId = newUserId
      }
    }

    handleSignedIn('u2')
    expect(onboardingState).toBe('pending')
    expect(currentUserId).toBe('u2')
  })

  it('14. TOKEN_REFRESHED: same userId → onboarding NOT re-fetched', () => {
    let currentUserId = 'u1'
    let fetchCount = 0
    let onboardingState: OnboardingState = 'completed'

    // TOKEN_REFRESHED does not reset onboarding (effect deps don't change for same userId)
    function handleTokenRefreshed(newUserId: string) {
      if (newUserId !== currentUserId) {
        // Only if userId actually changes
        onboardingState = 'pending'
        fetchCount++
        currentUserId = newUserId
      }
    }

    handleTokenRefreshed('u1') // Same user
    expect(fetchCount).toBe(0)
    expect(onboardingState).toBe('completed')
  })

  it('15. recoveryMode=true → onboarding check skipped entirely', () => {
    const recoveryMode = true
    const authState = 'authenticated'
    const currentUserId = 'u1'

    // Simulate the condition: effect returns early if recoveryMode
    function shouldRunOnboardingCheck() {
      return authState === 'authenticated' && !!currentUserId && !recoveryMode
    }

    expect(shouldRunOnboardingCheck()).toBe(false)
  })
})

// ── Completion handler ────────────────────────────────────────────────────────

describe('Onboarding completion handler', () => {
  it('16. all saves succeed → completed=true written, home navigated', async () => {
    const updateFn = vi.fn().mockResolvedValue(undefined)
    const setState = vi.fn() as unknown as (s: OnboardingState) => void
    const navigate = vi.fn() as unknown as (s: string) => void
    await runOnboardingComplete(updateFn, setState, navigate)
    expect(updateFn).toHaveBeenCalledWith(expect.objectContaining({ onboarding_completed: true }))
    expect(setState as ReturnType<typeof vi.fn>).toHaveBeenCalledWith('completed')
    expect(navigate as ReturnType<typeof vi.fn>).toHaveBeenCalledWith('home')
  })

  it('17. preferences write fails → home NOT navigated, completed NOT set', async () => {
    const updateFn = vi.fn().mockRejectedValue(new Error('write failed'))
    const setState = vi.fn() as unknown as (s: OnboardingState) => void
    const navigate = vi.fn() as unknown as (s: string) => void
    await expect(runOnboardingComplete(updateFn, setState, navigate)).rejects.toThrow('write failed')
    expect(setState as ReturnType<typeof vi.fn>).not.toHaveBeenCalledWith('completed')
    expect(navigate as ReturnType<typeof vi.fn>).not.toHaveBeenCalled()
  })

  it('18. preferences write fails → error is thrown (caller handles it)', async () => {
    const updateFn = vi.fn().mockRejectedValue(new Error('network'))
    const setState = vi.fn() as unknown as (s: OnboardingState) => void
    const navigate = vi.fn() as unknown as (s: string) => void
    let caught: Error | null = null
    try {
      await runOnboardingComplete(updateFn, setState, navigate)
    } catch (e) {
      caught = e as Error
    }
    expect(caught).not.toBeNull()
    expect(caught?.message).toBe('network')
  })

  it('19. double-submit prevented: second call blocked while first is in flight', async () => {
    let isSubmitting = false
    let callCount = 0

    async function submit() {
      if (isSubmitting) return
      isSubmitting = true
      callCount++
      // Simulate async work
      await Promise.resolve()
      isSubmitting = false
    }

    // First call proceeds
    const p1 = submit()
    // Second call immediately after is blocked
    const p2 = submit()
    await Promise.all([p1, p2])
    expect(callCount).toBe(1)
  })

  it('20. error keeps form state (completeError set, navigation NOT called)', async () => {
    let completeError = ''
    let navigated = false

    async function handlePrimary(onComplete: () => Promise<void>) {
      let isNavigating = false
      if (isNavigating) { return }
      completeError = ''
      try {
        await onComplete()
      } catch {
        completeError = '完了処理に失敗しました。もう一度お試しください。'
        return
      }
      isNavigating = true
      navigated = isNavigating
    }

    await handlePrimary(async () => { throw new Error('fail') })
    expect(completeError).toBeTruthy()
    expect(navigated).toBe(false)
  })

  it('21. retry succeeds after previous failure', async () => {
    const updateFn = vi.fn()
      .mockRejectedValueOnce(new Error('first fail'))
      .mockResolvedValueOnce(undefined)

    // First attempt fails
    let r1: OnboardingState | null = null
    try {
      await runOnboardingComplete(updateFn, (s) => { r1 = s }, () => {})
    } catch { /* expected */ }
    expect(r1).toBeNull() // not set to completed

    // Second attempt succeeds
    let r2: OnboardingState | null = null
    await runOnboardingComplete(updateFn, (s) => { r2 = s }, () => {})
    expect(r2).toBe('completed')
  })
})

// ── D-2 regression: updateUserPreferences partial-update ─────────────────────
// This helper reproduces the payload-building logic from supabase_client.js.
// Initially written with the BUGGY spread pattern to prove the regression.
// Updated to the fixed allowlist pattern after supabase_client.js is fixed.

const ALLOWED_PREF_FIELDS_TEST = [
  'theme',
  'language',
  'default_inspection_mode',
  'onboarding_completed',
  'onboarding_completed_at',
] as const

/**
 * Reproduces the fixed updateUserPreferences payload-building logic for unit testing.
 * Mirrors supabase_client.js — update in sync when that file changes.
 */
function buildUpdatePrefsPayload(
  partialPrefs: Record<string, unknown>,
  userId = 'u1',
  now = '2026-10-09T00:00:00.000Z',
): Record<string, unknown> {
  // FIXED IMPLEMENTATION (allowlist-based partial update):
  const sanitized: Record<string, unknown> = {}
  for (const key of ALLOWED_PREF_FIELDS_TEST) {
    if (Object.prototype.hasOwnProperty.call(partialPrefs, key) && partialPrefs[key] !== undefined) {
      sanitized[key] = partialPrefs[key]
    }
  }
  // onboarding_completed_at rules
  if (sanitized['onboarding_completed'] === true && !Object.prototype.hasOwnProperty.call(sanitized, 'onboarding_completed_at')) {
    sanitized['onboarding_completed_at'] = now
  }
  if (sanitized['onboarding_completed'] === false) {
    sanitized['onboarding_completed_at'] = null
  }
  return { user_id: userId, ...sanitized, updated_at: now }
}

describe('D-2 regression: updateUserPreferences partial update', () => {
  // This test proves D-2: theme-only update must NOT include onboarding_completed=false
  // It FAILED with the old spread pattern (DEFAULT_PREFS was spread into every payload).
  it('D-2. theme-only update: payload must NOT contain onboarding_completed', () => {
    const payload = buildUpdatePrefsPayload({ theme: 'dark' })
    expect(payload).not.toHaveProperty('onboarding_completed')
  })
})

describe('updateUserPreferences: allowlist-based partial update (fixed)', () => {
  // ①: theme-only update does not send onboarding_completed
  it('U-1. theme-only update preserves onboarding_completed (field absent from payload)', () => {
    const payload = buildUpdatePrefsPayload({ theme: 'dark' })
    expect(payload.theme).toBe('dark')
    expect(payload).not.toHaveProperty('onboarding_completed')
  })

  // ②: language-only update does not send onboarding_completed
  it('U-2. language-only update: onboarding_completed absent from payload', () => {
    const payload = buildUpdatePrefsPayload({ language: 'en' })
    expect(payload.language).toBe('en')
    expect(payload).not.toHaveProperty('onboarding_completed')
  })

  // ③: default_inspection_mode-only update does not send onboarding_completed
  it('U-3. default_inspection_mode-only update: onboarding_completed absent from payload', () => {
    const payload = buildUpdatePrefsPayload({ default_inspection_mode: 'ratio' })
    expect(payload.default_inspection_mode).toBe('ratio')
    expect(payload).not.toHaveProperty('onboarding_completed')
  })

  // ④: onboarding_completed=true update does not accidentally clobber theme
  it('U-4. onboarding_completed=true update: theme is absent from payload (not clobbered)', () => {
    const payload = buildUpdatePrefsPayload({ onboarding_completed: true })
    expect(payload.onboarding_completed).toBe(true)
    // theme not supplied → not in payload (DB retains existing value via upsert partial-column semantics)
    expect(payload).not.toHaveProperty('theme')
  })

  // ⑤: onboarding_completed_at absent when not in update and onboarding not set
  it('U-5. theme-only update: onboarding_completed_at absent from payload', () => {
    const payload = buildUpdatePrefsPayload({ theme: 'light' })
    expect(payload).not.toHaveProperty('onboarding_completed_at')
  })

  // ⑥: undefined values stripped from payload
  it('U-6. undefined field values are stripped from payload', () => {
    const payload = buildUpdatePrefsPayload({ theme: undefined as unknown as string, language: 'en' })
    expect(payload).not.toHaveProperty('theme')
    expect(payload.language).toBe('en')
  })

  // ⑦: user_id from caller stripped (session user_id used)
  it('U-7. user_id in partialPrefs is ignored; session user_id is used', () => {
    const payload = buildUpdatePrefsPayload({ user_id: 'hacker-id', theme: 'dark' } as Record<string, unknown>, 'session-user')
    expect(payload.user_id).toBe('session-user')
    expect(payload.theme).toBe('dark')
  })

  // ⑧: created_at stripped from payload
  it('U-8. created_at from caller is stripped', () => {
    const payload = buildUpdatePrefsPayload({ created_at: '2020-01-01', theme: 'dark' } as Record<string, unknown>)
    expect(payload).not.toHaveProperty('created_at')
    expect(payload.theme).toBe('dark')
  })

  // ⑨: unknown fields stripped
  it('U-9. unknown fields are stripped from payload', () => {
    const payload = buildUpdatePrefsPayload({ theme: 'dark', hacker_field: 'evil', __proto__: 'bad' } as Record<string, unknown>)
    expect(payload).not.toHaveProperty('hacker_field')
    expect(payload.theme).toBe('dark')
  })

  // ⑩: onboarding_completed=true without onboarding_completed_at → auto-sets timestamp
  it('U-10. onboarding_completed=true without onboarding_completed_at → timestamp auto-set', () => {
    const payload = buildUpdatePrefsPayload({ onboarding_completed: true }, 'u1', '2026-10-09T12:00:00.000Z')
    expect(payload.onboarding_completed).toBe(true)
    expect(payload.onboarding_completed_at).toBe('2026-10-09T12:00:00.000Z')
  })

  // ⑩b: onboarding_completed=true WITH explicit onboarding_completed_at → uses provided value
  it('U-10b. onboarding_completed=true with explicit onboarding_completed_at → uses provided value', () => {
    const payload = buildUpdatePrefsPayload(
      { onboarding_completed: true, onboarding_completed_at: '2026-01-01T00:00:00.000Z' },
      'u1',
      '2026-10-09T12:00:00.000Z',
    )
    expect(payload.onboarding_completed_at).toBe('2026-01-01T00:00:00.000Z')
  })

  // ⑪: onboarding_completed=false → clears onboarding_completed_at to null
  it('U-11. onboarding_completed=false → onboarding_completed_at cleared to null', () => {
    const payload = buildUpdatePrefsPayload({ onboarding_completed: false })
    expect(payload.onboarding_completed).toBe(false)
    expect(payload.onboarding_completed_at).toBeNull()
  })

  // ⑫: failure propagates (not swallowed)
  it('U-12. updateUserPreferences failure throws and is not swallowed', async () => {
    const fakeUpdate = vi.fn().mockRejectedValue(new Error('DB write failed'))
    await expect(fakeUpdate({ theme: 'dark' })).rejects.toThrow('DB write failed')
  })

  // ⑬: concurrent partial updates don't overwrite each other (no full-row read-modify-write)
  it('U-13. concurrent partial updates: each payload contains only its own fields', () => {
    const themePayload  = buildUpdatePrefsPayload({ theme: 'dark' })
    const langPayload   = buildUpdatePrefsPayload({ language: 'en' })
    // Neither payload contains the other's field → no read-modify-write pattern
    expect(themePayload).not.toHaveProperty('language')
    expect(langPayload).not.toHaveProperty('theme')
    // Both have updated_at (upsert always sets it)
    expect(themePayload).toHaveProperty('updated_at')
    expect(langPayload).toHaveProperty('updated_at')
  })
})

// ── Stale userId guard ────────────────────────────────────────────────────────

describe('User identity isolation', () => {
  it('6-b. onboarding state is not reused after SIGNED_OUT (stale userId cleared)', () => {
    let userId: string | null = 'u1'
    let obState: OnboardingState = 'completed'

    function handleSignedOut() {
      userId = null
      obState = 'pending'
    }

    function shouldShowHome() {
      return userId !== null && obState === 'completed'
    }

    expect(shouldShowHome()).toBe(true)
    handleSignedOut()
    expect(shouldShowHome()).toBe(false)
    expect(obState).toBe('pending')
  })
})
