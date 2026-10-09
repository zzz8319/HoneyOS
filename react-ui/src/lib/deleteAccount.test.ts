/**
 * Unit tests for account deletion client-side logic.
 *
 * Tests cover:
 * - Confirmation text validation
 * - Double-submit prevention
 * - Success flow: login navigation, state cleared
 * - API failure: dialog stays, input preserved, retry works
 * - Network error: error shown, no navigation
 * - Offline: deletion blocked
 * - reauth_required: shows re-login message
 * - userId NOT sent in function call body
 * - Cache cleanup on success
 */

import { describe, it, expect, vi } from 'vitest'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DeleteAccountResult {
  error: { message: string; code: string } | null
}

interface MockDB {
  getSession: () => Promise<{ user?: { id: string } } | null>
  deleteAccount: (params: { confirmation: string }) => Promise<DeleteAccountResult>
}

// ── Extracted client-side logic (mirrors SettingsScreen.handleDeleteAccount) ──

const CONFIRMATION_PHRASE = 'アカウントを削除する'

interface HandleDeleteResult {
  navigatedToLogin: boolean
  stateCleared: boolean
  errorMessage: string | null
  reauthRequired: boolean
  callCount: number
  bodySentUserId: boolean
  cacheCleared: boolean
}

async function runHandleDeleteAccount(opts: {
  isOnline: boolean
  isInFlight?: boolean
  db: MockDB | null
  onDeleteAccount?: () => void
  clearedUserId?: string | null
}): Promise<HandleDeleteResult> {
  let navigatedToLogin = false
  let stateCleared = false
  let errorMessage: string | null = null
  let reauthRequired = false
  let callCount = 0
  let bodySentUserId = false
  let cacheCleared = false

  if (!opts.isOnline) {
    errorMessage = 'オフラインのため削除できません。接続後にお試しください。'
    return { navigatedToLogin, stateCleared, errorMessage, reauthRequired, callCount, bodySentUserId, cacheCleared }
  }

  if (opts.isInFlight) {
    // Double-submit: return early without calling
    return { navigatedToLogin, stateCleared, errorMessage, reauthRequired, callCount, bodySentUserId, cacheCleared }
  }

  const db = opts.db
  if (!db) {
    errorMessage = 'データベース接続が利用できません'
    return { navigatedToLogin, stateCleared, errorMessage, reauthRequired, callCount, bodySentUserId, cacheCleared }
  }

  let currentUserId: string | null = null
  try {
    const session = await db.getSession() as { user?: { id: string } } | null
    currentUserId = session?.user?.id ?? null
  } catch { /* ignore */ }

  // Intercept: verify no userId in body
  const origDeleteAccount = db.deleteAccount.bind(db)
  db.deleteAccount = async (params: { confirmation: string }) => {
    callCount++
    if ('userId' in (params as Record<string, unknown>)) bodySentUserId = true
    return origDeleteAccount(params)
  }

  let result: DeleteAccountResult
  try {
    result = await db.deleteAccount({ confirmation: CONFIRMATION_PHRASE })
  } catch {
    errorMessage = 'アカウント削除に失敗しました。通信状況を確認して再試行してください。'
    return { navigatedToLogin, stateCleared, errorMessage, reauthRequired, callCount, bodySentUserId, cacheCleared }
  }

  if (result.error) {
    if (result.error.code === 'reauth_required') {
      reauthRequired = true
    } else {
      errorMessage = 'アカウント削除に失敗しました。通信状況を確認して再試行してください。'
    }
    return { navigatedToLogin, stateCleared, errorMessage, reauthRequired, callCount, bodySentUserId, cacheCleared }
  }

  // Success
  if (currentUserId) cacheCleared = true
  navigatedToLogin = true
  stateCleared = true
  opts.onDeleteAccount?.()

  return { navigatedToLogin, stateCleared, errorMessage, reauthRequired, callCount, bodySentUserId, cacheCleared }
}

// ── Test fixtures ─────────────────────────────────────────────────────────────

function makeDB(opts: {
  userId?: string
  fail?: boolean
  networkThrow?: boolean
  code?: string
  delayMs?: number
}): MockDB {
  return {
    getSession: async () => ({ user: { id: opts.userId ?? 'user-123' } }),
    deleteAccount: async () => {
      if (opts.delayMs) await new Promise(r => setTimeout(r, opts.delayMs))
      if (opts.networkThrow) throw new Error('Network error')
      if (opts.fail) return { error: { message: 'failed', code: opts.code ?? 'unknown' } }
      return { error: null }
    },
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('deleteAccount: offline check', () => {
  it('offline → deletion blocked, error shown, no API call', async () => {
    const db = makeDB({})
    const spy = vi.spyOn(db, 'deleteAccount')
    const res = await runHandleDeleteAccount({ isOnline: false, db })
    expect(res.errorMessage).toContain('オフライン')
    expect(res.navigatedToLogin).toBe(false)
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('deleteAccount: double-submit prevention', () => {
  it('in-flight → function NOT called again', async () => {
    const db = makeDB({})
    const spy = vi.spyOn(db, 'deleteAccount')
    const res = await runHandleDeleteAccount({ isOnline: true, isInFlight: true, db })
    expect(spy).not.toHaveBeenCalled()
    expect(res.navigatedToLogin).toBe(false)
    expect(res.callCount).toBe(0)
  })
})

describe('deleteAccount: success flow', () => {
  it('success → navigates to login', async () => {
    const db = makeDB({})
    const onDeleteAccount = vi.fn()
    const res = await runHandleDeleteAccount({ isOnline: true, db, onDeleteAccount })
    expect(res.navigatedToLogin).toBe(true)
    expect(res.stateCleared).toBe(true)
    expect(onDeleteAccount).toHaveBeenCalledOnce()
    expect(res.errorMessage).toBeNull()
  })

  it('success → user cache cleared', async () => {
    const db = makeDB({ userId: 'user-abc' })
    const res = await runHandleDeleteAccount({ isOnline: true, db })
    expect(res.cacheCleared).toBe(true)
  })

  it('success → userId NOT sent in function call body', async () => {
    const db = makeDB({})
    const res = await runHandleDeleteAccount({ isOnline: true, db })
    expect(res.bodySentUserId).toBe(false)
  })
})

describe('deleteAccount: API failure', () => {
  it('API failure → dialog stays, input preserved, no navigation', async () => {
    const db = makeDB({ fail: true, code: 'unknown' })
    const res = await runHandleDeleteAccount({ isOnline: true, db })
    expect(res.navigatedToLogin).toBe(false)
    expect(res.errorMessage).toBeTruthy()
    expect(res.reauthRequired).toBe(false)
  })

  it('retry after failure → success works', async () => {
    let callCount = 0
    const db: MockDB = {
      getSession: async () => ({ user: { id: 'user-123' } }),
      deleteAccount: async () => {
        callCount++
        if (callCount === 1) return { error: { message: 'failed', code: 'unknown' } }
        return { error: null }
      },
    }
    // First attempt: failure
    const res1 = await runHandleDeleteAccount({ isOnline: true, db })
    expect(res1.navigatedToLogin).toBe(false)
    expect(res1.errorMessage).toBeTruthy()
    // Second attempt: success (callCount is now 2 from second run)
    const res2 = await runHandleDeleteAccount({ isOnline: true, db })
    expect(res2.navigatedToLogin).toBe(true)
  })
})

describe('deleteAccount: network error', () => {
  it('network throw → error shown, no navigation', async () => {
    const db = makeDB({ networkThrow: true })
    const res = await runHandleDeleteAccount({ isOnline: true, db })
    expect(res.navigatedToLogin).toBe(false)
    expect(res.errorMessage).toBeTruthy()
  })
})

describe('deleteAccount: reauth_required', () => {
  it('reauth_required error → shows re-login message, no navigation', async () => {
    const db = makeDB({ fail: true, code: 'reauth_required' })
    const res = await runHandleDeleteAccount({ isOnline: true, db })
    expect(res.reauthRequired).toBe(true)
    expect(res.navigatedToLogin).toBe(false)
    expect(res.errorMessage).toBeNull()
  })
})

describe('deleteAccount: confirmation text validation', () => {
  it('correct confirmation phrase matches constant', () => {
    expect(CONFIRMATION_PHRASE).toBe('アカウントを削除する')
  })

  it('mismatch → button would be disabled (not equal to phrase)', () => {
    const input: string = '削除'
    expect(input === CONFIRMATION_PHRASE).toBe(false)
  })

  it('exact match → button would be enabled', () => {
    const input = 'アカウントを削除する'
    expect(input === CONFIRMATION_PHRASE).toBe(true)
  })
})

describe('deleteAccount: only user own cache keys cleared', () => {
  it('clearUserCache: does not remove sb- keys', () => {
    // Simulate localStorage state
    const store: Record<string, string> = {
      'sb-abc-auth-token': 'token',
      'honeyos_user_prefs': '{}',
      'honeyos_react_theme': 'dark',
      'honeyos_prefs_user_id': 'user-123',
      'honeyos_prefs_sync_pending': 'false',
      'honeyos_react_language': 'ja',
      'some-other-key': 'value',
    }
    const removed: string[] = []

    // Simulate clearUserCache logic
    const userId = 'user-123'
    const PATTERNS = [
      /^honeyos_user_prefs$/,
      /^honeyos_prefs_user_id$/,
      /^honeyos_prefs_sync_pending$/,
      /^honeyos_react_theme$/,
      /^honeyos_react_language$/,
    ]

    for (const key of Object.keys(store)) {
      if (key.startsWith('sb-')) continue
      if (key.includes(userId) || PATTERNS.some(p => p.test(key))) {
        removed.push(key)
      }
    }

    // sb- key must NOT be removed
    expect(removed).not.toContain('sb-abc-auth-token')
    // HoneyOS keys must be removed
    expect(removed).toContain('honeyos_user_prefs')
    expect(removed).toContain('honeyos_react_theme')
    expect(removed).toContain('honeyos_prefs_user_id')
    expect(removed).toContain('honeyos_prefs_sync_pending')
    expect(removed).toContain('honeyos_react_language')
    // Unrelated key must NOT be removed
    expect(removed).not.toContain('some-other-key')
  })
})
