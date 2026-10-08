/**
 * Authentication guard helpers for App.tsx.
 *
 * Design contract:
 *   - In DEV (import.meta.env.DEV === true):  skip auth check; start as 'authenticated'
 *     so Playwright visual tests can use direct navigation (?screen=, ?tab=) without a
 *     real Supabase session. import.meta.env.DEV is tree-shaken to `false` by Vite in
 *     production builds, so this branch is absent from the production bundle entirely.
 *
 *   - In PROD (import.meta.env.DEV === false): always resolve auth via getSession().
 *     URL parameters (?screen=, ?tab=) never bypass the auth check.
 *     Protected screens are blocked until 'authenticated' is confirmed.
 */

export type AuthState = 'checking' | 'authenticated' | 'unauthenticated'

export type AuthErrorType = 'expired' | 'invalid' | 'used' | 'network' | 'unknown'

export interface SupabaseAuthError {
  message: string
  code?: string
  status?: number
  name?: string
}

/**
 * Classify a Supabase auth error into a semantic type for UI routing.
 * Prefers error.code / error.status over string matching.
 */
export function classifyAuthError(error: SupabaseAuthError): AuthErrorType {
  const code = error.code ?? ''
  const status = error.status ?? 0
  const msg = (error.message ?? '').toLowerCase()

  if (code === 'otp_expired' || code === 'flow_state_expired') return 'expired'
  if (code === 'flow_state_not_found') return 'used'
  if (code === 'bad_code_verifier') return 'invalid'
  if (code === 'invalid_credentials') return 'invalid'
  if (status === 401 || status === 403) return 'invalid'
  if ((error.status !== undefined && status === 0) || msg.includes('network') || msg.includes('fetch')) return 'network'

  // Fallback string checks
  if (msg.includes('expired')) return 'expired'
  if (msg.includes('invalid')) return 'invalid'

  return 'unknown'
}

export type SessionResult =
  | { user: { id: string; email: string } }
  | { user: null }
  | null

/**
 * Determine the initial AuthState for the current environment.
 *
 * @param isDev - pass `import.meta.env.DEV` (true in development, false in production)
 */
export function resolveInitialAuthState(isDev: boolean): AuthState {
  if (isDev) {
    // Development: skip auth check entirely for Playwright visual tests
    return 'authenticated'
  }
  return 'checking'
}

/**
 * Resolve auth state from a getSession() result (or from an error/missing DB).
 *
 * @param session - result from getSession(), or null when HoneyDB is uninitialized
 * @param error   - true when getSession() threw
 */
export function resolveAuthFromSession(
  session: SessionResult,
  error = false,
): AuthState {
  if (error || session === null || !session.user) {
    return 'unauthenticated'
  }
  return 'authenticated'
}

/**
 * Generation guard: returns true if a pending getSession result should be applied.
 * A newer auth event (which increments the generation counter) should take priority.
 *
 * @param sessionGen   - the generation value captured when getSession was called
 * @param currentGen   - the current authGenRef.current value
 */
export function shouldApplyGetSession(sessionGen: number, currentGen: number): boolean {
  return sessionGen === currentGen
}

export const PUBLIC_SCREENS = [
  'login',
  'signup',
  'password-reset',
  'onboarding-1',
  'onboarding-2',
  'onboarding-3',
] as const

export type PublicScreen = typeof PUBLIC_SCREENS[number]

export function isPublicScreen(screen: string): screen is PublicScreen {
  return (PUBLIC_SCREENS as readonly string[]).includes(screen)
}
