/**
 * Resolves Chromium launch options for Playwright configs.
 *
 * - If PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH is set, use that path.
 *   If the file does not exist, throw immediately so the misconfiguration
 *   is visible before any test starts.
 * - If the env var is absent, return undefined so Playwright uses the
 *   browser it manages (installed via `npx playwright install chromium`).
 *
 * Never falls back to a hardcoded container-local path.
 *
 * Note: @types/node is absent from this browser-first project by design.
 * The ts-ignore directives below suppress type errors for Node.js built-ins
 * that are guaranteed to be present when Playwright runs this file.
 */

// @ts-expect-error – node:fs is available at Playwright (Node.js) runtime
import { existsSync } from 'node:fs'

export function resolveLaunchOptions():
  | { executablePath: string }
  | undefined {
  // @ts-expect-error – process is a Node.js global available at Playwright runtime
  const envPath = (process as { env: Record<string, string | undefined> }).env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH']?.trim()
  if (!envPath) return undefined
  if (!existsSync(envPath)) {
    throw new Error(
      `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH is set to "${envPath}" but that file does not exist.\n` +
      `Unset the variable to use Playwright's managed browser instead.`,
    )
  }
  return { executablePath: envPath }
}
