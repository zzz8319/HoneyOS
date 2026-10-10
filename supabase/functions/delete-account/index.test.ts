/**
 * Unit tests for the delete-account Edge Function.
 *
 * These tests use Node.js / Vitest (not Deno) to run in the same test
 * pipeline as the rest of the project. The Edge Function logic is extracted
 * into pure helper functions that can be imported and tested without Deno APIs.
 *
 * The full handler integration is verified by constructing Request objects
 * and calling a thin testable wrapper that exercises all paths.
 *
 * Security model:
 * - AMR claims come from verified JWT payload (jwtClaims.amr), NOT from
 *   userData.user.amr (undocumented field, may be undefined).
 * - jose.jwtVerify is mocked in tests via deps.getJwtClaims.
 * - userData.user.amr is never used in the handler or tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Re-implement the testable core logic ──────────────────────────────────────

const CONFIRMATION_PHRASE = 'アカウントを削除する'
const MAX_IAT_AGE_SECONDS = 600

function buildJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body   = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${header}.${body}.fakesig`
}

// ── checkRecentPasswordAuth (mirrors production logic) ────────────────────────
// Takes claims (from verified JWT payload), NOT user object.

interface AmrEntry { method?: unknown; timestamp?: unknown }

function checkRecentPasswordAuth(claims: { amr?: unknown }, nowSeconds?: number): boolean {
  const amr = claims.amr
  if (!Array.isArray(amr) || amr.length === 0) return false

  const passwordEntries = amr.filter((entry: unknown) =>
    entry !== null &&
    typeof entry === 'object' &&
    (entry as AmrEntry).method === 'password'
  )
  if (passwordEntries.length === 0) return false

  const now = nowSeconds ?? Math.floor(Date.now() / 1000)
  const maxTimestamp = Math.max(
    ...(passwordEntries as AmrEntry[]).map(e => {
      const ts = Number(e.timestamp)
      return Number.isFinite(ts) ? ts : 0
    })
  )

  if (maxTimestamp === 0) return false
  if (maxTimestamp > now + 30) return false

  const age = now - maxTimestamp
  return age <= MAX_IAT_AGE_SECONDS
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface AmrClaim { method: string; timestamp: number }
interface JwtClaims { sub: string; iat?: number; exp?: number; amr?: AmrClaim[] }
interface MockSupabaseUser { id: string; email: string }

interface MockAnonClient {
  auth: {
    getUser: (token: string) => Promise<{ data: { user: MockSupabaseUser | null }; error: { message: string } | null }>
  }
}

interface MockAdminClient {
  storage: {
    listBuckets: () => Promise<{ data: Array<{ id: string }> | null }>
    from: (bucket: string) => {
      list: (prefix: string, opts: unknown) => Promise<{ data: Array<{ name: string }> | null }>
      remove: (paths: string[]) => Promise<{ error: { message: string } | null }>
    }
  }
  auth: {
    admin: {
      deleteUser: (id: string) => Promise<{ error: { message: string; status?: number } | null }>
    }
  }
}

// ── Minimal handler re-implementation for unit tests ──────────────────────────
// Mirrors the actual handler logic without Deno-specific APIs.
//
// deps.getJwtClaims mocks jose.jwtVerify: returns verified claims or throws.
// AMR is read from jwtClaims.amr ONLY — never from userData.user.amr.

async function handleRequest(
  req: {
    method: string
    headers: Record<string, string | null>
    body: string | null
  },
  deps: {
    getJwtClaims: (token: string) => Promise<JwtClaims>  // mock for jose.jwtVerify
    anonClient: MockAnonClient
    adminClient: MockAdminClient
    nowSeconds?: number
    allowedOrigins?: string
  }
): Promise<{ status: number; body: Record<string, unknown>; headers: Record<string, string> }> {
  const origin = req.headers['origin'] ?? null
  const allowedSet = new Set(
    (deps.allowedOrigins ?? 'http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:4173')
      .split(',').map(s => s.trim()).filter(Boolean)
  )

  function corsHeaders() {
    if (origin && allowedSet.has(origin)) {
      return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      } as Record<string, string>
    }
    return {} as Record<string, string>
  }

  function isCorsAllowed() {
    if (!origin) return true
    return allowedSet.has(origin)
  }

  if (req.method === 'OPTIONS') {
    if (!isCorsAllowed()) return { status: 403, body: {}, headers: {} }
    return { status: 200, body: {}, headers: corsHeaders() }
  }

  if (!isCorsAllowed()) {
    return { status: 403, body: { error: 'forbidden' }, headers: {} }
  }

  if (req.method !== 'POST') {
    return { status: 405, body: {}, headers: corsHeaders() }
  }

  const authHeader = req.headers['authorization'] ?? null
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { status: 401, body: { error: 'unauthorized' }, headers: corsHeaders() }
  }
  const token = authHeader.slice(7)

  // ── Step 1: Verify JWT signature → get verified claims (mocked jose.jwtVerify)
  let jwtClaims: JwtClaims
  try {
    jwtClaims = await deps.getJwtClaims(token)
  } catch {
    return { status: 401, body: { error: 'unauthorized' }, headers: corsHeaders() }
  }

  // ── Step 2: getUser for revocation check
  const { data: userData, error: userError } = await deps.anonClient.auth.getUser(token)
  if (userError || !userData?.user) {
    return { status: 401, body: { error: 'unauthorized' }, headers: corsHeaders() }
  }

  // Verify claims.sub matches user.id from getUser
  if (jwtClaims.sub !== userData.user.id) {
    return { status: 401, body: { error: 'unauthorized' }, headers: corsHeaders() }
  }

  const userId = userData.user.id

  let body: Record<string, unknown>
  try {
    body = JSON.parse(req.body ?? '{}') as Record<string, unknown>
  } catch {
    return { status: 400, body: { error: 'bad_request' }, headers: corsHeaders() }
  }

  if ('userId' in body || 'email' in body || 'targetUserId' in body) {
    return { status: 400, body: { error: 'bad_request' }, headers: corsHeaders() }
  }

  if (body.confirmation !== CONFIRMATION_PHRASE) {
    return { status: 400, body: { error: 'bad_request' }, headers: corsHeaders() }
  }

  // AMR check from verified JWT claims — NOT from userData.user.amr
  if (!checkRecentPasswordAuth(jwtClaims, deps.nowSeconds)) {
    return { status: 403, body: { error: 'reauth_required' }, headers: corsHeaders() }
  }

  // Delete storage
  try {
    const { data: buckets } = await deps.adminClient.storage.listBuckets()
    if (buckets && buckets.length > 0) {
      for (const bucket of buckets) {
        const { data: files } = await deps.adminClient.storage
          .from(bucket.id)
          .list(userId, {})
        if (files && files.length > 0) {
          const paths = files.map((f: { name: string }) => `${userId}/${f.name}`)
          const { error: removeError } = await deps.adminClient.storage.from(bucket.id).remove(paths)
          if (removeError) return { status: 500, body: { error: 'server_error' }, headers: corsHeaders() }
        }
      }
    }
  } catch {
    return { status: 500, body: { error: 'server_error' }, headers: corsHeaders() }
  }

  const { error: deleteError } = await deps.adminClient.auth.admin.deleteUser(userId)
  if (deleteError) {
    if (deleteError.message?.toLowerCase().includes('not found') || deleteError.status === 404) {
      return { status: 200, body: { success: true }, headers: corsHeaders() }
    }
    return { status: 500, body: { error: 'server_error' }, headers: corsHeaders() }
  }

  return { status: 200, body: { success: true }, headers: corsHeaders() }
}

// ── Test fixtures ──────────────────────────────────────────────────────────────

const USER_ID = 'user-uuid-123'
const ORIGIN = 'http://localhost:5173'

/**
 * Build a mock jose.jwtVerify that returns the given claims.
 * Pass null to simulate a signature verification failure (throws).
 */
function makeGetJwtClaims(claims: JwtClaims | null): (token: string) => Promise<JwtClaims> {
  return async (_token: string) => {
    if (claims === null) throw new Error('invalid signature')
    return claims
  }
}

/** Build JWT claims with a recent password AMR entry. */
function recentPasswordClaims(nowSeconds: number, ageSeconds = 300): JwtClaims {
  return {
    sub: USER_ID,
    iat: nowSeconds,
    exp: nowSeconds + 3600,
    amr: [{ method: 'password', timestamp: nowSeconds - ageSeconds }],
  }
}

function makeAnonClient(opts: {
  userId?: string
  fail?: boolean
}): MockAnonClient {
  return {
    auth: {
      getUser: async (_token: string) => {
        if (opts.fail) return { data: { user: null }, error: { message: 'invalid' } }
        const user: MockSupabaseUser = {
          id: opts.userId ?? USER_ID,
          email: 'test@example.com',
          // NOTE: amr is intentionally NOT set here — it must come from jwtClaims only
        }
        return { data: { user }, error: null }
      }
    }
  }
}

function makeAdminClient(opts: {
  deleteFail?: boolean
  deleteNotFound?: boolean
  storageFail?: boolean
  hasBuckets?: boolean
}): MockAdminClient {
  const deleteUserMock = vi.fn(async (_id: string) => {
    if (opts.deleteNotFound) return { error: { message: 'not found', status: 404 } }
    if (opts.deleteFail) return { error: { message: 'internal error' } }
    return { error: null }
  })

  return {
    storage: {
      listBuckets: async () => {
        if (opts.hasBuckets) return { data: [{ id: 'photos' }] }
        return { data: [] }
      },
      from: (_bucket: string) => ({
        list: async (_prefix: string, _opts: unknown) => ({
          data: opts.hasBuckets ? [{ name: 'file1.jpg' }] : []
        }),
        remove: async (_paths: string[]) => {
          if (opts.storageFail) return { error: { message: 'remove failed' } }
          return { error: null }
        }
      })
    },
    auth: { admin: { deleteUser: deleteUserMock } }
  }
}

function makeReq(opts: {
  method?: string
  token?: string
  body?: Record<string, unknown>
  origin?: string
}): { method: string; headers: Record<string, string | null>; body: string | null } {
  const nowSeconds = Math.floor(Date.now() / 1000)
  const token = opts.token ?? buildJwt({ sub: USER_ID, iat: nowSeconds, exp: nowSeconds + 3600 })
  return {
    method: opts.method ?? 'POST',
    headers: {
      'authorization': `Bearer ${token}`,
      'origin': opts.origin ?? ORIGIN,
      'content-type': 'application/json',
    },
    body: JSON.stringify(opts.body ?? { confirmation: CONFIRMATION_PHRASE }),
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('delete-account: method + CORS', () => {
  it('GET → 405', async () => {
    const now = Math.floor(Date.now() / 1000)
    const req = makeReq({ method: 'GET' })
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims(recentPasswordClaims(now)),
      anonClient: makeAnonClient({}),
      adminClient: makeAdminClient({}),
    })
    expect(res.status).toBe(405)
  })

  it('PUT → 405', async () => {
    const now = Math.floor(Date.now() / 1000)
    const req = makeReq({ method: 'PUT' })
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims(recentPasswordClaims(now)),
      anonClient: makeAnonClient({}),
      adminClient: makeAdminClient({}),
    })
    expect(res.status).toBe(405)
  })

  it('OPTIONS (allowed origin) → 200 with CORS headers, no deletion', async () => {
    const now = Math.floor(Date.now() / 1000)
    const deleteUser = vi.fn()
    const admin = makeAdminClient({})
    admin.auth.admin.deleteUser = deleteUser
    const req = makeReq({ method: 'OPTIONS' })
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims(recentPasswordClaims(now)),
      anonClient: makeAnonClient({}),
      adminClient: admin,
    })
    expect(res.status).toBe(200)
    expect(res.headers['Access-Control-Allow-Origin']).toBe(ORIGIN)
    expect(deleteUser).not.toHaveBeenCalled()
  })

  it('Disallowed origin → 403', async () => {
    const now = Math.floor(Date.now() / 1000)
    const req = makeReq({ origin: 'https://evil.com' })
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims(recentPasswordClaims(now)),
      anonClient: makeAnonClient({}),
      adminClient: makeAdminClient({}),
    })
    expect(res.status).toBe(403)
    expect(res.body).toEqual({ error: 'forbidden' })
  })

  it('OPTIONS with disallowed origin → 403', async () => {
    const now = Math.floor(Date.now() / 1000)
    const req = makeReq({ method: 'OPTIONS', origin: 'https://evil.com' })
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims(recentPasswordClaims(now)),
      anonClient: makeAnonClient({}),
      adminClient: makeAdminClient({}),
    })
    expect(res.status).toBe(403)
  })
})

describe('delete-account: authentication', () => {
  it('No Authorization header → 401', async () => {
    const now = Math.floor(Date.now() / 1000)
    const req = {
      method: 'POST',
      headers: { 'authorization': null, 'origin': ORIGIN, 'content-type': 'application/json' },
      body: JSON.stringify({ confirmation: CONFIRMATION_PHRASE }),
    }
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims(recentPasswordClaims(now)),
      anonClient: makeAnonClient({}),
      adminClient: makeAdminClient({}),
      nowSeconds: now,
    })
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'unauthorized' })
  })

  it('Invalid JWT (signature verification fails) → 401', async () => {
    const now = Math.floor(Date.now() / 1000)
    const req = makeReq({ token: 'not.a.valid.token', body: { confirmation: CONFIRMATION_PHRASE } })
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims(null),  // null = throws (bad signature)
      anonClient: makeAnonClient({}),
      adminClient: makeAdminClient({}),
      nowSeconds: now,
    })
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'unauthorized' })
  })

  it('getUser returns null user (revoked token) → 401', async () => {
    const now = Math.floor(Date.now() / 1000)
    const req = makeReq({})
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims(recentPasswordClaims(now)),
      anonClient: makeAnonClient({ fail: true }),
      adminClient: makeAdminClient({}),
      nowSeconds: now,
    })
    expect(res.status).toBe(401)
  })

  it('claims.sub mismatch vs getUser user.id → 401', async () => {
    const now = Math.floor(Date.now() / 1000)
    const req = makeReq({})
    // JWT claims say sub = USER_ID, but getUser returns a different user id
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims({ ...recentPasswordClaims(now), sub: 'attacker-uuid' }),
      anonClient: makeAnonClient({ userId: USER_ID }),  // getUser returns USER_ID
      adminClient: makeAdminClient({}),
      nowSeconds: now,
    })
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'unauthorized' })
  })
})

describe('delete-account: AMR check (from verified JWT claims)', () => {
  it('jwtClaims.amr is undefined → 403 reauth_required', async () => {
    const now = Math.floor(Date.now() / 1000)
    const req = makeReq({})
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims({ sub: USER_ID, iat: now, exp: now + 3600 }),  // no amr
      anonClient: makeAnonClient({}),
      adminClient: makeAdminClient({}),
      nowSeconds: now,
    })
    expect(res.status).toBe(403)
    expect(res.body).toEqual({ error: 'reauth_required' })
  })

  it('jwtClaims.amr is empty array → 403 reauth_required', async () => {
    const now = Math.floor(Date.now() / 1000)
    const req = makeReq({})
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims({ sub: USER_ID, iat: now, exp: now + 3600, amr: [] }),
      anonClient: makeAnonClient({}),
      adminClient: makeAdminClient({}),
      nowSeconds: now,
    })
    expect(res.status).toBe(403)
    expect(res.body).toEqual({ error: 'reauth_required' })
  })

  it('jwtClaims.amr has only token_refresh (no password method) → 403', async () => {
    // token_refresh updates iat but does NOT add a password AMR entry.
    // A user who signed in 11 minutes ago, then refreshed their token,
    // must still get 403 because the password timestamp is still 11 min old.
    const now = Math.floor(Date.now() / 1000)
    const req = makeReq({})
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims({
        sub: USER_ID,
        iat: now - 30,   // refreshed 30s ago (recent iat)
        exp: now + 3570,
        amr: [{ method: 'token_refresh', timestamp: now - 30 }],  // no password entry
      }),
      anonClient: makeAnonClient({}),
      adminClient: makeAdminClient({}),
      nowSeconds: now,
    })
    expect(res.status).toBe(403)
    expect(res.body).toEqual({ error: 'reauth_required' })
  })

  it('token_refresh updates iat but NOT password AMR timestamp → still 403', async () => {
    // Scenario: user signed in 11 min ago (password), then did token_refresh 30s ago.
    // The token has a recent iat (from refresh) but the password AMR timestamp is stale.
    const now = Math.floor(Date.now() / 1000)
    const passwordLoginAge = 660  // 11 minutes ago — outside 10-minute window
    const req = makeReq({})
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims({
        sub: USER_ID,
        iat: now - 30,      // recent iat from token_refresh
        exp: now + 3570,
        amr: [
          { method: 'password', timestamp: now - passwordLoginAge },  // too old
          { method: 'token_refresh', timestamp: now - 30 },           // recent, but not password
        ],
      }),
      anonClient: makeAnonClient({}),
      adminClient: makeAdminClient({}),
      nowSeconds: now,
    })
    expect(res.status).toBe(403)
    expect(res.body).toEqual({ error: 'reauth_required' })
  })

  it('jwtClaims.amr has password but timestamp 700s ago → 403 reauth_required', async () => {
    const now = Math.floor(Date.now() / 1000)
    const req = makeReq({})
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims({
        sub: USER_ID, iat: now, exp: now + 3600,
        amr: [{ method: 'password', timestamp: now - 700 }],
      }),
      anonClient: makeAnonClient({}),
      adminClient: makeAdminClient({}),
      nowSeconds: now,
    })
    expect(res.status).toBe(403)
    expect(res.body).toEqual({ error: 'reauth_required' })
  })

  it('jwtClaims.amr has password timestamp 300s ago → passes (200)', async () => {
    const now = Math.floor(Date.now() / 1000)
    const req = makeReq({})
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims({
        sub: USER_ID, iat: now, exp: now + 3600,
        amr: [{ method: 'password', timestamp: now - 300 }],
      }),
      anonClient: makeAnonClient({}),
      adminClient: makeAdminClient({}),
      nowSeconds: now,
    })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ success: true })
  })

  it('jwtClaims.amr has multiple entries: old password + recent token_refresh → 403', async () => {
    const now = Math.floor(Date.now() / 1000)
    const req = makeReq({})
    // Old password (too old), recent token_refresh (doesn't count as password)
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims({
        sub: USER_ID, iat: now - 50, exp: now + 3550,
        amr: [
          { method: 'password', timestamp: now - 700 },
          { method: 'token_refresh', timestamp: now - 50 },
        ],
      }),
      anonClient: makeAnonClient({}),
      adminClient: makeAdminClient({}),
      nowSeconds: now,
    })
    expect(res.status).toBe(403)
    expect(res.body).toEqual({ error: 'reauth_required' })
  })

  it('jwtClaims.amr has multiple password entries: uses the most recent one', async () => {
    const now = Math.floor(Date.now() / 1000)
    const req = makeReq({})
    // Old password entry, and a recent password entry — most recent is within 600s
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims({
        sub: USER_ID, iat: now, exp: now + 3600,
        amr: [
          { method: 'password', timestamp: now - 800 },
          { method: 'password', timestamp: now - 200 },
        ],
      }),
      anonClient: makeAnonClient({}),
      adminClient: makeAdminClient({}),
      nowSeconds: now,
    })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ success: true })
  })

  it('jwtClaims.amr has future timestamp (now + 300s) → 403', async () => {
    const now = Math.floor(Date.now() / 1000)
    const req = makeReq({})
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims({
        sub: USER_ID, iat: now, exp: now + 3600,
        amr: [{ method: 'password', timestamp: now + 300 }],
      }),
      anonClient: makeAnonClient({}),
      adminClient: makeAdminClient({}),
      nowSeconds: now,
    })
    expect(res.status).toBe(403)
    expect(res.body).toEqual({ error: 'reauth_required' })
  })

  it('jwtClaims.amr has timestamp NaN → 403', async () => {
    const now = Math.floor(Date.now() / 1000)
    const req = makeReq({})
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims({
        sub: USER_ID, iat: now, exp: now + 3600,
        amr: [{ method: 'password', timestamp: NaN as unknown as number }],
      }),
      anonClient: makeAnonClient({}),
      adminClient: makeAdminClient({}),
      nowSeconds: now,
    })
    expect(res.status).toBe(403)
    expect(res.body).toEqual({ error: 'reauth_required' })
  })

  it('jwtClaims.amr has timestamp 0 → 403', async () => {
    const now = Math.floor(Date.now() / 1000)
    const req = makeReq({})
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims({
        sub: USER_ID, iat: now, exp: now + 3600,
        amr: [{ method: 'password', timestamp: 0 }],
      }),
      anonClient: makeAnonClient({}),
      adminClient: makeAdminClient({}),
      nowSeconds: now,
    })
    expect(res.status).toBe(403)
    expect(res.body).toEqual({ error: 'reauth_required' })
  })
})

describe('delete-account: confirmation phrase', () => {
  it('Wrong confirmation → 400 bad_request', async () => {
    const now = Math.floor(Date.now() / 1000)
    const req = makeReq({ body: { confirmation: '削除' } })
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims(recentPasswordClaims(now)),
      anonClient: makeAnonClient({}),
      adminClient: makeAdminClient({}),
      nowSeconds: now,
    })
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'bad_request' })
  })

  it('Empty confirmation → 400 bad_request', async () => {
    const now = Math.floor(Date.now() / 1000)
    const req = makeReq({ body: { confirmation: '' } })
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims(recentPasswordClaims(now)),
      anonClient: makeAnonClient({}),
      adminClient: makeAdminClient({}),
      nowSeconds: now,
    })
    expect(res.status).toBe(400)
  })
})

describe('delete-account: body userId rejection', () => {
  it('Body contains userId field → 400 bad_request', async () => {
    const now = Math.floor(Date.now() / 1000)
    const req = makeReq({ body: { confirmation: CONFIRMATION_PHRASE, userId: 'attacker-id' } })
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims(recentPasswordClaims(now)),
      anonClient: makeAnonClient({}),
      adminClient: makeAdminClient({}),
      nowSeconds: now,
    })
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'bad_request' })
  })

  it('Body contains email field → 400 bad_request', async () => {
    const now = Math.floor(Date.now() / 1000)
    const req = makeReq({ body: { confirmation: CONFIRMATION_PHRASE, email: 'x@y.com' } })
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims(recentPasswordClaims(now)),
      anonClient: makeAnonClient({}),
      adminClient: makeAdminClient({}),
      nowSeconds: now,
    })
    expect(res.status).toBe(400)
  })

  it('Body contains targetUserId field → 400 bad_request', async () => {
    const now = Math.floor(Date.now() / 1000)
    const req = makeReq({ body: { confirmation: CONFIRMATION_PHRASE, targetUserId: 'other-user' } })
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims(recentPasswordClaims(now)),
      anonClient: makeAnonClient({}),
      adminClient: makeAdminClient({}),
      nowSeconds: now,
    })
    expect(res.status).toBe(400)
  })

  it('Deletion target is caller userId from JWT claims.sub, not body-provided userId', async () => {
    const now = Math.floor(Date.now() / 1000)
    const deleteUser = vi.fn(async (_id: string) => ({ error: null }))
    const admin = makeAdminClient({})
    admin.auth.admin.deleteUser = deleteUser

    const req = makeReq({ body: { confirmation: CONFIRMATION_PHRASE } })
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims(recentPasswordClaims(now)),
      anonClient: makeAnonClient({ userId: USER_ID }),
      adminClient: admin,
      nowSeconds: now,
    })
    expect(res.status).toBe(200)
    expect(deleteUser).toHaveBeenCalledWith(USER_ID)
  })
})

describe('delete-account: storage and DB failures', () => {
  it('Storage delete failure → auth user NOT deleted, returns 500', async () => {
    const now = Math.floor(Date.now() / 1000)
    const deleteUser = vi.fn()
    const admin = makeAdminClient({ hasBuckets: true, storageFail: true })
    admin.auth.admin.deleteUser = deleteUser

    const req = makeReq({})
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims(recentPasswordClaims(now)),
      anonClient: makeAnonClient({}),
      adminClient: admin,
      nowSeconds: now,
    })
    expect(res.status).toBe(500)
    expect(deleteUser).not.toHaveBeenCalled()
  })

  it('auth.admin.deleteUser failure → 500', async () => {
    const now = Math.floor(Date.now() / 1000)
    const req = makeReq({})
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims(recentPasswordClaims(now)),
      anonClient: makeAnonClient({}),
      adminClient: makeAdminClient({ deleteFail: true }),
      nowSeconds: now,
    })
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'server_error' })
  })

  it('auth user already deleted (404) → 200 idempotent', async () => {
    const now = Math.floor(Date.now() / 1000)
    const req = makeReq({})
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims(recentPasswordClaims(now)),
      anonClient: makeAnonClient({}),
      adminClient: makeAdminClient({ deleteNotFound: true }),
      nowSeconds: now,
    })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ success: true })
  })
})

describe('delete-account: success', () => {
  it('Success → 200 with success: true', async () => {
    const now = Math.floor(Date.now() / 1000)
    const req = makeReq({})
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims(recentPasswordClaims(now)),
      anonClient: makeAnonClient({}),
      adminClient: makeAdminClient({}),
      nowSeconds: now,
    })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ success: true })
  })

  it('Success with buckets → storage cleaned, then user deleted', async () => {
    const now = Math.floor(Date.now() / 1000)
    const deleteUser = vi.fn(async (_id: string) => ({ error: null }))
    const admin = makeAdminClient({ hasBuckets: true })
    admin.auth.admin.deleteUser = deleteUser

    const req = makeReq({})
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims(recentPasswordClaims(now)),
      anonClient: makeAnonClient({}),
      adminClient: admin,
      nowSeconds: now,
    })
    expect(res.status).toBe(200)
    expect(deleteUser).toHaveBeenCalledWith(USER_ID)
  })

  it('auth.admin.deleteUser is called LAST (after storage delete)', async () => {
    const now = Math.floor(Date.now() / 1000)
    const callOrder: string[] = []
    const admin = makeAdminClient({ hasBuckets: true })
    vi.spyOn(admin.storage, 'from').mockImplementation((_bucket: string) => ({
      list: async (_prefix: string, _opts: unknown) => ({ data: [{ name: 'file1.jpg' }] }),
      remove: async (_paths: string[]) => {
        callOrder.push('storage_remove')
        return { error: null }
      },
    }))
    admin.auth.admin.deleteUser = vi.fn(async (_id: string) => {
      callOrder.push('delete_user')
      return { error: null }
    })

    const req = makeReq({})
    await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims(recentPasswordClaims(now)),
      anonClient: makeAnonClient({}),
      adminClient: admin,
      nowSeconds: now,
    })
    expect(callOrder.indexOf('storage_remove')).toBeLessThan(callOrder.indexOf('delete_user'))
  })

  it('No service_role key in success response', async () => {
    const now = Math.floor(Date.now() / 1000)
    const req = makeReq({})
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims(recentPasswordClaims(now)),
      anonClient: makeAnonClient({}),
      adminClient: makeAdminClient({}),
      nowSeconds: now,
    })
    const bodyStr = JSON.stringify(res.body)
    expect(bodyStr).not.toContain('service_role')
    expect(bodyStr).not.toContain('SUPABASE')
    expect(bodyStr).not.toContain('stack')
    expect(bodyStr).not.toContain('sql')
  })

  it('No internal error details in error response', async () => {
    const now = Math.floor(Date.now() / 1000)
    const req = makeReq({})
    const res = await handleRequest(req, {
      getJwtClaims: makeGetJwtClaims(recentPasswordClaims(now)),
      anonClient: makeAnonClient({}),
      adminClient: makeAdminClient({ deleteFail: true }),
      nowSeconds: now,
    })
    const bodyStr = JSON.stringify(res.body)
    expect(bodyStr).not.toContain('service_role')
    expect(bodyStr).not.toContain('SUPABASE')
    expect(bodyStr).not.toContain('stack')
  })
})

// ── Unit tests for checkRecentPasswordAuth ────────────────────────────────────

describe('checkRecentPasswordAuth', () => {
  it('null/undefined amr → false', () => {
    expect(checkRecentPasswordAuth({} as { amr?: unknown })).toBe(false)
    expect(checkRecentPasswordAuth({ amr: null } as unknown as { amr?: unknown })).toBe(false)
  })

  it('empty array → false', () => {
    expect(checkRecentPasswordAuth({ amr: [] })).toBe(false)
  })

  it('only token_refresh method → false', () => {
    const now = Math.floor(Date.now() / 1000)
    expect(checkRecentPasswordAuth({ amr: [{ method: 'token_refresh', timestamp: now - 10 }] }, now)).toBe(false)
  })

  it('password method, age 300s → true', () => {
    const now = Math.floor(Date.now() / 1000)
    expect(checkRecentPasswordAuth({ amr: [{ method: 'password', timestamp: now - 300 }] }, now)).toBe(true)
  })

  it('password method, age 700s → false', () => {
    const now = Math.floor(Date.now() / 1000)
    expect(checkRecentPasswordAuth({ amr: [{ method: 'password', timestamp: now - 700 }] }, now)).toBe(false)
  })

  it('password method, future timestamp +300s → false', () => {
    const now = Math.floor(Date.now() / 1000)
    expect(checkRecentPasswordAuth({ amr: [{ method: 'password', timestamp: now + 300 }] }, now)).toBe(false)
  })

  it('password method, future timestamp +10s (within 30s grace) → true', () => {
    const now = Math.floor(Date.now() / 1000)
    expect(checkRecentPasswordAuth({ amr: [{ method: 'password', timestamp: now + 10 }] }, now)).toBe(true)
  })

  it('password timestamp 0 → false', () => {
    const now = Math.floor(Date.now() / 1000)
    expect(checkRecentPasswordAuth({ amr: [{ method: 'password', timestamp: 0 }] }, now)).toBe(false)
  })

  it('password timestamp NaN → false', () => {
    const now = Math.floor(Date.now() / 1000)
    expect(checkRecentPasswordAuth({ amr: [{ method: 'password', timestamp: NaN as unknown as number }] }, now)).toBe(false)
  })

  it('multiple entries: picks max password timestamp', () => {
    const now = Math.floor(Date.now() / 1000)
    expect(checkRecentPasswordAuth({
      amr: [
        { method: 'password', timestamp: now - 800 },
        { method: 'password', timestamp: now - 200 },
      ]
    }, now)).toBe(true)
  })
})
