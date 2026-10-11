export type Ga4PurchasePayload = {
  transactionId: string
  value: number
  currency: 'EUR'
  bouquetSize: string
  itemName: string
  itemId: string
}

type CheckoutSessionLike = {
  id: string
  payment_intent?: string | { id: string } | null
  amount_total?: number | null
  metadata?: Record<string, string> | null
}

function paymentIntentId(session: CheckoutSessionLike): string {
  const intent = session.payment_intent
  if (typeof intent === 'string' && intent) return intent
  if (intent && typeof intent === 'object' && intent.id) return intent.id
  return session.id
}

function amountEur(session: CheckoutSessionLike): number | null {
  if (session.amount_total == null || !Number.isFinite(session.amount_total)) return null
  return session.amount_total / 100
}

export function ga4PurchaseFromCheckoutSession(
  session: CheckoutSessionLike,
  freshFallbackAmounts: Record<string, number>,
): Ga4PurchasePayload | { error: string } {
  const metadata = session.metadata ?? {}
  const orderType = metadata.orderType ?? ''
  const value = amountEur(session)

  if (orderType === 'artificial') {
    const sku = (metadata.sku ?? '').trim()
    if (!sku) return { error: 'Artificial session is missing sku metadata' }
    if (value == null) return { error: 'Artificial session is missing amount_total' }
    return {
      transactionId: paymentIntentId(session),
      value,
      currency: 'EUR',
      bouquetSize: '',
      itemName: (metadata.productName ?? '').trim() || sku,
      itemId: sku,
    }
  }

  const bouquetSize = metadata.bouquetSize ?? ''
  const resolvedValue = value ?? (freshFallbackAmounts[bouquetSize] ?? 0)
  const isCustom = bouquetSize === 'Buket po želji'
  return {
    transactionId: paymentIntentId(session),
    value: resolvedValue,
    currency: 'EUR',
    bouquetSize,
    itemName: isCustom ? 'Buket po želji' : `Buket ${bouquetSize}`,
    itemId: isCustom ? 'buket-po-zelji' : `buket-${bouquetSize.toLowerCase()}`,
  }
}
