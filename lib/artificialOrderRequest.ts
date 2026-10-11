import { ARTIFICIAL_ORDER_TYPE } from '@/lib/artificialBouquetPaths'
import { isArtificialBouquetSku } from '@/lib/artificialBouquets'
import { validateOrderDeliveryFields, validatePaymentMethod } from '@/lib/orderFieldValidation'

export type ArtificialOrderInput = {
  sku: string
  paymentMethod: 'card' | 'cash'
  fullName: string
  phone: string
  email: string
  deliveryAddress: string
  deliveryCity: string
  deliveryDate: string
  deliveryTime: string
  cardMessage: string
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function parseArtificialOrderRequest(
  body: unknown,
): { ok: true; data: ArtificialOrderInput } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid request body' }
  }
  const record = body as Record<string, unknown>
  const sku = asString(record.sku)
  if (!isArtificialBouquetSku(sku)) {
    return { ok: false, error: 'Invalid SKU' }
  }

  const paymentMethod = asString(record.paymentMethod)
  const paymentError = validatePaymentMethod(paymentMethod)
  if (paymentError) return { ok: false, error: paymentError }

  const data: ArtificialOrderInput = {
    sku,
    paymentMethod: paymentMethod as 'card' | 'cash',
    fullName: asString(record.fullName),
    phone: asString(record.phone),
    email: asString(record.email),
    deliveryAddress: asString(record.deliveryAddress),
    deliveryCity: asString(record.deliveryCity),
    deliveryDate: asString(record.deliveryDate),
    deliveryTime: asString(record.deliveryTime),
    cardMessage: asString(record.cardMessage ?? record.message),
  }

  const deliveryError = validateOrderDeliveryFields(data)
  if (deliveryError) return { ok: false, error: deliveryError }

  return { ok: true, data }
}

export function rejectedClientTrustFields(body: unknown): string[] {
  if (!body || typeof body !== 'object') return []
  const record = body as Record<string, unknown>
  const ignored = [
    'productPrice',
    'bouquetPrice',
    'productName',
    'status',
    'stripeEventId',
    'stripeSessionId',
    'stripePaymentIntent',
    'expectedAmountCents',
    'paidAt',
    'orderId',
  ]
  return ignored.filter(key => key in record && record[key] != null && record[key] !== '')
}

export { ARTIFICIAL_ORDER_TYPE }
