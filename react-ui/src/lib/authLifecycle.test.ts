/**
 * Unit tests for auth lifecycle helpers.
 *
 * Tests the generation guard, event-handling logic (via resolveAuthFromSession
 * on event payloads), onAuthStateChange mock interface, and cleanup semantics.
 */

import { describe, it, expect, vi } from 'vitest'
import { resolveAuthFromSession, shouldApplyGetSession } from './auth'
import type { AuthChangeEvent, AuthSession, AuthStateChangeCallback, Unsubscribe } from './db'

// ── shouldApplyGetSession ────────────────────────────────────────────────────

describe('shouldApplyGetSession (generation guard)', () => {
  // 1. same generation → apply
  it('returns true when sessionGen === currentGen', () => {
    expect(shouldApplyGetSession(1, 1)).toBe(true)
  })

  // 2. old getSession result should not overwrite newer SIGNED_IN
  it('returns false when sessionGen < currentGen (SIGNED_IN arrived)', () => {
    expect(shouldApplyGetSession(1, 2)).toBe(false)
  })

  // 3. old getSession result should not overwrite newer SIGNED_OUT
  it('returns false when sessionGen < currentGen (SIGNED_OUT arrived)', () => {
    expect(shouldApplyGetSession(1, 3)).toBe(false)
  })

  // 4. generation 0 is never current once incremented
  it('returns false for gen 0 when current is 1', () => {
    expect(shouldApplyGetSession(0, 1)).toBe(false)
  })

  // 5. large generation delta
  it('returns false for large generation delta', () => {
    expect(shouldApplyGetSession(1, 99)).toBe(false)
  })
})

// ── resolveAuthFromSession with event-like sessions ─────────────────────────

describe('resolveAuthFromSession — event-mapped scenarios', () => {
  // 6. SIGNED_IN session → authenticated
  it('SIGNED_IN with valid user → authenticated', () => {
    const session: AuthSession = { user: { id: 'u1', email: 'a@b.com' } }
    expect(resolveAuthFromSession(session)).toBe('authenticated')
  })

  // 7. SIGNED_OUT (null session) → unauthenticated
  it('SIGNED_OUT null session → unauthenticated', () => {
    expect(resolveAuthFromSession(null)).toBe('unauthenticated')
  })

  // 8. TOKEN_REFRESHED keeps authenticated (session has user)
  it('TOKEN_REFRESHED session with user → authenticated', () => {
    const session: AuthSession = { user: { id: 'u2', email: 'b@c.com' }, access_token: 'new-token' }
    expect(resolveAuthFromSession(session)).toBe('authenticated')
  })

  // 9. USER_UPDATED keeps authenticated
  it('USER_UPDATED session with user → authenticated', () => {
    const session: AuthSession = { user: { id: 'u3', email: 'c@d.com' } }
    expect(resolveAuthFromSession(session)).toBe('authenticated')
  })

  // 10. INITIAL_SESSION with valid user → authenticated
  it('INITIAL_SESSION with valid user → authenticated', () => {
    const session: AuthSession = { user: { id: 'u4', email: 'd@e.com' } }
    expect(resolveAuthFromSession(session)).toBe('authenticated')
  })

  // 11. INITIAL_SESSION with null user → unauthenticated
  it('INITIAL_SESSION with null user → unauthenticated', () => {
    const session: AuthSession = { user: null }
    expect(resolveAuthFromSession(session)).toBe('unauthenticated')
  })
})

// ── PASSWORD_RECOVERY: no navigation to home/login ──────────────────────────

describe('PASSWORD_RECOVERY event', () => {
  // 12. PASSWORD_RECOVERY should not resolve to 'authenticated'
  it('does not yield authenticated without a valid session user', () => {
    // During PASSWORD_RECOVERY, the app should not navigate to home or login based
    // purely on the resolved session. The event is handled separately.
    // If the session has no user (common in password recovery), resolveAuthFromSession
    // returns unauthenticated — App.tsx's handleAuthEvent handles this specially.
    const session: AuthSession = { user: null }
    expect(resolveAuthFromSession(session)).toBe('unauthenticated')
  })
})

// ── onAuthStateChange mock interface ────────────────────────────────────────

interface MockHoneyDB {
  onAuthStateChange(callback: AuthStateChangeCallback): Unsubscribe
}

function createMockDB(): MockHoneyDB & { trigger: (event: AuthChangeEvent, session: AuthSession | null) => void } {
  let _callback: AuthStateChangeCallback | null = null
  return {
    onAuthStateChange(cb) {
      _callback = cb
      return () => { _callback = null }
    },
    trigger(event, session) {
      _callback?.(event, session)
    },
  }
}

describe('onAuthStateChange mock interface', () => {
  // 13. callback is invoked on SIGNED_IN
  it('callback fires on SIGNED_IN event', () => {
    const db = createMockDB()
    const received: Array<{ event: AuthChangeEvent; session: AuthSession | null }> = []
    db.onAuthStateChange((e, s) => received.push({ event: e, session: s }))
    const session: AuthSession = { user: { id: 'u1', email: 'a@b.com' } }
    db.trigger('SIGNED_IN', session)
    expect(received).toHaveLength(1)
    expect(received[0].event).toBe('SIGNED_IN')
    expect(received[0].session?.user?.id).toBe('u1')
  })

  // 14. callback is invoked on SIGNED_OUT
  it('callback fires on SIGNED_OUT event', () => {
    const db = createMockDB()
    const events: AuthChangeEvent[] = []
    db.onAuthStateChange((e) => events.push(e))
    db.trigger('SIGNED_OUT', null)
    expect(events).toContain('SIGNED_OUT')
  })

  // 15. unsubscribe prevents further callbacks
  it('unsubscribe stops callback from firing', () => {
    const db = createMockDB()
    const events: AuthChangeEvent[] = []
    const unsubscribe = db.onAuthStateChange((e) => events.push(e))
    unsubscribe()
    db.trigger('SIGNED_IN', { user: { id: 'u1', email: 'a@b.com' } })
    expect(events).toHaveLength(0)
  })

  // 16. StrictMode subscribe/unsubscribe/subscribe sequence works
  it('StrictMode: second subscription after unsubscribe still fires', () => {
    const db = createMockDB()
    const events: AuthChangeEvent[] = []
    // First mount
    const unsub1 = db.onAuthStateChange((e) => events.push(e))
    unsub1()
    // Second mount (StrictMode re-mount)
    db.onAuthStateChange((e) => events.push(e))
    db.trigger('TOKEN_REFRESHED', { user: { id: 'u1', email: 'a@b.com' } })
    expect(events).toContain('TOKEN_REFRESHED')
  })

  // 17. Unmount cleanup: cancelled flag prevents state update
  it('cancelled flag prevents callback execution', () => {
    let cancelled = false
    const db = createMockDB()
    const invocations: string[] = []
    const unsubscribe = db.onAuthStateChange((event) => {
      if (cancelled) return
      invocations.push(event)
    })
    cancelled = true
    unsubscribe()
    db.trigger('SIGNED_IN', { user: { id: 'u1', email: 'a@b.com' } })
    expect(invocations).toHaveLength(0)
  })

  // 18. Callback errors don't propagate (mirroring supabase_client.js swallowing)
  it('callback errors are swallowed by the mock (subscription stays alive)', () => {
    let _callback: AuthStateChangeCallback | null = null
    const safeDB: MockHoneyDB & { trigger: (e: AuthChangeEvent, s: AuthSession | null) => void } = {
      onAuthStateChange(cb) {
        _callback = cb
        return () => { _callback = null }
      },
      trigger(event, session) {
        try {
          _callback?.(event, session)
        } catch {
          // swallow — mirroring supabase_client.js behaviour
        }
      },
    }
    const throwingCb = vi.fn().mockImplementation(() => { throw new Error('callback error') })
    safeDB.onAuthStateChange(throwingCb)
    expect(() => safeDB.trigger('SIGNED_IN', { user: { id: 'u', email: 'e@e.com' } })).not.toThrow()
    expect(throwingCb).toHaveBeenCalledOnce()
    // Second event still fires despite previous error
    expect(() => safeDB.trigger('SIGNED_OUT', null)).not.toThrow()
    expect(throwingCb).toHaveBeenCalledTimes(2)
  })
})
