import { NextRequest, NextResponse } from 'next/server'
import { pruneOldPriceLists, publishTodaysPriceList } from '@/lib/priceListArchive'
import { NN_PRICE_COMPLIANCE_ENABLED } from '@/lib/nnPriceCompliance'
import { priceListPublicationBlockers } from '@/lib/priceListPublication'

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
      ok:       true,
      skipped:  true,
      published: false,
      reason:   'NN_PRICE_COMPLIANCE_ENABLED is false',
    })
  }

  const blockers = priceListPublicationBlockers()
  if (blockers.length > 0) {
    return NextResponse.json({
      ok:        false,
      published: false,
      blocked:   true,
      blockers,
    }, { status: 409 })
  }

  // Not registered in vercel.json. Restore "0 5 * * *" only after blockers clear.
  try {
    const snapshot = await publishTodaysPriceList()
    const pruned   = await pruneOldPriceLists()
    return NextResponse.json({
      ok:        true,
      published: true,
      date:      snapshot.date,
      filename:  snapshot.filename,
      pruned,
    })
  } catch (err) {
    console.error('[cron/publish-price-list] Firestore publish failed:', err)
    return NextResponse.json({ error: 'Publish failed' }, { status: 500 })
  }
}
