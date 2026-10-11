import { ARTIFICIAL_ORDER_TYPE } from '@/lib/artificialBouquetPaths'

export type LockedArtificialPayment = {
  orderType: string
  sku: string
  expectedAmountCents: number
  expectedCurrency: string
  stripeSessionId: string | null | undefined
}

export type PaidCheckoutSession = {
  id: string
  payment_status: string
  currency: string | null
  amount_total: number | null
  client_reference_id?: string | null
  metadata?: Record<string, string> | null
}

export type PaymentGuardResult =
  | { ok: true }
  | { ok: false; error: string; retry: boolean }

export function resolveCheckoutOrderId(session: PaidCheckoutSession): string | null {
  const fromRef = (session.client_reference_id ?? '').trim()
  const fromMeta = (session.metadata?.orderId ?? '').trim()
  if (fromRef && fromMeta && fromRef !== fromMeta) return null
  return fromRef || fromMeta || null
}

export function assertArtificialPaidSession(
  session: PaidCheckoutSession,
  order: LockedArtificialPayment,
  orderId: string,
): PaymentGuardResult {
  if (session.payment_status !== 'paid') {
    return { ok: false, error: 'payment_status is not paid', retry: false }
  }
  if (order.orderType !== ARTIFICIAL_ORDER_TYPE) {
    return { ok: false, error: 'orderType is not artificial', retry: false }
  }

  const sessionOrderId = resolveCheckoutOrderId(session)
  if (!sessionOrderId || sessionOrderId !== orderId) {
    return { ok: false, error: 'orderId does not match Stripe session', retry: false }
  }

  const sessionSku = (session.metadata?.sku ?? '').trim()
  const sessionOrderType = (session.metadata?.orderType ?? '').trim()
  if (sessionOrderType !== ARTIFICIAL_ORDER_TYPE) {
    return { ok: false, error: 'Stripe metadata orderType mismatch', retry: false }
  }
  if (!order.sku || sessionSku !== order.sku) {
    return { ok: false, error: 'SKU does not match Stripe session', retry: false }
  }

  if (order.stripeSessionId && order.stripeSessionId !== session.id) {
    return { ok: false, error: 'Stripe session ID does not match the bound order', retry: false }
  }

  const currency = (session.currency ?? '').toLowerCase()
  if (currency !== 'eur' || order.expectedCurrency !== 'eur') {
    return { ok: false, error: 'currency must be eur', retry: false }
  }

  if (
    !Number.isInteger(order.expectedAmountCents) ||
    order.expectedAmountCents < 1
  ) {
    return { ok: false, error: 'locked payment amount is missing or not positive', retry: false }
  }
  if (session.amount_total !== order.expectedAmountCents) {
    return { ok: false, error: 'Stripe amount_total does not match amount locked at checkout', retry: false }
  }

  return { ok: true }
}

export function canBindStripeSession(
  existingSessionId: string | null | undefined,
  newSessionId: string,
): boolean {
  if (!existingSessionId) return true
  return existingSessionId === newSessionId
}
