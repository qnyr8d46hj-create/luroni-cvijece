import { NextResponse } from 'next/server'
import { NN_PRICE_COMPLIANCE_ENABLED } from '@/lib/nnPriceCompliance'
import { isPriceListPublishable, priceListPublicationBlockers } from '@/lib/priceListPublication'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  if (!NN_PRICE_COMPLIANCE_ENABLED || !isPriceListPublishable()) {
    if (NN_PRICE_COMPLIANCE_ENABLED) {
      console.error('[cjenik/aktualni.csv] publication blocked:', priceListPublicationBlockers().join(','))
    }
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { getTodaysPriceListSnapshot } = await import('@/lib/priceListArchive')
  const snapshot = await getTodaysPriceListSnapshot()
  if (!snapshot) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return new NextResponse(snapshot.csv, {
    status: 200,
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `inline; filename="${snapshot.filename}"`,
      'Cache-Control':       'no-store',
    },
  })
}
