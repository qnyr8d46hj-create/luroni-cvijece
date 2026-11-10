import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  applyFreshPayment,
  assessFreshCardOrder,
  CUSTOM_BUDGET_MAX,
  CUSTOM_BUDGET_MIN,
  CUSTOM_BUDGET_STEP,
  CUSTOM_BOUQUET_SIZE,
  formatFreshPaymentReview,
  freshCheckoutRequestAgrees,
  freshMerchantEmailOutcome,
  FRESH_UNIT_AMOUNTS_CENTS,
  isFreshCustomBudget,
  planFreshCheckoutStart,
  planFreshSessionBind,
  quoteStoredFreshBouquet,
} from '../lib/freshCheckout'

function fail(message: string): never {
  console.error(`FAIL: ${message}`)
  process.exit(1)
}
function assert(condition: unknown, message: string) {
  if (!condition) fail(message)
}

const recordedAt = '2026-11-10T12:00:00.000Z'

function savedOrder(overrides: Record<string, unknown> = {}) {
  return {
    fullName: 'Ana Horvat',
    phone: '+385 91 234 5678',
    email: 'ana@email.com',
    deliveryAddress: 'Ulica 1',
    deliveryCity: 'Rijeka',
    bouquetSize: 'L',
    bouquetPrice: 70,
    deliveryDate: '2099-06-01',
    deliveryTime: '16-20',
    cardMessage: 'Hvala',
    paymentMethod: 'card',
    status: 'pending_payment',
    ...overrides,
  }
}

function paidSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cs_l',
    payment_status: 'paid',
    currency: 'eur',
    amount_total: 7000,
    client_reference_id: 'order-1',
    metadata: { orderId: 'order-1', bouquetSize: 'L' },
    payment_intent: 'pi_l',
    ...overrides,
  }
}

const BINDING_SECRET = 'test-binding-secret'
const PHISHING_URL = 'https://evil.example/checkout'
const SERVER_CHECKOUT_URL = 'https://checkout.stripe.com/c/pay/cs_test_server'

function bindArgs(checkoutUrl: string) {
  return { orderId: 'order-1', secret: BINDING_SECRET, checkoutUrl }
}

function pay(order: Record<string, unknown> | null, session: Record<string, unknown>, eventId = 'evt_1') {
  return applyFreshPayment(order, {
    orderId: 'order-1',
    eventId,
    session: session as never,
    recordedAt,
    bindingSecret: BINDING_SECRET,
  })
}

assert(FRESH_UNIT_AMOUNTS_CENTS.S === 4500, 'S is 4500 cents')
assert(FRESH_UNIT_AMOUNTS_CENTS.M === 5500, 'M is 5500 cents')
assert(FRESH_UNIT_AMOUNTS_CENTS.L === 7000, 'L is 7000 cents')
assert(CUSTOM_BUDGET_MIN === 80 && CUSTOM_BUDGET_MAX === 200 && CUSTOM_BUDGET_STEP === 10, 'Custom range is 80–200 / 10')
assert(!isFreshCustomBudget(70) && !isFreshCustomBudget(75) && !isFreshCustomBudget(210), 'Invalid custom budgets are rejected')
assert(isFreshCustomBudget(80) && isFreshCustomBudget(200), 'Custom endpoints are valid')

const storedL = quoteStoredFreshBouquet(savedOrder())
assert(storedL.ok && storedL.quote.amountCents === 7000, 'Stored L quotes 70 EUR')
assert(
  storedL.ok && !freshCheckoutRequestAgrees(storedL.quote, { bouquetSize: 'S' }),
  'Stored L rejects an S checkout request',
)
assert(
  storedL.ok && freshCheckoutRequestAgrees(storedL.quote, { bouquetSize: 'L' }),
  'Stored L accepts a matching checkout request',
)

const storedCustom = quoteStoredFreshBouquet(savedOrder({
  bouquetSize: CUSTOM_BOUQUET_SIZE,
  bouquetPrice: 200,
  customBudget: 200,
}))
assert(storedCustom.ok && storedCustom.quote.amountCents === 20000, 'Stored custom 200 quotes 200 EUR')
assert(
  storedCustom.ok && !freshCheckoutRequestAgrees(storedCustom.quote, {
    bouquetSize: CUSTOM_BOUQUET_SIZE,
    customBudget: 80,
  }),
  'Stored custom 200 rejects an 80 EUR checkout request',
)
assert(
  storedCustom.ok && freshCheckoutRequestAgrees(storedCustom.quote, {
    bouquetSize: CUSTOM_BOUQUET_SIZE,
    customBudget: 200,
  }),
  'Stored custom 200 accepts a matching checkout request',
)

assert(!quoteStoredFreshBouquet(savedOrder({ bouquetPrice: 45 })).ok, 'L order with a 45 EUR stored price is invalid')
assert(!assessFreshCardOrder(savedOrder({ orderType: 'artificial' })).ok, 'Artificial orders are not fresh card orders')
assert(!assessFreshCardOrder(savedOrder({ paymentMethod: 'cash', status: 'new' })).ok, 'Cash orders are not card checkouts')
assert(!assessFreshCardOrder(savedOrder({ status: 'paid' })).ok, 'Paid orders are not awaiting payment')

const sizes = [
  { bouquetSize: 'S', bouquetPrice: 45, cents: 4500, metadata: { orderId: 'order-1', bouquetSize: 'S' } },
  { bouquetSize: 'M', bouquetPrice: 55, cents: 5500, metadata: { orderId: 'order-1', bouquetSize: 'M' } },
  { bouquetSize: 'L', bouquetPrice: 70, cents: 7000, metadata: { orderId: 'order-1', bouquetSize: 'L' } },
] as const
for (const size of sizes) {
  const result = pay(
    savedOrder({ bouquetSize: size.bouquetSize, bouquetPrice: size.bouquetPrice }),
    paidSession({ amount_total: size.cents, metadata: size.metadata }),
  )
  assert(result.action === 'mark_paid', `${size.bouquetSize} payment is accepted`)
  if (result.action === 'mark_paid') {
    assert(result.update.expectedAmountCents === size.cents, `${size.bouquetSize} locks ${size.cents} cents`)
    assert(result.update.status === 'paid', `${size.bouquetSize} is marked paid`)
    assert(result.email.bouquetPrice === size.bouquetPrice, `${size.bouquetSize} email uses the catalog price`)
    assert(result.email.paymentMethod === 'card', `${size.bouquetSize} email stays a card payment`)
  }
}

for (const budget of [80, 140, 200]) {
  const result = pay(
    savedOrder({ bouquetSize: CUSTOM_BOUQUET_SIZE, bouquetPrice: budget, customBudget: budget }),
    paidSession({
      amount_total: budget * 100,
      metadata: {
        orderId: 'order-1',
        bouquetSize: CUSTOM_BOUQUET_SIZE,
        customBudget: String(budget),
      },
    }),
  )
  assert(result.action === 'mark_paid', `Custom ${budget} payment is accepted`)
  if (result.action === 'mark_paid') {
    assert(result.email.bouquetPrice === budget, `Custom ${budget} email uses the stored budget`)
    assert(result.email.customBudget === budget, `Custom ${budget} email keeps the budget`)
  }
}

const underpaidL = pay(savedOrder(), paidSession({
  amount_total: 4500,
  metadata: { orderId: 'order-1', bouquetSize: 'S' },
}))
assert(underpaidL.action === 'reject', 'Stored L rejects a 45 EUR charge')
if (underpaidL.action === 'reject') {
  assert(underpaidL.order.status === 'pending_payment', 'Underpaid L stays pending')
  assert(underpaidL.review.expectedAmountCents === 7000, 'Underpaid L records the expected 70 EUR')
  assert(underpaidL.review.stripeAmountTotal === 4500, 'Underpaid L records the captured 45 EUR')
  assert(underpaidL.review.stripeSessionId === 'cs_l', 'Underpaid L records the Stripe session')
  assert(formatFreshPaymentReview(underpaidL.review).includes('MANUAL_REVIEW_REFUND'), 'Underpaid L is marked for manual refund')
}

const underpaidCustom = pay(
  savedOrder({ bouquetSize: CUSTOM_BOUQUET_SIZE, bouquetPrice: 200, customBudget: 200 }),
  paidSession({
    amount_total: 8000,
    metadata: { orderId: 'order-1', bouquetSize: CUSTOM_BOUQUET_SIZE, customBudget: '80' },
  }),
)
assert(underpaidCustom.action === 'reject', 'Stored custom 200 rejects an 80 EUR charge')
if (underpaidCustom.action === 'reject') {
  assert(underpaidCustom.order.status === 'pending_payment', 'Underpaid custom order stays pending')
  assert(underpaidCustom.review.expectedAmountCents === 20000, 'Underpaid custom order expects 200 EUR')
}

const wrongCurrency = pay(savedOrder(), paidSession({ currency: 'usd' }))
assert(wrongCurrency.action === 'reject', 'Non-EUR charge is rejected')
if (wrongCurrency.action === 'reject') {
  assert(wrongCurrency.order.status === 'pending_payment', 'Currency mismatch stays pending')
  assert(wrongCurrency.reason === 'currency must be eur', 'Currency mismatch names EUR')
}

const conflictingIds = pay(savedOrder(), paidSession({
  client_reference_id: 'order-1',
  metadata: { orderId: 'order-2', bouquetSize: 'L' },
}))
assert(conflictingIds.action === 'reject', 'Conflicting order ids are rejected')

const otherOrder = pay(savedOrder(), paidSession({
  client_reference_id: 'order-2',
  metadata: { orderId: 'order-2', bouquetSize: 'L' },
}))
assert(otherOrder.action === 'reject', 'A session for a different order is rejected')

const untrustedSession = pay(
  savedOrder({
    stripeSessionId: 'cs_forged',
    stripeCheckoutUrl: PHISHING_URL,
    expectedAmountCents: 7000,
    expectedCurrency: 'eur',
    stripeBindingMac: 'forged',
  }),
  paidSession(),
)
assert(untrustedSession.action === 'mark_paid', 'A client-supplied session id does not block the real payment')
if (untrustedSession.action === 'mark_paid') {
  assert(untrustedSession.update.stripeSessionId === 'cs_l', 'Payment records the Stripe session, not the forged id')
}

const trustedBind = planFreshSessionBind(savedOrder(), 'cs_bound', 7000, bindArgs('https://checkout.stripe.com/c/pay/cs_bound'))
assert(trustedBind.ok, 'Server can bind a Stripe-hosted checkout')
const trustedOrder = trustedBind.ok ? { ...savedOrder(), ...trustedBind.update } : savedOrder()
const wrongSession = pay(trustedOrder, paidSession({ id: 'cs_other' }))
assert(wrongSession.action === 'reject', 'A different Stripe session is rejected after a server bind')
if (wrongSession.action === 'reject') {
  assert(wrongSession.order.status === 'pending_payment', 'Session mismatch stays pending')
  assert(wrongSession.reason === 'Stripe session ID does not match the bound order', 'Session mismatch names the bound session')
}

const cash = pay(
  savedOrder({ paymentMethod: 'cash', status: 'new' }),
  paidSession({ amount_total: 4500, metadata: { orderId: 'order-1', bouquetSize: 'S' } }),
)
assert(cash.action === 'reject', 'A card charge cannot pay a cash order')
if (cash.action === 'reject') {
  assert(cash.order.status === 'new', 'Cash order status stays new')
  assert(cash.order.paymentMethod === 'cash', 'Cash payment method stays cash')
}

const legacyPaid = pay(savedOrder({ expectedAmountCents: undefined }), paidSession())
assert(legacyPaid.action === 'mark_paid', 'Legacy pending L with the catalog amount is accepted')
if (legacyPaid.action === 'mark_paid') {
  assert(legacyPaid.update.expectedAmountCents === 7000, 'Legacy payment backfills the lock')
  assert(legacyPaid.update.stripeSessionId === 'cs_l', 'Legacy payment binds the session it verified')
}
const legacyUnderpaid = pay(savedOrder(), paidSession({ amount_total: 4500 }))
assert(legacyUnderpaid.action === 'reject', 'Legacy pending L rejects a smaller charge')

const mutatedAfterLock = pay(
  savedOrder({
    bouquetSize: 'S',
    bouquetPrice: 45,
    expectedAmountCents: 7000,
    expectedCurrency: 'eur',
    stripeSessionId: 'cs_l',
  }),
  paidSession(),
)
assert(mutatedAfterLock.action === 'reject', 'A locked 70 EUR order rejects a size mutated to S')
if (mutatedAfterLock.action === 'reject') {
  assert(mutatedAfterLock.order.status === 'pending_payment', 'Mutated locked order stays pending')
}

const first = pay(savedOrder(), paidSession(), 'evt_1')
assert(first.action === 'mark_paid', 'First delivery marks the order paid')
const paidOrder = first.action === 'mark_paid' ? first.order : savedOrder()
const duplicate = pay(paidOrder, paidSession(), 'evt_1')
assert(duplicate.action === 'already_paid', 'The same webhook event does not pay the order again')
const sameSession = pay(paidOrder, paidSession(), 'evt_2')
assert(sameSession.action === 'already_paid', 'A second event for the same session does not pay again')
const secondSession = pay(paidOrder, paidSession({ id: 'cs_second', payment_intent: 'pi_second' }), 'evt_3')
assert(secondSession.action === 'reject', 'A second captured session is not fulfilled')
if (secondSession.action === 'reject') {
  assert(secondSession.order.status === 'paid', 'The original paid order stays paid')
  assert(secondSession.review.stripeSessionId === 'cs_second', 'The extra session is recorded for refund')
}

const staleA = savedOrder()
const staleB = { ...staleA }
const serverUrlA = 'https://checkout.stripe.com/c/pay/cs_a'
const planA = planFreshSessionBind(staleA, 'cs_a', 7000, bindArgs(serverUrlA))
const planB = planFreshSessionBind(staleB, 'cs_b', 7000, bindArgs('https://checkout.stripe.com/c/pay/cs_b'))
assert(planA.ok && planB.ok, 'Two readers can both plan a bind before either commits')
if (planA.ok && storedL.ok) {
  const committed = { ...staleA, ...planA.update }
  const retried = planFreshSessionBind(committed, 'cs_b', 7000, bindArgs('https://checkout.stripe.com/c/pay/cs_b'))
  assert(!retried.ok && retried.reason === 'session_conflict', 'The losing concurrent session cannot replace the bound one')
  const same = planFreshSessionBind(committed, 'cs_a', 7000, bindArgs(serverUrlA))
  assert(same.ok, 'The winning session can rebind')
  const cheaper = planFreshSessionBind(staleA, 'cs_cheap', 4500, bindArgs('https://checkout.stripe.com/c/pay/cs_cheap'))
  assert(!cheaper.ok && cheaper.reason === 'price_changed', 'A cheaper charge cannot bind to a stored L order')
  const reuse = planFreshCheckoutStart(committed, storedL.quote, 'order-1', BINDING_SECRET)
  assert(reuse.action === 'reuse' && reuse.url === serverUrlA, 'A server-bound checkout reuses the Stripe URL')

  const forged = savedOrder({
    stripeSessionId: 'cs_forged',
    stripeCheckoutUrl: PHISHING_URL,
    expectedAmountCents: 7000,
    expectedCurrency: 'eur',
    stripeBindingMac: 'forged',
  })
  const forgedStart = planFreshCheckoutStart(forged, storedL.quote, 'order-1', BINDING_SECRET)
  assert(forgedStart.action === 'create', 'A client-supplied checkout URL is not reused')
  assert(!JSON.stringify(forgedStart).includes(PHISHING_URL), 'The phishing URL is not returned')
  assert(!JSON.stringify(forgedStart).includes('cs_forged'), 'The forged session id is not treated as bound')
  const forgedBind = planFreshSessionBind(forged, 'cs_real', 7000, bindArgs(SERVER_CHECKOUT_URL))
  assert(forgedBind.ok, 'An untrusted pre-bound session can be replaced')
  if (forgedBind.ok) {
    assert(forgedBind.update.stripeSessionId === 'cs_real', 'The replacement session id comes from the server')
    assert(forgedBind.update.stripeCheckoutUrl === SERVER_CHECKOUT_URL, 'The replacement URL is the Stripe URL')
    assert(!JSON.stringify(forgedBind.update).includes(PHISHING_URL), 'The stored phishing URL is not kept')
  }
  const tampered = { ...committed, stripeCheckoutUrl: PHISHING_URL }
  const tamperedStart = planFreshCheckoutStart(tampered, storedL.quote, 'order-1', BINDING_SECRET)
  assert(tamperedStart.action === 'create', 'A changed checkout URL breaks the server binding')
  const wrongSecret = planFreshCheckoutStart(committed, storedL.quote, 'order-1', 'other-secret')
  assert(wrongSecret.action === 'create', 'Another secret cannot reuse a bound checkout')
  const offHost = planFreshSessionBind(savedOrder(), 'cs_off', 7000, bindArgs(PHISHING_URL))
  assert(!offHost.ok, 'A non-Stripe URL cannot be signed or stored')
  const legacyStart = planFreshCheckoutStart(savedOrder(), storedL.quote, 'order-1', BINDING_SECRET)
  assert(legacyStart.action === 'create', 'A legitimate pending order with no Stripe fields can start checkout')
}

assert(
  freshMerchantEmailOutcome({ outboxExists: false, outboxStatus: null, flushFailed: false }) === 'skip_legacy',
  'A legacy paid order without an outbox does not send another email',
)
assert(
  freshMerchantEmailOutcome({ outboxExists: true, outboxStatus: 'pending', flushFailed: true }) === 'retry',
  'A failed Resend send is retried',
)
assert(
  freshMerchantEmailOutcome({ outboxExists: true, outboxStatus: 'sending', flushFailed: false }) === 'retry',
  'An in-flight send is retried rather than dropped',
)
assert(
  freshMerchantEmailOutcome({ outboxExists: true, outboxStatus: 'sent', flushFailed: false }) === 'delivered',
  'A sent outbox is not sent again',
)

let deliveries = 0
let box: { status: 'pending' | 'sent' } | null = null
function merchantAttempt(fail: boolean) {
  if (!box) return
  if (box.status === 'sent') {
    assert(
      freshMerchantEmailOutcome({ outboxExists: true, outboxStatus: 'sent', flushFailed: false }) === 'delivered',
      'Repeat delivery sees the sent outbox',
    )
    return
  }
  if (fail) {
    box = { status: 'pending' }
    assert(
      freshMerchantEmailOutcome({ outboxExists: true, outboxStatus: box.status, flushFailed: true }) === 'retry',
      'Failed attempt stays retryable',
    )
    return
  }
  box = { status: 'sent' }
  deliveries += 1
}
if (first.action === 'mark_paid') box = { status: 'pending' }
merchantAttempt(true)
assert(deliveries === 0, 'Resend failure sends no merchant email')
merchantAttempt(false)
assert(deliveries === 1, 'Retry after Resend failure sends one merchant email')
merchantAttempt(false)
assert(deliveries === 1, 'A later webhook does not send a second merchant email')

const root = process.cwd()
const route = readFileSync(resolve(root, 'app/api/create-checkout-session/route.ts'), 'utf8')
const webhook = readFileSync(resolve(root, 'app/api/stripe/webhook/route.ts'), 'utf8')
assert(route.includes('assessFreshCardOrder'), 'Checkout loads a server-side assessment of the saved order')
assert(route.includes('freshCheckoutRequestAgrees'), 'Checkout rejects a request that disagrees with the saved bouquet')
assert(route.includes('planFreshSessionBind'), 'Checkout binds the Stripe session inside a transaction')
assert(route.includes('bindingSecret'), 'Checkout signs session bindings with the server secret')
assert(!route.includes('order.stripeCheckoutUrl'), 'Checkout does not read a client-supplied checkout URL')
assert(webhook.includes('bindingSecret'), 'Webhook verifies the server session binding')
assert(route.includes('sessions.expire'), 'An unbound Stripe session is expired')
assert(route.includes('unit_amount: quote.amountCents'), 'Checkout charges the saved-order quote')
assert(!route.includes('customBudget * 100'), 'Checkout does not price the client budget')
assert(route.indexOf('freshCheckoutRequestAgrees') < route.indexOf('stripe.checkout.sessions.create'), 'Mismatch is rejected before a session is created')
assert(webhook.includes('constructEvent'), 'Webhook still verifies the Stripe signature')
assert(webhook.includes('applyFreshPayment'), 'Webhook applies the fresh payment guard')
assert(webhook.includes('flushEmailOutbox'), 'Fresh merchant email uses the durable outbox')
assert(webhook.includes('freshMerchantEmailOutcome'), 'Fresh email failure is retried')
assert(webhook.includes('assertArtificialPaidSession'), 'Artificial payment guard remains in the webhook')
assert(!webhook.includes('sendOrderNotificationEmail'), 'Fresh webhook no longer sends mail before the paid claim is durable')

console.log('PASS: fresh checkout payment checks')
