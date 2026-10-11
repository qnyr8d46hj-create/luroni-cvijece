import { ARTIFICIAL_ORDER_TYPE } from '@/lib/artificialBouquetPaths'

export function artificialStripeProductName(name: string, sku: string): string {
  return `${name} (${sku}) — Luroni Cvijeće`
}

export function artificialStripeMetadata(orderId: string, sku: string, productName: string) {
  return {
    orderId,
    orderType: ARTIFICIAL_ORDER_TYPE,
    sku,
    productName,
  }
}
