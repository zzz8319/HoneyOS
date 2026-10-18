/**
 * Convert colony.apiaryId (a stringified DB bigint) to a safe positive integer
 * farmId, or null when the value is absent, 'unknown', non-integer, zero, or
 * negative. Rejects floats, partial parses, and values outside safe-integer range.
 */
export function parseFarmId(raw: string | undefined): number | null {
  if (!raw || raw === 'unknown') return null
  const n = Number(raw)
  if (!Number.isSafeInteger(n) || n < 1) return null
  return n
}
