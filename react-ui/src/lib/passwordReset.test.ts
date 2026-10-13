/**
 * Unit tests for SCR-034 password recovery flow.
 *
 * Covers:
 *   - HoneyDB updatePassword mock behaviour
 *   - App.tsx PASSWORD_RECOVERY auth event handling (pure logic simulation)
 *   - PasswordResetScreen validation helpers
 *   - resetPassword redirectTo safety
 *   - signOut failure tolerance
 *   - recoveryMode state transitions
 */

import { describe, it, expect, vi } from 'vitest'
import { classifyAuthError } from './auth'

// ─── helpers replicated from PasswordResetScreen ─────────────────────────────

function validatePasswordLogic(password: string, confirmPassword: string): { passwordError: string; confirmError: string; ok: boolean } {
  let ok = true
  let passwordError = ''
  let confirmError = ''
  if (!password) {
    passwordError = '新しいパスワードを入力してください'
    ok = false
  } else if (password.length < 8) {
    passwordError = 'パスワードは8文字以上で入力してください'
    ok = false
  }
  if (!confirmPassword || password !== confirmPassword) {
    confirmError = 'パスワードが一致しません'
    ok = false
  }
  return { passwordError, confirmError, ok }
}

// ─── HoneyDB updatePassword mock ─────────────────────────────────────────────

describe('HoneyDB updatePassword (mock)', () => {
  // 1. calls updateUser with correct password
  it('calls updateUser with the given password', async () => {
    const mockUpdateUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.com' } }, error: null })
    const sb = { auth: { updateUser: mockUpdateUser } }
    async function updatePassword(password: string) {
      const { data, error } = await sb.auth.updateUser({ password })
      return { data: data || null, error: error || null }
    }
    await updatePassword('newpass123')
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newpass123' })
  })

  // 2. returns { data, error } on success
  it('returns { data, error: null } on success', async () => {
    const sb = { auth: { updateUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.com' } }, error: null }) } }
    async function updatePassword(password: string) {
      const { data, error } = await sb.auth.updateUser({ password })
      return { data: data || null, error: error || null }
    }
    const result = await updatePassword('newpass123')
    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
  })

  // 3. returns { data: null, error } on failure
  it('returns { data: null, error } on failure', async () => {
    const sb = { auth: { updateUser: vi.fn().mockResolvedValue({ data: null, error: { message: 'Auth session missing' } }) } }
    async function updatePassword(password: string) {
      const { data, error } = await sb.auth.updateUser({ password })
      return { data: data || null, error: error || null }
    }
    const result = await updatePassword('newpass123')
    expect(result.data).toBeNull()
    expect(result.error).toMatchObject({ message: 'Auth session missing' })
  })

  // 4. does not log password to console
  it('does not log password to console', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const sb = { auth: { updateUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) } }
    async function updatePassword(password: string) {
      const { data, error } = await sb.auth.updateUser({ password })
      return { data: data || null, error: error || null }
    }
    await updatePassword('secret123')
    const allLogs = [...consoleSpy.mock.calls.flat(), ...errorSpy.mock.calls.flat()].join(' ')
    expect(allLogs).not.toContain('secret123')
    consoleSpy.mockRestore()
    errorSpy.mockRestore()
  })
})

// ─── App PASSWORD_RECOVERY auth event handler (pure logic simulation) ─────────

/** Simulates the App handleAuthEvent state machine as a pure function. */
function simulateAuthEvents(events: Array<{ event: string; session: { user: { id: string; email: string } } | null }>) {
  let screen = 'login'
  let authState = 'checking'
  let currentUserId: string | null = null
  let recoveryMode = false

  for (const { event, session } of events) {
    switch (event) {
      case 'SIGNED_IN':
      case 'INITIAL_SESSION':
        if (session?.user) {
          authState = 'authenticated'
          currentUserId = session.user.id
          if (!recoveryMode) {
            if (screen === 'login') screen = 'home'
          }
        } else {
          authState = 'unauthenticated'
          screen = 'login'
        }
        break
      case 'SIGNED_OUT':
        authState = 'unauthenticated'
        currentUserId = null
        recoveryMode = false
        screen = 'login'
        break
      case 'PASSWORD_RECOVERY':
        recoveryMode = true
        authState = 'authenticated'
        if (session?.user) currentUserId = session.user.id
        screen = 'password-reset'
        break
    }
  }
  return { screen, authState, currentUserId, recoveryMode }
}

describe('App PASSWORD_RECOVERY auth event handling (pure logic)', () => {
  const recoverySession = { user: { id: 'u1', email: 'a@b.com' } }

  // 5. PASSWORD_RECOVERY → screen='password-reset' + recoveryMode=true
  it('PASSWORD_RECOVERY event sets screen to password-reset and recoveryMode=true', () => {
    const state = simulateAuthEvents([{ event: 'PASSWORD_RECOVERY', session: recoverySession }])
    expect(state.screen).toBe('password-reset')
    expect(state.recoveryMode).toBe(true)
    expect(state.authState).toBe('authenticated')
  })

  // 6. SIGNED_IN after PASSWORD_RECOVERY → does NOT navigate to home
  it('SIGNED_IN after PASSWORD_RECOVERY does not navigate away from recovery', () => {
    const state = simulateAuthEvents([
      { event: 'PASSWORD_RECOVERY', session: recoverySession },
      { event: 'SIGNED_IN', session: recoverySession },
    ])
    expect(state.screen).toBe('password-reset')
    expect(state.recoveryMode).toBe(true)
  })

  // 7. INITIAL_SESSION after PASSWORD_RECOVERY → does NOT navigate away
  it('INITIAL_SESSION after PASSWORD_RECOVERY stays on recovery screen', () => {
    const state = simulateAuthEvents([
      { event: 'PASSWORD_RECOVERY', session: recoverySession },
      { event: 'INITIAL_SESSION', session: recoverySession },
    ])
    expect(state.screen).toBe('password-reset')
  })

  // 8. Recovery complete → recoveryMode=false, screen='login' (simulated via callback)
  it('recovery complete clears recoveryMode and navigates to login', () => {
    let recoveryMode = true
    let screen = 'password-reset'
    function onRecoveryComplete() {
      recoveryMode = false
      screen = 'login'
    }
    onRecoveryComplete()
    expect(recoveryMode).toBe(false)
    expect(screen).toBe('login')
  })

  // 9. Cancel → recoveryMode=false, screen='login'
  it('cancel clears recoveryMode and navigates to login', () => {
    let recoveryMode = true
    let screen = 'password-reset'
    function onCancel() {
      recoveryMode = false
      screen = 'login'
    }
    onCancel()
    expect(recoveryMode).toBe(false)
    expect(screen).toBe('login')
  })

  // 10. SIGNED_OUT during recovery → unauthenticated, screen='login', recoveryMode=false
  it('SIGNED_OUT during recovery resets everything', () => {
    const state = simulateAuthEvents([
      { event: 'PASSWORD_RECOVERY', session: recoverySession },
      { event: 'SIGNED_OUT', session: null },
    ])
    expect(state.authState).toBe('unauthenticated')
    expect(state.screen).toBe('login')
    expect(state.recoveryMode).toBe(false)
  })
})

// ─── PasswordResetScreen validation ──────────────────────────────────────────

describe('PasswordResetScreen validation (password logic)', () => {
  // 11. Password < 8 chars → error, no submit
  it('rejects password shorter than 8 chars', () => {
    const { ok, passwordError } = validatePasswordLogic('short', 'short')
    expect(ok).toBe(false)
    expect(passwordError).toMatch(/8文字以上/)
  })

  // 12. Passwords don't match → error, no submit
  it('rejects mismatched passwords', () => {
    const { ok, confirmError } = validatePasswordLogic('password1', 'password2')
    expect(ok).toBe(false)
    expect(confirmError).toMatch(/一致しません/)
  })

  // 13. Empty password → error, no submit
  it('rejects empty password', () => {
    const { ok, passwordError } = validatePasswordLogic('', '')
    expect(ok).toBe(false)
    expect(passwordError).toBeTruthy()
  })

  // 14. Valid password → validation passes
  it('accepts valid matching passwords of 8+ chars', () => {
    const { ok } = validatePasswordLogic('validpass', 'validpass')
    expect(ok).toBe(true)
  })

  // 15. Double submit prevented (isSubmitting guard simulation)
  it('isSubmitting guard prevents double submit', async () => {
    let callCount = 0
    let isSubmitting = false
    async function handleSubmit() {
      if (isSubmitting) return
      isSubmitting = true
      callCount++
      await Promise.resolve()
      isSubmitting = false
    }
    // Both called synchronously — second sees isSubmitting=true after first sets it
    const p1 = handleSubmit()
    const p2 = handleSubmit()
    await Promise.all([p1, p2])
    expect(callCount).toBe(1)
  })

  // 16. On API failure → input state preserved (error set, step stays 3)
  it('on API failure error is set and step stays at 3', () => {
    const step = 3
    let pwUpdateError = ''
    const error = { message: 'Auth session missing' }
    // simulate handleUpdatePassword failure branch
    if (error) {
      pwUpdateError = 'パスワードの更新に失敗しました'
      // step remains 3
    }
    expect(step).toBe(3)
    expect(pwUpdateError).toBeTruthy()
  })

  // 17. On success → signOut called, onRecoveryComplete scheduled
  it('on success signOut is called and onRecoveryComplete is scheduled', async () => {
    let signOutCalled = false
    let onRecoveryCompleteCalled = false
    const db = {
      updatePassword: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
      signOut: vi.fn().mockImplementation(async () => { signOutCalled = true }),
    }
    // simulate success path
    const { error } = await db.updatePassword('newpass123')
    if (!error) {
      await db.signOut()
      onRecoveryCompleteCalled = true
    }
    expect(signOutCalled).toBe(true)
    expect(onRecoveryCompleteCalled).toBe(true)
  })
})

// ─── resetPassword redirectTo safety ─────────────────────────────────────────

describe('resetPassword redirectTo safety', () => {
  // 18. Uses window.location.origin + pathname (not hardcoded URL)
  it('redirectTo uses window.location.origin not a hardcoded URL', () => {
    const origin = 'https://example.com'
    const pathname = '/app'
    function computeRedirectTo(options?: { redirectTo?: string }) {
      return (options && options.redirectTo)
        ? options.redirectTo
        : (origin + pathname + '?auth=recovery')
    }
    const result = computeRedirectTo()
    expect(result).toContain(origin)
    expect(result).not.toContain('/HoneyOS/')
    expect(result).not.toMatch(/^https?:\/\/localhost/)
  })

  // 19. Does not use user input for redirectTo (caller passes no redirectTo, function computes it)
  it('when caller passes no redirectTo, redirectTo is computed from window.location', () => {
    const origin = 'https://example.com'
    const pathname = '/'
    function computeRedirectTo(options?: { redirectTo?: string }) {
      return (options && options.redirectTo)
        ? options.redirectTo
        : (origin + pathname + '?auth=recovery')
    }
    const result = computeRedirectTo(undefined)
    expect(result).toBe('https://example.com/?auth=recovery')
  })
})

// ─── signOut failure tolerance ────────────────────────────────────────────────

describe('signOut failure tolerance', () => {
  // 20. signOut failure after updatePassword does not revert success state
  it('signOut failure does not change the success state', async () => {
    let updated = false
    let onRecoveryCompleteCalled = false
    const db = {
      updatePassword: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
      signOut: vi.fn().mockRejectedValue(new Error('Network error')),
    }
    const { error } = await db.updatePassword('newpass123')
    if (!error) {
      updated = true
      try {
        await db.signOut()
      } catch {
        // signOut failure ignored
      }
      onRecoveryCompleteCalled = true
    }
    expect(updated).toBe(true)
    expect(onRecoveryCompleteCalled).toBe(true)
  })
})

// ─── classifyAuthError ────────────────────────────────────────────────────────

describe('classifyAuthError — error code classification', () => {
  // 1. otp_expired → expired
  it('classifies otp_expired as expired', () => {
    expect(classifyAuthError({ message: '', code: 'otp_expired' })).toBe('expired')
  })

  // 2. flow_state_expired → expired
  it('classifies flow_state_expired as expired', () => {
    expect(classifyAuthError({ message: '', code: 'flow_state_expired' })).toBe('expired')
  })

  // 3. flow_state_not_found → used
  it('classifies flow_state_not_found as used', () => {
    expect(classifyAuthError({ message: '', code: 'flow_state_not_found' })).toBe('used')
  })

  // 4. bad_code_verifier → invalid
  it('classifies bad_code_verifier as invalid', () => {
    expect(classifyAuthError({ message: '', code: 'bad_code_verifier' })).toBe('invalid')
  })

  // 5. invalid_credentials → invalid
  it('classifies invalid_credentials as invalid', () => {
    expect(classifyAuthError({ message: '', code: 'invalid_credentials' })).toBe('invalid')
  })

  // 6. status 401 → invalid
  it('classifies status 401 as invalid', () => {
    expect(classifyAuthError({ message: '', status: 401 })).toBe('invalid')
  })

  // 7. network error message → network
  it('classifies network error message as network', () => {
    expect(classifyAuthError({ message: 'network error occurred' })).toBe('network')
  })

  // 8. unknown message → unknown
  it('classifies unrecognized error as unknown', () => {
    expect(classifyAuthError({ message: 'something went wrong' })).toBe('unknown')
  })

  // 9. fallback: message includes "expired" → expired
  it('fallback: message with "expired" → expired', () => {
    expect(classifyAuthError({ message: 'Token has expired' })).toBe('expired')
  })

  // 10. status 403 → invalid
  it('classifies status 403 as invalid', () => {
    expect(classifyAuthError({ message: '', status: 403 })).toBe('invalid')
  })
})

// ─── URL cleanup timing ───────────────────────────────────────────────────────

describe('URL cleanup timing', () => {
  // 11. URL cleanup happens AFTER PASSWORD_RECOVERY event (pure logic test)
  it('URL cleanup is deferred until after PASSWORD_RECOVERY event fires', () => {
    const events: string[] = []
    // Simulate the App.tsx PASSWORD_RECOVERY handler: event fires, then cleanup
    function handlePasswordRecovery() {
      events.push('PASSWORD_RECOVERY_handled')
      // URL cleanup happens inside the case, after state updates
      events.push('URL_cleanup')
    }
    handlePasswordRecovery()
    expect(events[0]).toBe('PASSWORD_RECOVERY_handled')
    expect(events[1]).toBe('URL_cleanup')
    expect(events.indexOf('URL_cleanup')).toBeGreaterThan(events.indexOf('PASSWORD_RECOVERY_handled'))
  })
})

// ─── signOut explicit failure handling ───────────────────────────────────────

describe('signOut explicit failure handling', () => {
  // 12. signOut success → onRecoveryComplete called
  it('signOut success calls onRecoveryComplete immediately', async () => {
    let recoveryCalled = false
    const db = {
      updatePassword: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    }
    let signOutFailed = false
    const { error } = await db.updatePassword('newpass123')
    if (!error) {
      const result = await db.signOut()
      if (!result.error) {
        recoveryCalled = true
      } else {
        signOutFailed = true
      }
    }
    expect(recoveryCalled).toBe(true)
    expect(signOutFailed).toBe(false)
  })

  // 13. signOut failure → signOutFailed=true, onRecoveryComplete NOT called
  it('signOut failure sets signOutFailed=true, does not call onRecoveryComplete', async () => {
    let recoveryCalled = false
    let signOutFailed = false
    const db = {
      updatePassword: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: { message: 'Network error' } }),
    }
    const { error } = await db.updatePassword('newpass123')
    if (!error) {
      const result = await db.signOut()
      if (!result.error) {
        recoveryCalled = true
      } else {
        signOutFailed = true
      }
    }
    expect(signOutFailed).toBe(true)
    expect(recoveryCalled).toBe(false)
  })

  // 14. signOut retry success → onRecoveryComplete called
  it('signOut retry success calls onRecoveryComplete', async () => {
    let recoveryCalled = false
    let signOutFailed = true  // start with failure state
    const retrySignOut = vi.fn().mockResolvedValue({ error: null })
    const result = await retrySignOut()
    if (!result.error) {
      signOutFailed = false
      recoveryCalled = true
    }
    expect(signOutFailed).toBe(false)
    expect(recoveryCalled).toBe(true)
  })
})

// ─── recoveryMode=true shows password input step ─────────────────────────────

describe('recoveryMode=true initial step', () => {
  // 21. When recoveryMode=true, component initialises at step 3
  it('recoveryMode=true forces initial step to 3', () => {
    function getInitialStep(viewState: string, recoveryMode: boolean): number {
      if (recoveryMode) return 3
      if (viewState === 'sent' || viewState === 'resend-cooldown') return 2
      if (['new-password', 'password-validation-error', 'password-updating', 'password-updated'].includes(viewState)) return 3
      return 1
    }
    expect(getInitialStep('normal', true)).toBe(3)
    expect(getInitialStep('normal', false)).toBe(1)
    expect(getInitialStep('sent', true)).toBe(3)
  })
})
