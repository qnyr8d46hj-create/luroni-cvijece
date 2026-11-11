import { NextRequest, NextResponse } from 'next/server'
import { handleGbpGalleryCron, isCronAuthorized } from '@/lib/gbpGallery/cron'
import { isGbpSyncEnabled, readGbpSyncEnv } from '@/lib/gbpGallery/google'
import { createServerFetch } from '@/lib/gbpGallery/http'
import { syncGbpGallery } from '@/lib/gbpGallery/sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const result = await handleGbpGalleryCron({
    authorized: isCronAuthorized({
      authorization: req.headers.get('authorization'),
      cronSecret: process.env.CRON_SECRET,
      nodeEnv: process.env.NODE_ENV,
    }),
    enabled: isGbpSyncEnabled(process.env),
    run: async () => {
      const env = readGbpSyncEnv(process.env)
      if (!env.ok) {
        return {
          ok: false,
          preserved: true,
          error: 'GBP sync configuration is incomplete',
          missing: env.missing,
        }
      }
      const { firebaseGalleryStore } = await import('@/lib/gbpGallery/firestore')
      return syncGbpGallery({
        env: env.value,
        fetchImpl: createServerFetch(),
        store: firebaseGalleryStore(),
      })
    },
  })

  return NextResponse.json(result.body, { status: result.status })
}
