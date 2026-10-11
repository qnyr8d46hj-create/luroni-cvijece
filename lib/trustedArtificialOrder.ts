import { ARTIFICIAL_ORDER_TYPE } from '@/lib/artificialBouquetPaths'
import type { ArtificialBouquet } from '@/lib/artificialBouquets'
import type { ArtificialOrderInput } from '@/lib/artificialOrderRequest'
import { euroToCents } from '@/lib/euroCents'

export function buildTrustedArtificialOrder(
  input: ArtificialOrderInput,
  product: ArtificialBouquet,
): Record<string, unknown> | { error: string } {
  const expectedAmountCents = euroToCents(product.priceEur)
  if (expectedAmountCents == null) {
    return { error: 'Invalid product price' }
  }

  const status = input.paymentMethod === 'card' ? 'pending_payment' : 'new'

  return {
    orderType: ARTIFICIAL_ORDER_TYPE,
    sku: product.sku,
    productName: product.name,
    productPrice: product.priceEur,
    quantity: 1,
    bouquetPrice: product.priceEur,
    expectedAmountCents,
    expectedCurrency: 'eur',
    stripeSessionId: null,
    fullName: input.fullName,
    phone: input.phone,
    email: input.email,
    deliveryAddress: input.deliveryAddress,
    deliveryCity: input.deliveryCity,
    deliveryDate: input.deliveryDate,
    deliveryTime: input.deliveryTime,
    cardMessage: input.cardMessage,
    paymentMethod: input.paymentMethod,
    status,
    createdBy: 'server',
  }
}
