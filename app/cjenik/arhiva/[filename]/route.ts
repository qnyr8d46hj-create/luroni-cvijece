import { NextResponse } from 'next/server'
import { getPriceListSnapshotByFilename } from '@/lib/priceListArchive'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> },
) {
  const { filename } = await context.params
  if (!filename || !filename.endsWith('.csv')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const snapshot = await getPriceListSnapshotByFilename(filename)
    if (!snapshot) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return new NextResponse(snapshot.csv, {
      status: 200,
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `inline; filename="${snapshot.filename}"`,
        'Cache-Control':       'public, max-age=86400, immutable',
      },
    })
  } catch (err) {
    console.error('[cjenik/arhiva] failed:', err)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
