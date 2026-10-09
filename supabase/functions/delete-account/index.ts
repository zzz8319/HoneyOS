/**
 * delete-account Edge Function
 *
 * Securely deletes the authenticated user's account and all their data.
 *
 * Security:
 * - userId is derived from the verified JWT, never from the request body.
 * - service_role key is only available as an environment variable inside this function.
 * - No internal SQL, stack traces, or service_role values are returned in responses.
 * - Recent authentication is verified (JWT iat must be within 10 minutes).
 * - Confirmation phrase must match exactly: "アカウントを削除する"
 *
 * Deletion order (safe partial-failure design):
 *   1. Verify JWT + getUser (get caller's userId)
 *   2. Check confirmation exact match
 *   3. Check JWT iat within 10 minutes
 *   4. Delete Storage objects (if any buckets exist)
 *   5. Delete auth user via admin API (cascades all DB rows via FK ON DELETE CASCADE)
 *   6. Return 200
 *
 * All tables in this project have FK → auth.users(id) ON DELETE CASCADE, so
 * deleting the auth user is sufficient; no explicit per-table DELETE is needed.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

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

/** Decode JWT payload without verifying signature (verification is done by Supabase). */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/').padEnd(
      parts[1].length + (4 - (parts[1].length % 4)) % 4, '='
    )
    return JSON.parse(atob(padded)) as Record<string, unknown>
  } catch {
    return null
  }
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

  // ── Extract and verify JWT ───────────────────────────────────────────────
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

  // Use anon client to verify the JWT via getUser
  const anonClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: userData, error: userError } = await anonClient.auth.getUser(token)
  if (userError || !userData?.user) {
    return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders)
  }

  // userId MUST come from verified JWT, never from request body
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

  // ── Check recent authentication (JWT iat within 10 minutes) ─────────────
  const payload = decodeJwtPayload(token)
  if (!payload) {
    return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders)
  }
  const iat = typeof payload.iat === 'number' ? payload.iat : null
  if (iat === null) {
    return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders)
  }
  const nowSeconds = Math.floor(Date.now() / 1000)
  if (nowSeconds - iat > MAX_IAT_AGE_SECONDS) {
    return jsonResponse({ error: 'reauth_required' }, 401, corsHeaders)
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
