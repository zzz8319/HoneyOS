/**
 * delete-account Edge Function
 *
 * Securely deletes the authenticated user's account and all their data.
 *
 * Security:
 * - userId is derived from the verified JWT, never from the request body.
 * - AMR claims are read from the cryptographically verified JWT payload (jose),
 *   NOT from userData.user.amr (undocumented, may be undefined).
 * - service_role key is only available as an environment variable inside this function.
 * - No internal SQL, stack traces, or service_role values are returned in responses.
 * - Recent password authentication is verified via AMR claims from the verified JWT.
 * - Confirmation phrase must match exactly: "アカウントを削除する"
 *
 * Deletion order (safe partial-failure design):
 *   1. Verify JWT signature via jose + SUPABASE_JWT_SECRET → get verified claims
 *   2. Call getUser(token) for revocation check; verify claims.sub === user.id
 *   3. Check confirmation exact match
 *   4. Check AMR: must have password method within 10 minutes (from claims.amr)
 *   5. Delete Storage objects (if any buckets exist)
 *   6. Delete auth user via admin API (cascades all DB rows via FK ON DELETE CASCADE)
 *   7. Return 200
 *
 * All tables in this project have FK → auth.users(id) ON DELETE CASCADE, so
 * deleting the auth user is sufficient; no explicit per-table DELETE is needed.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import * as jose from 'https://deno.land/x/jose@v5.2.3/index.ts'

// ── Constants ────────────────────────────────────────────────────────────────

const CONFIRMATION_PHRASE = 'アカウントを削除する'
const MAX_IAT_AGE_SECONDS = 10 * 60  // 10 minutes

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
  // Only reflect if the origin is explicitly allowed
  if (origin && allowed.has(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Vary': 'Origin',
    }
  }
  // Return no Access-Control-Allow-Origin to cause CORS failure in browser
  return {}
}

function isCorsAllowed(origin: string | null): boolean {
  if (!origin) return true  // non-browser (server-to-server) — no CORS restriction
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
 * `claims` must come from a signature-verified JWT (via jose.jwtVerify), never
 * from userData.user.amr or any unverified source.
 *
 * Fail-closed: any missing or invalid data returns false.
 */
function checkRecentPasswordAuth(claims: { amr?: unknown }, nowSeconds?: number): boolean {
  const amr = claims.amr
  if (!Array.isArray(amr) || amr.length === 0) return false

  // Find password auth entries
  const passwordEntries = amr.filter((entry: unknown) =>
    entry !== null &&
    typeof entry === 'object' &&
    (entry as { method?: unknown }).method === 'password'
  )
  if (passwordEntries.length === 0) return false

  // Get the most recent password auth timestamp
  const now = nowSeconds ?? Math.floor(Date.now() / 1000)
  const maxTimestamp = Math.max(
    ...(passwordEntries as Array<{ timestamp?: unknown }>).map(e => {
      const ts = Number(e.timestamp)
      return Number.isFinite(ts) ? ts : 0
    })
  )

  if (maxTimestamp === 0) return false
  // Reject future timestamps (more than 30s in future = suspicious)
  if (maxTimestamp > now + 30) return false

  const age = now - maxTimestamp
  return age <= MAX_IAT_AGE_SECONDS
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
  const jwtSecretStr = Deno.env.get('SUPABASE_JWT_SECRET')

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'server_error' }, 500, corsHeaders)
  }
  if (!jwtSecretStr) {
    return jsonResponse({ error: 'server_error' }, 500, corsHeaders)
  }

  // ── Step 1: Verify JWT signature and extract claims ──────────────────────
  // Use jose to cryptographically verify the signature before trusting any claim.
  // This is the ONLY source of AMR data — userData.user.amr is NOT used.
  let claims: jose.JWTPayload
  try {
    const secret = new TextEncoder().encode(jwtSecretStr)
    const { payload } = await jose.jwtVerify(token, secret)
    claims = payload
  } catch {
    return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders)
  }

  // ── Step 2: Call getUser for revocation check ────────────────────────────
  // getUser contacts the Supabase Auth server, which can detect revoked tokens
  // (e.g. after signOut). userId MUST come from verified JWT claims.sub,
  // not from the request body.
  const anonClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: userData, error: userError } = await anonClient.auth.getUser(token)
  if (userError || !userData?.user) {
    return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders)
  }

  // Verify that claims.sub matches the user returned by the Auth server.
  // A mismatch would indicate a token/user inconsistency.
  if (claims.sub !== userData.user.id) {
    return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders)
  }

  // userId is taken from the verified JWT sub claim (== userData.user.id after check above)
  const userId = userData.user.id

  // ── Parse request body ───────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await req.json() as Record<string, unknown>
  } catch {
    return jsonResponse({ error: 'bad_request' }, 400, corsHeaders)
  }

  // Reject any body that contains userId / email / targetUserId
  if ('userId' in body || 'email' in body || 'targetUserId' in body) {
    return jsonResponse({ error: 'bad_request' }, 400, corsHeaders)
  }

  // ── Check confirmation phrase ─────────────────────────────────────────────
  if (body.confirmation !== CONFIRMATION_PHRASE) {
    return jsonResponse({ error: 'bad_request' }, 400, corsHeaders)
  }

  // ── Check recent password authentication via verified JWT AMR claims ─────
  // claims.amr comes from the cryptographically verified JWT payload (jose).
  // userData.user.amr is NOT used — it is not an officially documented field
  // and may be undefined.
  if (!checkRecentPasswordAuth(claims)) {
    return jsonResponse({ error: 'reauth_required' }, 403, corsHeaders)
  }

  // ── Admin client (service_role) ──────────────────────────────────────────
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // ── Delete Storage objects ────────────────────────────────────────────────
  // List known buckets and remove any objects belonging to this user.
  // Currently no buckets are provisioned; this is a future-proof stub.
  try {
    const { data: buckets } = await adminClient.storage.listBuckets()
    if (buckets && buckets.length > 0) {
      for (const bucket of buckets) {
        const { data: files } = await adminClient.storage
          .from(bucket.id)
          .list(userId, { limit: 1000 })
        if (files && files.length > 0) {
          const paths = files.map(f => `${userId}/${f.name}`)
          const { error: removeError } = await adminClient.storage
            .from(bucket.id)
            .remove(paths)
          if (removeError) {
            // Storage delete failure: do NOT proceed with user deletion
            return jsonResponse({ error: 'server_error' }, 500, corsHeaders)
          }
        }
      }
    }
  } catch {
    // Storage operation failed: do NOT proceed with user deletion
    return jsonResponse({ error: 'server_error' }, 500, corsHeaders)
  }

  // ── Delete auth user (cascades all DB rows) ───────────────────────────────
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

  if (deleteError) {
    // Idempotency: if user is already deleted, treat as success
    if (deleteError.message?.toLowerCase().includes('not found') ||
        (deleteError as { status?: number }).status === 404) {
      return jsonResponse({ success: true }, 200, corsHeaders)
    }
    return jsonResponse({ error: 'server_error' }, 500, corsHeaders)
  }

  return jsonResponse({ success: true }, 200, corsHeaders)
})
