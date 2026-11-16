import { NextResponse } from 'next/server'
import { NN_PRICE_COMPLIANCE_ENABLED } from '@/lib/nnPriceCompliance'
import { serializePriceListCsv } from '@/lib/priceListCsv'
import { decidePriceListPublication, isPriceListPublishable, priceListPublicationBlockers } from '@/lib/priceListPublication'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  if (!NN_PRICE_COMPLIANCE_ENABLED || !isPriceListPublishable()) {
    if (NN_PRICE_COMPLIANCE_ENABLED) {
      console.error('[cjenik/aktualni.csv] publication blocked:', priceListPublicationBlockers().join(','))
    }
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const { getCurrentPriceListSnapshot, publishCurrentPriceList } = await import('@/lib/priceListArchive')
    let snapshot = await getCurrentPriceListSnapshot()
    const fresh = serializePriceListCsv()
    if (!snapshot || decidePriceListPublication(snapshot.csv, fresh) === 'replace') {
      snapshot = (await publishCurrentPriceList()).snapshot
    }

    return new NextResponse(snapshot.csv, {
      status: 200,
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `inline; filename="${snapshot.filename}"`,
        'Cache-Control':       'no-store',
      },
    })
  } catch (err) {
    console.error('[cjenik/aktualni.csv] failed:', err)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
