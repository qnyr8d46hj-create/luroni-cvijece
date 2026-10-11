import type { DocumentReference, Firestore, Transaction } from 'firebase-admin/firestore'
import {
  buildCustomerEmailHtml,
  buildMerchantEmailHtml,
  isArtificialOrderEmail,
  orderEmailPayloadFromDocument,
  orderEmailSubject,
  sendCustomerOrderConfirmationEmail,
  sendOrderNotificationEmail,
  type OrderEmailPayload,
} from '@/lib/sendOrderEmail'

export const EMAIL_OUTBOX_COLLECTION = 'email_outbox'

export function isArtificialEmailRetryAuthorized(
  header: string | null,
  secrets: { retry?: string; cron?: string },
): boolean {
  const provided = (header ?? '').replace(/^Bearer\s+/i, '').trim()
  if (!provided) return false
  return [secrets.retry, secrets.cron].some(secret => Boolean(secret) && secret === provided)
}

export type OutboxStatus = 'pending' | 'sent' | 'skipped' | 'failed'

export type OutboxPurpose = 'merchant_paid' | 'customer_paid' | 'merchant_cash' | 'customer_cash'

export type OutboxRecord = {
  orderId: string
  purpose: OutboxPurpose
  audience: 'merchant' | 'customer'
  status: OutboxStatus
  idempotencyKey: string
  skipReason?: string
}

export function outboxDocId(orderId: string, purpose: OutboxPurpose): string {
  return `${orderId}_${purpose}`
}

export function isResendDomainVerified(): boolean {
  return process.env.RESEND_DOMAIN_VERIFIED === 'true'
}

export function customerEmailDeliveryEnabled(): boolean {
  return isResendDomainVerified() && Boolean(process.env.RESEND_FROM_EMAIL)
}

export function plannedOutboxEntries(
  orderId: string,
  payload: OrderEmailPayload,
  channel: 'paid' | 'cash',
): OutboxRecord[] {
  const merchantPurpose: OutboxPurpose = channel === 'paid' ? 'merchant_paid' : 'merchant_cash'
  const customerPurpose: OutboxPurpose = channel === 'paid' ? 'customer_paid' : 'customer_cash'
  const entries: OutboxRecord[] = [
    {
      orderId,
      purpose: merchantPurpose,
      audience: 'merchant',
      status: 'pending',
      idempotencyKey: outboxDocId(orderId, merchantPurpose),
    },
  ]

  if (!isArtificialOrderEmail(payload)) return entries

  if (!customerEmailDeliveryEnabled()) {
    entries.push({
      orderId,
      purpose: customerPurpose,
      audience: 'customer',
      status: 'skipped',
      idempotencyKey: outboxDocId(orderId, customerPurpose),
      skipReason: 'Customer email is not sent until RESEND_DOMAIN_VERIFIED=true and RESEND_FROM_EMAIL uses a verified domain.',
    })
    return entries
  }

  entries.push({
    orderId,
    purpose: customerPurpose,
    audience: 'customer',
    status: 'pending',
    idempotencyKey: outboxDocId(orderId, customerPurpose),
  })
  return entries
}

export const OUTBOX_LEASE_MS = 60_000

export function canClaimOutbox(
  data: { status?: string; leaseUntil?: number | null } | undefined,
  now: number,
): boolean {
  if (!data) return false
  if (data.status === 'sent' || data.status === 'skipped') return false
  if (data.status === 'sending' && typeof data.leaseUntil === 'number' && data.leaseUntil > now) {
    return false
  }
  return data.status === 'pending' || data.status === 'sending' || data.status === 'failed'
}

export function enqueueOutboxInTransaction(
  t: Transaction,
  outboxRef: (id: string) => DocumentReference,
  entries: OutboxRecord[],
  payload: OrderEmailPayload,
): void {
  for (const entry of entries) {
    const ref = outboxRef(entry.idempotencyKey)
    t.set(ref, {
      ...entry,
      subject: orderEmailSubject(payload, entry.audience),
      createdAt: new Date().toISOString(),
      attempts: 0,
    }, { merge: true })
  }
}

export { orderEmailPayloadFromDocument }

export async function flushEmailOutbox(
  adminDb: Firestore,
  orderId: string,
  payload: OrderEmailPayload,
): Promise<{ sent: string[]; skipped: string[]; failed: string[] }> {
  const sent: string[] = []
  const skipped: string[] = []
  const failed: string[] = []
  const purposes: OutboxPurpose[] = [
    'merchant_paid',
    'customer_paid',
    'merchant_cash',
    'customer_cash',
  ]

  for (const purpose of purposes) {
    const id = outboxDocId(orderId, purpose)
    const ref = adminDb.collection(EMAIL_OUTBOX_COLLECTION).doc(id)
    const workerId = `${orderId}:${purpose}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`
    const now = Date.now()

    const claim = await adminDb.runTransaction(async t => {
      const snap = await t.get(ref)
      if (!snap.exists) return { action: 'missing' as const }
      const data = snap.data() as OutboxRecord & {
        status: OutboxStatus
        leaseUntil?: number
        audience?: 'merchant' | 'customer'
      }
      if (data.status === 'skipped') return { action: 'skipped' as const, audience: data.audience }
      if (data.orderId !== orderId) return { action: 'mismatch' as const }
      if (!canClaimOutbox(data, now)) {
        return { action: data.status === 'sent' ? 'done' as const : 'busy' as const }
      }
      t.update(ref, {
        status: 'sending',
        leaseOwner: workerId,
        leaseUntil: now + OUTBOX_LEASE_MS,
        claimedAt: new Date().toISOString(),
      })
      return { action: 'claimed' as const, audience: data.audience ?? 'merchant' }
    })

    if (claim.action === 'skipped') {
      skipped.push(purpose)
      continue
    }
    if (claim.action !== 'claimed') {
      if (claim.action === 'mismatch') failed.push(purpose)
      continue
    }

    const result = claim.audience === 'customer'
      ? await sendCustomerOrderConfirmationEmail(payload)
      : await sendOrderNotificationEmail(payload)

    if (result.success) {
      await adminDb.runTransaction(async t => {
        const fresh = await t.get(ref)
        const data = fresh.data()
        if (!fresh.exists) return
        if (data?.status === 'sent' || data?.status === 'skipped') return
        if (data?.leaseOwner !== workerId) return
        t.update(ref, {
          status: 'sent',
          messageId: result.messageId ?? null,
          sentAt: new Date().toISOString(),
          leaseOwner: null,
          leaseUntil: null,
        })
      })
      sent.push(purpose)
    } else {
      await adminDb.runTransaction(async t => {
        const fresh = await t.get(ref)
        const data = fresh.data()
        if (!fresh.exists) return
        if (data?.leaseOwner !== workerId) return
        t.update(ref, {
          status: 'pending',
          lastError: result.error ?? 'send failed',
          attempts: (data?.attempts ?? 0) + 1,
          failedAt: new Date().toISOString(),
          leaseOwner: null,
          leaseUntil: null,
        })
      })
      failed.push(purpose)
    }
  }

  return { sent, skipped, failed }
}

export function emailPayloadFromOrderData(data: Record<string, unknown>): OrderEmailPayload {
  return orderEmailPayloadFromDocument(data)
}

export { buildCustomerEmailHtml, buildMerchantEmailHtml }
