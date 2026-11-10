import { createHmac, timingSafeEqual } from 'node:crypto'
import { ARTIFICIAL_ORDER_TYPE } from '@/lib/artificialBouquetPaths'
import {
  canBindStripeSession,
  resolveCheckoutOrderId,
  type PaidCheckoutSession,
} from '@/lib/artificialPaymentGuard'

// Server catalog for fresh bouquets. The browser may create the order, but
// the charge is this table, not the checkout request. A client who can later
// edit the saved order can still move these fields; production Firestore rules
// are not in this repository and are a separate dependency.

export const FRESH_UNIT_AMOUNTS_CENTS = {
  S: 4500, // 45 EUR
  M: 5500, // 55 EUR
  L: 7000, // 70 EUR
} as const

export const CUSTOM_BOUQUET_SIZE = 'Buket po želji'
export const CUSTOM_BUDGET_MIN  = 80
export const CUSTOM_BUDGET_MAX  = 200
export const CUSTOM_BUDGET_STEP = 10

const STANDARD_NAMES: Record<keyof typeof FRESH_UNIT_AMOUNTS_CENTS, string> = {
  S: 'Buket S — Luroni Cvijeće',
  M: 'Buket M — Luroni Cvijeće',
  L: 'Buket L — Luroni Cvijeće',
}

export const FRESH_PAYMENT_REVIEW_ACTION =
  'Do not fulfill this order from the mismatched payment. In Stripe, open this Checkout Session and refund the captured charge if the bouquet was not supplied.'

export type FreshPriceQuote = {
  bouquetSize: string
  customBudget: number | null
  amountCents: number
  amountEur: number
  productName: string
}

export type FreshMerchantEmail = {
  fullName: string
  phone: string
  email: string
  deliveryAddress: string
  deliveryCity: string
  bouquetSize: string
  bouquetPrice: number
  customBudget: number | null
  deliveryDate: string
  deliveryTime: string
  cardMessage: string
  paymentMethod: 'card'
}

export type FreshPaymentReview = {
  reason: string
  orderId: string
  stripeEventId: string
  stripeSessionId: string
  stripePaymentIntent: string | null
  stripeAmountTotal: number | null
  stripeCurrency: string | null
  expectedAmountCents: number | null
  manualAction: string
  recordedAt: string
}

export type FreshWebhookDecision =
  | { action: 'missing' }
  | { action: 'already_paid'; order: Record<string, unknown> }
  | {
      action: 'reject'
      reason: string
      review: FreshPaymentReview
      order: Record<string, unknown>
    }
  | {
      action: 'mark_paid'
      update: Record<string, unknown>
      email: FreshMerchantEmail
      order: Record<string, unknown>
    }

type QuoteResult = { ok: true; quote: FreshPriceQuote } | { ok: false; error: string }

export function isFreshCustomBudget(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= CUSTOM_BUDGET_MIN &&
    value <= CUSTOM_BUDGET_MAX &&
    value % CUSTOM_BUDGET_STEP === 0
  )
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function quoteStoredFreshBouquet(order: {
  bouquetSize?: unknown
  customBudget?: unknown
  bouquetPrice?: unknown
}): QuoteResult {
  if (order.bouquetPrice != null && typeof order.bouquetPrice !== 'number') {
    return { ok: false, error: 'Stored bouquet price is not a valid amount' }
  }

  const bouquetSize = asString(order.bouquetSize)
  if (bouquetSize === CUSTOM_BOUQUET_SIZE) {
    if (!isFreshCustomBudget(order.customBudget)) {
      return { ok: false, error: 'Stored custom budget is not a valid catalog amount' }
    }
    if (typeof order.bouquetPrice === 'number' && order.bouquetPrice !== order.customBudget) {
      return { ok: false, error: 'Stored bouquet price does not match the custom budget' }
    }
    return {
      ok: true,
      quote: {
        bouquetSize,
        customBudget: order.customBudget,
        amountCents: order.customBudget * 100,
        amountEur: order.customBudget,
        productName: `Buket po želji (${order.customBudget} €) — Luroni Cvijeće`,
      },
    }
  }

  if (order.customBudget != null) {
    return { ok: false, error: 'Standard bouquet must not include a custom budget' }
  }

  const amountCents = FRESH_UNIT_AMOUNTS_CENTS[bouquetSize as keyof typeof FRESH_UNIT_AMOUNTS_CENTS]
  if (!amountCents) {
    return { ok: false, error: 'Stored bouquet size is not a valid catalog size' }
  }
  const amountEur = amountCents / 100
  if (typeof order.bouquetPrice === 'number' && order.bouquetPrice !== amountEur) {
    return { ok: false, error: 'Stored bouquet price does not match the bouquet size' }
  }

  return {
    ok: true,
    quote: {
      bouquetSize,
      customBudget: null,
      amountCents,
      amountEur,
      productName: STANDARD_NAMES[bouquetSize as keyof typeof STANDARD_NAMES],
    },
  }
}

export function assessFreshCardOrder(
  order: Record<string, unknown>,
): { ok: true; quote: FreshPriceQuote } | { ok: false; error: string } {
  const orderType = asString(order.orderType)
  if (orderType === ARTIFICIAL_ORDER_TYPE || (orderType !== '' && orderType !== 'fresh')) {
    return { ok: false, error: 'Order is not a fresh bouquet order' }
  }
  if (order.paymentMethod !== 'card') {
    return { ok: false, error: 'Order is not a card payment' }
  }
  if (order.status !== 'pending_payment') {
    return { ok: false, error: 'Order is not awaiting payment' }
  }
  return quoteStoredFreshBouquet(order)
}

const STRIPE_CHECKOUT_URL = /^https:\/\/checkout\.stripe\.com\//

export type FreshCheckoutBinding = {
  orderId: string
  secret: string
  checkoutUrl: string
}

export function isStripeCheckoutUrl(value: string): boolean {
  return STRIPE_CHECKOUT_URL.test(value)
}

export function freshCheckoutBindingMac(
  secret: string,
  binding: {
    orderId: string
    sessionId: string
    checkoutUrl: string
    amountCents: number
    currency: string
  },
): string {
  return createHmac('sha256', secret)
    .update([
      'v1',
      binding.orderId,
      binding.sessionId,
      binding.checkoutUrl,
      String(binding.amountCents),
      binding.currency,
    ].join('\n'))
    .digest('hex')
}

function macEquals(stored: string, expected: string): boolean {
  const left = Buffer.from(stored)
  const right = Buffer.from(expected)
  return left.length === right.length && timingSafeEqual(left, right)
}

export function readTrustedFreshBinding(
  order: Record<string, unknown>,
  orderId: string,
  secret: string,
): { sessionId: string; checkoutUrl: string; amountCents: number } | null {
  if (!secret) return null
  const sessionId = asString(order.stripeSessionId)
  const checkoutUrl = asString(order.stripeCheckoutUrl)
  const currency = asString(order.expectedCurrency).toLowerCase()
  const mac = asString(order.stripeBindingMac)
  const amountCents = order.expectedAmountCents
  if (!sessionId || !isStripeCheckoutUrl(checkoutUrl) || currency !== 'eur' || !mac) return null
  if (typeof amountCents !== 'number' || !Number.isInteger(amountCents) || amountCents < 1) return null
  const expectedMac = freshCheckoutBindingMac(secret, {
    orderId,
    sessionId,
    checkoutUrl,
    amountCents,
    currency,
  })
  if (!macEquals(mac, expectedMac)) return null
  return { sessionId, checkoutUrl, amountCents }
}

export function freshCheckoutRequestAgrees(
  quote: FreshPriceQuote,
  request: { bouquetSize?: unknown; customBudget?: unknown },
): boolean {
  if (request.bouquetSize !== quote.bouquetSize) return false
  if (quote.customBudget == null) return request.customBudget == null
  return request.customBudget === quote.customBudget
}

export function planFreshCheckoutStart(
  order: Record<string, unknown>,
  quote: FreshPriceQuote,
  orderId: string,
  secret: string,
):
  | { action: 'reuse'; url: string }
  | { action: 'create' }
  | { action: 'reject'; reason: 'already_paid' | 'lock_mismatch'; error: string } {
  if (order.status === 'paid') {
    return { action: 'reject', reason: 'already_paid', error: 'Order is already paid' }
  }

  const trusted = readTrustedFreshBinding(order, orderId, secret)
  if (!trusted) return { action: 'create' }
  if (trusted.amountCents !== quote.amountCents) {
    return {
      action: 'reject',
      reason: 'lock_mismatch',
      error: 'Stored price no longer matches the locked checkout amount',
    }
  }
  return { action: 'reuse', url: trusted.checkoutUrl }
}

export function planFreshSessionBind(
  order: Record<string, unknown>,
  newSessionId: string,
  chargedCents: number,
  binding: FreshCheckoutBinding,
):
  | { ok: true; update: Record<string, unknown> }
  | {
      ok: false
      reason: 'not_payable' | 'price_changed' | 'already_paid' | 'session_conflict'
      error: string
    } {
  if (!newSessionId) {
    return { ok: false, reason: 'session_conflict', error: 'Checkout session is missing' }
  }
  if (!binding.secret) {
    return { ok: false, reason: 'session_conflict', error: 'Checkout binding secret is missing' }
  }
  if (!isStripeCheckoutUrl(binding.checkoutUrl)) {
    return { ok: false, reason: 'session_conflict', error: 'Checkout URL is not a Stripe-hosted URL' }
  }
  if (order.status === 'paid') {
    return { ok: false, reason: 'already_paid', error: 'Order is already paid' }
  }

  const assessed = assessFreshCardOrder(order)
  if (!assessed.ok) {
    return { ok: false, reason: 'not_payable', error: assessed.error }
  }
  if (assessed.quote.amountCents !== chargedCents) {
    return {
      ok: false,
      reason: 'price_changed',
      error: 'Stored price changed before the session could be bound',
    }
  }

  const trusted = readTrustedFreshBinding(order, binding.orderId, binding.secret)
  if (trusted && !canBindStripeSession(trusted.sessionId, newSessionId)) {
    return { ok: false, reason: 'session_conflict', error: 'Checkout session already bound' }
  }
  if (trusted && trusted.amountCents !== chargedCents) {
    return {
      ok: false,
      reason: 'price_changed',
      error: 'Stored price changed before the session could be bound',
    }
  }

  return {
    ok: true,
    update: {
      expectedAmountCents: assessed.quote.amountCents,
      expectedCurrency: 'eur',
      bouquetPrice: assessed.quote.amountEur,
      stripeSessionId: newSessionId,
      stripeCheckoutUrl: binding.checkoutUrl,
      stripeBindingMac: freshCheckoutBindingMac(binding.secret, {
        orderId: binding.orderId,
        sessionId: newSessionId,
        checkoutUrl: binding.checkoutUrl,
        amountCents: chargedCents,
        currency: 'eur',
      }),
    },
  }
}

function expectedFreshCharge(order: Record<string, unknown>):
  | { ok: true; cents: number; quote: FreshPriceQuote }
  | { ok: false; error: string } {
  const quoted = quoteStoredFreshBouquet(order)
  if (!quoted.ok) return quoted

  const locked = order.expectedAmountCents
  if (locked == null || locked === '') {
    return { ok: true, cents: quoted.quote.amountCents, quote: quoted.quote }
  }
  if (typeof locked !== 'number' || !Number.isInteger(locked) || locked < 1) {
    return { ok: false, error: 'Locked payment amount is missing or not positive' }
  }
  const currency = asString(order.expectedCurrency).toLowerCase()
  if (currency && currency !== 'eur') {
    return { ok: false, error: 'Locked currency must be eur' }
  }
  if (locked !== quoted.quote.amountCents) {
    return { ok: false, error: 'Stored bouquet no longer matches the locked checkout amount' }
  }
  return { ok: true, cents: locked, quote: quoted.quote }
}

function reviewFrom(
  orderId: string,
  eventId: string,
  session: PaidCheckoutSession & { payment_intent?: string | null },
  reason: string,
  expectedAmountCents: number | null,
  recordedAt: string,
): FreshPaymentReview {
  return {
    reason,
    orderId,
    stripeEventId: eventId,
    stripeSessionId: session.id,
    stripePaymentIntent: session.payment_intent ?? null,
    stripeAmountTotal: session.amount_total ?? null,
    stripeCurrency: session.currency ?? null,
    expectedAmountCents,
    manualAction: FRESH_PAYMENT_REVIEW_ACTION,
    recordedAt,
  }
}

function merchantEmail(order: Record<string, unknown>, quote: FreshPriceQuote): FreshMerchantEmail {
  return {
    fullName: asString(order.fullName),
    phone: asString(order.phone),
    email: asString(order.email),
    deliveryAddress: asString(order.deliveryAddress),
    deliveryCity: asString(order.deliveryCity),
    bouquetSize: quote.bouquetSize,
    bouquetPrice: quote.amountEur,
    customBudget: quote.customBudget,
    deliveryDate: asString(order.deliveryDate),
    deliveryTime: asString(order.deliveryTime),
    cardMessage: asString(order.cardMessage),
    paymentMethod: 'card',
  }
}

export function applyFreshPayment(
  order: Record<string, unknown> | null,
  input: {
    orderId: string
    eventId: string
    session: PaidCheckoutSession & { payment_intent?: string | null }
    recordedAt: string
    bindingSecret: string
  },
): FreshWebhookDecision {
  if (!order) return { action: 'missing' }

  const storedSessionId = asString(order.stripeSessionId)
  const trusted = readTrustedFreshBinding(order, input.orderId, input.bindingSecret)
  const boundSessionId = trusted?.sessionId ?? ''
  const sameStoredSession = storedSessionId !== '' && storedSessionId === input.session.id
  const sameEvent = order.stripeEventId === input.eventId
  if (order.status === 'paid' && (sameStoredSession || sameEvent)) {
    return { action: 'already_paid', order }
  }

  const reject = (reason: string, expectedAmountCents: number | null): FreshWebhookDecision => {
    const review = reviewFrom(
      input.orderId,
      input.eventId,
      input.session,
      reason,
      expectedAmountCents,
      input.recordedAt,
    )
    return {
      action: 'reject',
      reason,
      review,
      order: { ...order, paymentReview: review },
    }
  }

  if (order.status === 'paid') {
    return reject('Order is already paid by a different Checkout Session', null)
  }

  const orderType = asString(order.orderType)
  if (orderType === ARTIFICIAL_ORDER_TYPE || (orderType !== '' && orderType !== 'fresh')) {
    return reject('Order is not a fresh bouquet order', null)
  }
  if (order.paymentMethod !== 'card') {
    return reject('Payment method is not card', null)
  }
  if (order.status !== 'pending_payment') {
    return reject('Order is not awaiting payment', null)
  }
  if (input.session.payment_status !== 'paid') {
    return reject('payment_status is not paid', null)
  }

  const sessionOrderId = resolveCheckoutOrderId(input.session)
  if (!sessionOrderId || sessionOrderId !== input.orderId) {
    return reject('orderId does not match Stripe session', null)
  }

  const expected = expectedFreshCharge(order)
  if (!expected.ok) return reject(expected.error, null)

  const currency = (input.session.currency ?? '').toLowerCase()
  if (currency !== 'eur') {
    return reject('currency must be eur', expected.cents)
  }
  if (input.session.amount_total !== expected.cents) {
    return reject('Stripe amount_total does not match the stored bouquet', expected.cents)
  }
  if (boundSessionId && boundSessionId !== input.session.id) {
    return reject('Stripe session ID does not match the bound order', expected.cents)
  }

  const metaSize = asString(input.session.metadata?.bouquetSize)
  if (!metaSize || metaSize !== expected.quote.bouquetSize) {
    return reject('Stripe metadata bouquet size does not match the stored order', expected.cents)
  }
  if (expected.quote.customBudget != null) {
    const metaBudget = input.session.metadata?.customBudget
    if (metaBudget !== String(expected.quote.customBudget)) {
      return reject('Stripe metadata custom budget does not match the stored order', expected.cents)
    }
  }

  const email = merchantEmail(order, expected.quote)
  const update: Record<string, unknown> = {
    status: 'paid',
    stripeEventId: input.eventId,
    stripeSessionId: input.session.id,
    stripePaymentIntent: input.session.payment_intent ?? null,
    stripeAmountTotal: input.session.amount_total,
    stripeCurrency: currency,
    expectedAmountCents: expected.cents,
    expectedCurrency: 'eur',
    bouquetPrice: expected.quote.amountEur,
    bouquetSize: expected.quote.bouquetSize,
  }
  if (expected.quote.customBudget != null) {
    update.customBudget = expected.quote.customBudget
  }

  return {
    action: 'mark_paid',
    update,
    email,
    order: { ...order, ...update },
  }
}

export function freshMerchantEmailFromOrder(
  order: Record<string, unknown>,
): FreshMerchantEmail | null {
  const quoted = quoteStoredFreshBouquet(order)
  if (quoted.ok) return merchantEmail(order, quoted.quote)
  if (typeof order.bouquetPrice !== 'number' || !Number.isFinite(order.bouquetPrice)) return null
  const bouquetSize = asString(order.bouquetSize)
  if (!bouquetSize) return null
  const customBudget = typeof order.customBudget === 'number' ? order.customBudget : null
  return merchantEmail(order, {
    bouquetSize,
    customBudget,
    amountCents: Math.round(order.bouquetPrice * 100),
    amountEur: order.bouquetPrice,
    productName: bouquetSize,
  })
}

export function freshMerchantEmailOutcome(input: {
  outboxExists: boolean
  outboxStatus: string | null
  flushFailed: boolean
}): 'delivered' | 'retry' | 'skip_legacy' {
  if (!input.outboxExists) return 'skip_legacy'
  if (!input.flushFailed && (input.outboxStatus === 'sent' || input.outboxStatus === 'skipped')) {
    return 'delivered'
  }
  return 'retry'
}

export function formatFreshPaymentReview(review: FreshPaymentReview): string {
  return (
    `[Webhook][MANUAL_REVIEW_REFUND] order=${review.orderId} ` +
    `session=${review.stripeSessionId} payment_intent=${review.stripePaymentIntent ?? ''} ` +
    `amount_total=${review.stripeAmountTotal ?? ''} expected_cents=${review.expectedAmountCents ?? ''} ` +
    `currency=${review.stripeCurrency ?? ''} reason=${review.reason}`
  )
}
