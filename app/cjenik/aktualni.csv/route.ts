import { NextResponse } from 'next/server'
import { buildCurrentPriceList } from '@/lib/priceListCsv'
import { NN_PRICE_COMPLIANCE_ENABLED } from '@/lib/nnPriceCompliance'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  if (!NN_PRICE_COMPLIANCE_ENABLED) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const generated = buildCurrentPriceList()

  return new NextResponse(generated.csv, {
    status: 200,
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': 'inline; filename="luroni-cjenik-aktualni.csv"',
      'Cache-Control':       'no-store',
    },
  })
}
