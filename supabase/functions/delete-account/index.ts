/**
 * delete-account Edge Function
 *
 * Securely deletes the authenticated user's account and all their data.
 *
 * Security:
 * - JWT is verified via jose.createRemoteJWKSet against the project's JWKS endpoint
 *   ({SUPABASE_URL}/auth/v1/.well-known/jwks.json). Supports ES256 (current Signing Key)
 *   and automatic key rotation. Legacy HS256 tokens are intentionally rejected (401) —
 *   users must re-authenticate to obtain a current ES256 token before deleting.
 * - issuer and audience are validated explicitly.
 * - AMR claims are read from the cryptographically verified JWT payload (jose),
 *   NOT from userData.user.amr (undocumented, may be undefined).
 * - userId is derived from the verified JWT claims.sub, never from the request body.
 * - service_role key is only available as an environment variable inside this function.
 * - No internal SQL, stack traces, or service_role values are returned in responses.
 * - Recent password authentication is verified via AMR claims from the verified JWT.
 * - Confirmation phrase must match exactly: "アカウントを削除する"
 * - Supabase Storage is not used in this project; no storage deletion is performed.
 *
 * Deletion order (safe partial-failure design):
 *   1. Verify JWT signature via jose JWKS → get verified claims
 *   2. Call getUser(token) for revocation check; verify claims.sub === user.id
 *   3. Check confirmation exact match
 *   4. Check AMR: must have password method within 10 minutes (from claims.amr)
 *   5. Delete auth user via admin API (cascades all DB rows via FK ON DELETE CASCADE)
 *   6. Return 200
 *
 * All tables (including profiles) have FK → auth.users(id) ON DELETE CASCADE, so
 * deleting the auth user is sufficient; no explicit per-table DELETE is needed.
 *
 * Legacy HS256 tokens:
 *   The project has switched from Legacy Shared Secret (HS256) to Signing Keys (ES256).
 *   HS256 tokens are signed with a symmetric secret that is NOT in the JWKS, so they
 *   cannot be verified by this function and will receive 401. Users with HS256 tokens
 *   must re-authenticate (sign in) to receive a current ES256 token before deleting.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import * as jose from 'https://deno.land/x/jose@v5.2.3/index.ts'

// ── Constants ────────────────────────────────────────────────────────────────

const CONFIRMATION_PHRASE = 'アカウントを削除する'
const MAX_PASSWORD_AGE_SECONDS = 10 * 60  // 10 minutes

// ── Module-level JWKS cache ───────────────────────────────────────────────────
// createRemoteJWKSet fetches the keyset on first use and caches it.
// On an unknown 'kid', it automatically re-fetches (key rotation support).

const _supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const _jwks = _supabaseUrl
  ? jose.createRemoteJWKSet(
      new URL(`${_supabaseUrl}/auth/v1/.well-known/jwks.json`)
    )
  : null

// ── CORS ─────────────────────────────────────────────────────────────────────

const DEFAULT_ALLOWED_ORIGINS =
  'http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:4173'

function getAllowedOrigins(): Set<string> {
  const raw = Deno.env.get('ALLOWED_ORIGINS') ?? DEFAULT_ALLOWED_ORIGINS
  const prod = Deno.env.get('PRODUCTION_ORIGIN')
  const all = prod ? `${raw},${prod}` : raw
  return new Set(all.split(',').map(s => s.trim()).filter(Boolean))
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = getAllowedOrigins()
  if (origin && allowed.has(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Vary': 'Origin',
    }
  }
  return {}
}

function isCorsAllowed(origin: string | null): boolean {
  if (!origin) return true
  return getAllowedOrigins().has(origin)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function jsonResponse(body: unknown, status: number, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  })
}

/**
 * Check that the verified JWT claims contain a recent password authentication
 * in the AMR array.
 *
 * `claims` must come from a signature-verified JWT (via jose.jwtVerify + JWKS),
 * never from userData.user.amr or any unverified source.
 *
 * Fail-closed: any missing or invalid data returns false.
 */
export function checkRecentPasswordAuth(claims: { amr?: unknown }, nowSeconds?: number): boolean {
  const amr = claims.amr
  if (!Array.isArray(amr) || amr.length === 0) return false

  const passwordEntries = amr.filter((entry: unknown) =>
    entry !== null &&
    typeof entry === 'object' &&
    (entry as { method?: unknown }).method === 'password'
  )
  if (passwordEntries.length === 0) return false

  const now = nowSeconds ?? Math.floor(Date.now() / 1000)
  const maxTimestamp = Math.max(
    ...(passwordEntries as Array<{ timestamp?: unknown }>).map(e => {
      const ts = Number(e.timestamp)
      return Number.isFinite(ts) ? ts : 0
    })
  )

  if (maxTimestamp === 0) return false
  if (maxTimestamp > now + 30) return false  // reject future timestamps

  return (now - maxTimestamp) <= MAX_PASSWORD_AGE_SECONDS
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  // ── CORS preflight ──────────────────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    if (!isCorsAllowed(origin)) {
      return new Response(null, { status: 403 })
    }
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  // ── Origin check ────────────────────────────────────────────────────────
  if (!isCorsAllowed(origin)) {
    return jsonResponse({ error: 'forbidden' }, 403)
  }

  // ── Method check ────────────────────────────────────────────────────────
  if (req.method !== 'POST') {
    return new Response(null, {
      status: 405,
      headers: { Allow: 'POST, OPTIONS', ...corsHeaders },
    })
  }

  // ── Extract Bearer token ─────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders)
  }
  const token = authHeader.slice(7)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'server_error' }, 500, corsHeaders)
  }

  if (!_jwks) {
    return jsonResponse({ error: 'server_error' }, 500, corsHeaders)
  }

  // ── Step 1: Verify JWT signature via JWKS ───────────────────────────────
  // jose.createRemoteJWKSet uses the project's JWKS endpoint, supports ES256
  // and automatic key rotation (re-fetches on unknown kid).
  // issuer and audience are validated explicitly.
  // Algorithm is determined by the matching JWKS key's 'alg' field (no
  // algorithm confusion possible). alg:none and HS256 tokens cannot match
  // any JWKS key and are rejected.
  // Legacy HS256 tokens (signed with a symmetric secret not in JWKS) → 401.
  let claims: jose.JWTPayload
  try {
    const { payload } = await jose.jwtVerify(token, _jwks, {
      issuer: `${supabaseUrl}/auth/v1`,
      audience: 'authenticated',
    })
    claims = payload
  } catch {
    return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders)
  }

  // ── Step 2: Call getUser for revocation check ────────────────────────────
  // getUser contacts the Supabase Auth server to detect revoked tokens.
  // userId MUST come from verified JWT claims.sub, not from the request body.
  const anonClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: userData, error: userError } = await anonClient.auth.getUser(token)
  if (userError || !userData?.user) {
    return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders)
  }

  if (claims.sub !== userData.user.id) {
    return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders)
  }

  const userId = userData.user.id

  // ── Parse request body ───────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await req.json() as Record<string, unknown>
  } catch {
    return jsonResponse({ error: 'bad_request' }, 400, corsHeaders)
  }

  if ('userId' in body || 'email' in body || 'targetUserId' in body) {
    return jsonResponse({ error: 'bad_request' }, 400, corsHeaders)
  }

  // ── Check confirmation phrase ─────────────────────────────────────────────
  if (body.confirmation !== CONFIRMATION_PHRASE) {
    return jsonResponse({ error: 'bad_request' }, 400, corsHeaders)
  }

  // ── Check recent password authentication via verified JWT AMR claims ─────
  // claims.amr comes from the JWKS-verified JWT payload.
  // userData.user.amr is NOT used.
  if (!checkRecentPasswordAuth(claims)) {
    return jsonResponse({ error: 'reauth_required' }, 403, corsHeaders)
  }

  // ── Admin client (service_role) ──────────────────────────────────────────
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // ── Delete auth user (cascades all DB rows) ───────────────────────────────
  // Supabase Storage is not used in this project; no storage deletion is needed.
  // All tables have FK → auth.users(id) ON DELETE CASCADE; deleting the auth
  // user cascades all owned rows automatically.
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

  if (deleteError) {
    if (deleteError.message?.toLowerCase().includes('not found') ||
        (deleteError as { status?: number }).status === 404) {
      return jsonResponse({ success: true }, 200, corsHeaders)
    }
    return jsonResponse({ error: 'server_error' }, 500, corsHeaders)
  }

  return jsonResponse({ success: true }, 200, corsHeaders)
})
