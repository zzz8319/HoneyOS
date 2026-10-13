import { describe, it, expect } from 'vitest'
import {
  resolveInitialAuthState,
  resolveAuthFromSession,
  isPublicScreen,
  PUBLIC_SCREENS,
} from './auth'

// ── resolveInitialAuthState ─────────────────────────────────────────────────

describe('resolveInitialAuthState', () => {
  // 1. production初期状態はchecking
  it('returns checking in production (isDev=false)', () => {
    expect(resolveInitialAuthState(false)).toBe('checking')
  })

  // 2. development初期状態はauthenticated
  it('returns authenticated in development (isDev=true)', () => {
    expect(resolveInitialAuthState(true)).toBe('authenticated')
  })

  // 3. productionでは?screen=があっても認証確認が必要 (isDev=false→checking)
  it('production: ignores URL params — always returns checking', () => {
    // The caller in App.tsx always passes import.meta.env.DEV.
    // Even if ?screen= or ?tab= is present in the URL, isDev is false in prod,
    // so the initial state is always 'checking'.
    expect(resolveInitialAuthState(false)).toBe('checking')
  })

  // 4. productionではtabパラメータがあっても認証確認が必要
  it('production: tab param does not change initial state from checking', () => {
    expect(resolveInitialAuthState(false)).toBe('checking')
  })
})

// ── resolveAuthFromSession ──────────────────────────────────────────────────

describe('resolveAuthFromSession', () => {
  // 5. productionでsessionあり→authenticated
  it('returns authenticated when session has a user', () => {
    const session = { user: { id: 'u1', email: 'a@b.com' } }
    expect(resolveAuthFromSession(session)).toBe('authenticated')
  })

  // 6. productionでsessionなし→unauthenticated
  it('returns unauthenticated when session is null', () => {
    expect(resolveAuthFromSession(null)).toBe('unauthenticated')
  })

  // 7. session.user が null → unauthenticated
  it('returns unauthenticated when session.user is null', () => {
    expect(resolveAuthFromSession({ user: null })).toBe('unauthenticated')
  })

  // 8. getSession失敗(error=true)→unauthenticated
  it('returns unauthenticated when error=true', () => {
    const session = { user: { id: 'u1', email: 'a@b.com' } }
    expect(resolveAuthFromSession(session, true)).toBe('unauthenticated')
  })

  // 9. HoneyDB未初期化(session=null, no error)→unauthenticated
  it('returns unauthenticated when HoneyDB is not initialized (session=null)', () => {
    expect(resolveAuthFromSession(null, false)).toBe('unauthenticated')
  })
})

// ── isPublicScreen ──────────────────────────────────────────────────────────

describe('isPublicScreen', () => {
  // 10. login, signup, password-reset, onboarding-1/2/3 → public
  it.each(PUBLIC_SCREENS)('"%s" is a public screen', (screen) => {
    expect(isPublicScreen(screen)).toBe(true)
  })

  // 11. protected screens → not public (checking中は描画しない対象)
  it.each([
    'home',
    'settings',
    'colony-detail',
    'inspection-record',
    'work-history',
    'report',
    'farms',
    'work',
    'sensor-detail',
    'sensor-graph',
    'notification-center',
  ])('"%s" is a protected screen (not public)', (screen) => {
    expect(isPublicScreen(screen)).toBe(false)
  })
})
