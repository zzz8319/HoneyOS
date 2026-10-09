/**
 * clearUserCache
 *
 * Removes localStorage keys that belong to the given user.
 *
 * Keys cleared (from supabase_client.js and SettingsScreen.tsx):
 *   - honeyos_user_prefs           (cached user preferences blob)
 *   - honeyos_prefs_user_id        (cached user id sentinel)
 *   - honeyos_prefs_sync_pending   (pending pref sync flag)
 *   - honeyos_react_theme          (cached theme value — legacy key)
 *   - honeyos_react_language       (cached language value — legacy key)
 *
 * Keys that match `userId` anywhere in the key name are also cleared,
 * which handles any future per-user prefixed keys.
 *
 * NEVER removes keys starting with 'sb-' (Supabase internal auth storage).
 * NEVER removes other users' data.
 */

/** Known HoneyOS-owned localStorage key prefixes and exact names. */
const HONEYOS_KEY_PATTERNS: RegExp[] = [
  /^honeyos_user_prefs$/,
  /^honeyos_prefs_user_id$/,
  /^honeyos_prefs_sync_pending$/,
  /^honeyos_react_theme$/,
  /^honeyos_react_language$/,
]

/**
 * Returns true if the given localStorage key belongs to this user and should
 * be cleared on account deletion.
 *
 * Rules:
 * 1. Never clear Supabase internal keys (sb-* prefix).
 * 2. Clear keys whose name contains the userId (per-user prefixed keys).
 * 3. Clear known HoneyOS keys that are shared but user-session-scoped.
 */
function isUserOwnedCacheKey(key: string, userId: string): boolean {
  // Rule 1: Never remove Supabase internal auth storage
  if (key.startsWith('sb-')) return false

  // Rule 2: Keys containing the userId are user-specific
  if (userId && key.includes(userId)) return true

  // Rule 3: Known HoneyOS keys
  return HONEYOS_KEY_PATTERNS.some(p => p.test(key))
}

/**
 * Clears all localStorage keys that belong to the given user.
 *
 * @param userId - The authenticated user's ID (from verified JWT)
 */
export function clearUserCache(userId: string): void {
  const keysToRemove: string[] = []

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && isUserOwnedCacheKey(key, userId)) {
        keysToRemove.push(key)
      }
    }
  } catch {
    // localStorage may be unavailable (private mode, blocked)
    return
  }

  keysToRemove.forEach(k => {
    try {
      localStorage.removeItem(k)
    } catch {
      // Ignore individual key removal failures
    }
  })
}
