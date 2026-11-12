import { createHash, timingSafeEqual } from 'node:crypto'
import type { SyncSummary } from './sync'

const MAX_AUTHORIZATION_CHARS = 8192

function authorizationMatches(authorization: string, secret: string): boolean {
  const expected = `Bearer ${secret}`
  if (authorization.length > MAX_AUTHORIZATION_CHARS || expected.length > MAX_AUTHORIZATION_CHARS) return false
  const actualHash = createHash('sha256').update(authorization).digest()
  const expectedHash = createHash('sha256').update(expected).digest()
  return timingSafeEqual(actualHash, expectedHash)
}

export function isCronAuthorized(input: {
  authorization: string | null
  cronSecret: string | undefined
  nodeEnv: string | undefined
}): boolean {
  if (input.cronSecret && input.authorization && authorizationMatches(input.authorization, input.cronSecret)) return true
  if (input.cronSecret) return false
  return input.nodeEnv !== 'production'
}

// Manual sync has no development bypass. A missing secret is a refusal in every environment.
export function isManualSyncAuthorized(input: {
  authorization: string | null
  cronSecret: string | undefined
}): boolean {
  if (!input.cronSecret || !input.authorization) return false
  return authorizationMatches(input.authorization, input.cronSecret)
}

let gallerySyncInFlight = false

async function runExclusive(run: () => Promise<SyncSummary>): Promise<{ status: number; body: SyncSummary }> {
  if (gallerySyncInFlight) {
    return { status: 409, body: { ok: false, preserved: true, error: 'Sync already in progress' } }
  }
  gallerySyncInFlight = true
  try {
    const summary = await run()
    return { status: summary.ok ? 200 : 500, body: summary }
  } catch {
    return { status: 500, body: { ok: false, preserved: true, error: 'Sync failed' } }
  } finally {
    gallerySyncInFlight = false
  }
}

export async function handleGbpGalleryCron(input: {
  authorized: boolean
  enabled: boolean
  run: () => Promise<SyncSummary>
}): Promise<{ status: number; body: SyncSummary }> {
  if (!input.authorized) return { status: 401, body: { ok: false, error: 'Unauthorized' } }
  if (!input.enabled) {
    return { status: 200, body: { ok: true, skipped: true, reason: 'GBP_SYNC_ENABLED is not true' } }
  }
  return runExclusive(input.run)
}

export async function handleManualGbpGallerySync(input: {
  authorized: boolean
  run: () => Promise<SyncSummary>
}): Promise<{ status: number; body: SyncSummary }> {
  if (!input.authorized) return { status: 401, body: { ok: false, error: 'Unauthorized' } }
  return runExclusive(input.run)
}
