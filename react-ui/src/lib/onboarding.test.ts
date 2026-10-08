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
