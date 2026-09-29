import { NextRequest, NextResponse } from 'next/server'
import { pruneOldPriceLists, publishTodaysPriceList } from '@/lib/priceListArchive'
import { NN_PRICE_COMPLIANCE_ENABLED } from '@/lib/nnPriceCompliance'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  const auth   = req.headers.get('authorization')
  if (secret && auth === `Bearer ${secret}`) return true
  if (secret) return false
  return process.env.NODE_ENV !== 'production'
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!NN_PRICE_COMPLIANCE_ENABLED) {
    return NextResponse.json({
      ok:      true,
      skipped: true,
      reason:  'NN_PRICE_COMPLIANCE_ENABLED is false',
    })
  }

  // Daily including Saturday. Schedule is restored in vercel.json when re-enabling.
  try {
    const snapshot = await publishTodaysPriceList()
    const pruned   = await pruneOldPriceLists()
    return NextResponse.json({
      ok:       true,
      date:     snapshot.date,
      filename: snapshot.filename,
      pruned,
    })
  } catch (err) {
    console.error('[cron/publish-price-list] Firestore publish failed:', err)
    return NextResponse.json({ error: 'Publish failed' }, { status: 500 })
  }
}
