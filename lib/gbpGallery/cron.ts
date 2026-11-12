import type { SyncSummary } from './sync'

export function isCronAuthorized(input: {
  authorization: string | null
  cronSecret: string | undefined
  nodeEnv: string | undefined
}): boolean {
  if (input.cronSecret && input.authorization === `Bearer ${input.cronSecret}`) return true
  if (input.cronSecret) return false
  return input.nodeEnv !== 'production'
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
  try {
    const summary = await input.run()
    return { status: summary.ok ? 200 : 500, body: summary }
  } catch {
    return { status: 500, body: { ok: false, preserved: true, error: 'Sync failed' } }
  }
}
