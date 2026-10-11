// ── lib/sendOrderEmail.ts — server-side only ──────────────────
//
// Single source of truth for order notification emails.
// Imported by:
//   - app/api/send-order-email/route.ts  (cash payments)
//   - app/api/stripe/webhook/route.ts    (card payments after Firestore "paid" update)

import { Resend } from 'resend'
import { ARTIFICIAL_ORDER_TYPE } from '@/lib/artificialBouquetPaths'
import { orderEmailFromAddress } from '@/lib/resendFrom'

const MERCHANT_FROM = 'Luroni cvijeće <onboarding@resend.dev>'

// ── Shared types ───────────────────────────────────────────────
export interface OrderEmailPayload {
  fullName:        string
  phone:           string
  email:           string
  deliveryAddress: string
  deliveryCity:    string
  bouquetSize:     string
  bouquetPrice:    number | null
  customBudget?:   number | null   // set only for "Buket po želji" orders
  deliveryDate:    string
  deliveryTime:    string
  cardMessage:     string
  paymentMethod:   string
  orderType?:      'fresh' | 'artificial'
  sku?:            string
  productName?:    string
  productPrice?:   number | null
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?:   string
}

export function isArtificialOrderEmail(order: OrderEmailPayload): boolean {
  return order.orderType === ARTIFICIAL_ORDER_TYPE
}

export function orderEmailPayloadFromDocument(
  data: Record<string, unknown>,
): OrderEmailPayload {
  const productPrice = typeof data.productPrice === 'number' ? data.productPrice : null
  const bouquetPrice = typeof data.bouquetPrice === 'number' ? data.bouquetPrice : productPrice
  return {
    fullName:        String(data.fullName        ?? ''),
    phone:           String(data.phone           ?? ''),
    email:           String(data.email           ?? ''),
    deliveryAddress: String(data.deliveryAddress ?? ''),
    deliveryCity:    String(data.deliveryCity    ?? ''),
    bouquetSize:     String(data.bouquetSize     ?? ''),
    bouquetPrice,
    customBudget:    typeof data.customBudget === 'number' ? data.customBudget : null,
    deliveryDate:    String(data.deliveryDate    ?? ''),
    deliveryTime:    String(data.deliveryTime    ?? ''),
    cardMessage:     String(data.cardMessage     ?? ''),
    paymentMethod:   String(data.paymentMethod   ?? 'card'),
    orderType:       data.orderType === ARTIFICIAL_ORDER_TYPE ? ARTIFICIAL_ORDER_TYPE : 'fresh',
    sku:             String(data.sku ?? ''),
    productName:     String(data.productName ?? ''),
    productPrice,
  }
}

// ── Display helpers ────────────────────────────────────────────
const PAYMENT_LABELS: Record<string, string> = {
  card: 'Kartica online',
  cash: 'Gotovina pri dostavi',
}

const TIME_LABELS: Record<string, string> = {
  '08-12': '08:00 – 12:00',
  '12-16': '12:00 – 16:00',
  '16-20': '16:00 – 20:00',
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}.`
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function row(label: string, value: string, shaded = false): string {
  const bg = shaded ? '#f9f8f6' : '#ffffff'
  return `<tr>
    <td style="padding:11px 16px;background:${bg};color:#5e5e5e;font-size:13px;font-weight:600;white-space:nowrap;width:40%;border-bottom:1px solid #f0ede8;">${label}</td>
    <td style="padding:11px 16px;background:${bg};color:#1a1a1a;font-size:14px;border-bottom:1px solid #f0ede8;">${escHtml(value)}</td>
  </tr>`
}

function productRows(o: OrderEmailPayload): string {
  if (isArtificialOrderEmail(o)) {
    const price = o.productPrice ?? o.bouquetPrice
    const priceLabel = price != null ? `${price} €` : '—'
    return [
      row('Aranžman', o.productName || 'Umjetni aranžman'),
      row('SKU', o.sku || '—', true),
      row('Cijena', priceLabel),
      row('Količina', '1', true),
    ].join('')
  }

  const isCustom = o.bouquetSize === 'Buket po želji'
  const bouquetLabel = isCustom ? 'Buket po želji' : `Buket ${o.bouquetSize}`
  const priceValue = isCustom ? (o.customBudget ?? o.bouquetPrice) : o.bouquetPrice
  const priceLabel = priceValue != null ? `${priceValue} €` : '—'
  const priceRowLabel = isCustom ? 'Odabrani budžet' : 'Cijena'
  return [
    row('Vrsta buketa', bouquetLabel),
    row(priceRowLabel, priceLabel, true),
  ].join('')
}

export function orderEmailSubject(order: OrderEmailPayload, audience: 'merchant' | 'customer'): string {
  if (isArtificialOrderEmail(order)) {
    return audience === 'customer'
      ? 'Potvrda narudžbe umjetnog aranžmana - Luroni cvijeće'
      : 'Nova narudžba umjetnog aranžmana - Luroni cvijeće'
  }
  return audience === 'customer'
    ? 'Potvrda narudžbe - Luroni cvijeće'
    : 'Nova narudžba buketa - Luroni cvijeće'
}

function buildEmailHtml(o: OrderEmailPayload, audience: 'merchant' | 'customer'): string {
  const paymentLabel = PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod
  const timeLabel    = TIME_LABELS[o.deliveryTime]     ?? (o.deliveryTime || 'Bilo kada')
  const dateLabel    = formatDate(o.deliveryDate)
  const artificial   = isArtificialOrderEmail(o)
  const heading = audience === 'customer'
    ? (artificial ? 'Potvrda narudžbe aranžmana' : 'Potvrda narudžbe buketa')
    : (artificial ? 'Nova narudžba umjetnog aranžmana' : 'Nova narudžba buketa')

  const messageBlock = o.cardMessage
    ? `<tr>
        <td style="padding:10px 16px;background:#f3f8f4;color:#5e5e5e;font-size:13px;font-weight:600;white-space:nowrap;width:40%;">Poruka / napomena</td>
        <td style="padding:10px 16px;background:#f3f8f4;color:#1a1a1a;font-size:14px;">${escHtml(o.cardMessage)}</td>
       </tr>`
    : ''

  const intro = audience === 'customer'
    ? `<p style="margin:0 0 24px 0;color:#5e5e5e;font-size:14px;line-height:1.6;">Hvala na narudžbi. ${
        o.paymentMethod === 'card'
          ? 'Uplata je zaprimljena.'
          : 'Narudžba je zaprimljena. Plaćanje je dogovoreno gotovinom pri dostavi.'
      } Javit ćemo vam se radi potvrde termina dostave.</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="hr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escHtml(heading)}</title>
</head>
<body style="margin:0;padding:24px 16px;background:#f0ede8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.10);">

    <div style="background:#3e6b4e;padding:32px 36px;">
      <p style="margin:0 0 6px 0;color:rgba(255,255,255,0.65);font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">Luroni cvijeće</p>
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;line-height:1.3;">${escHtml(heading)}</h1>
    </div>

    <div style="padding:32px 36px 24px;">
      ${intro}

      <h2 style="margin:0 0 12px 0;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9a9a9a;">Podaci o kupcu</h2>
      <table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;margin-bottom:24px;">
        ${row('Ime i prezime', o.fullName)}
        ${row('Mobitel',       o.phone,  true)}
        ${row('Email',         o.email)}
      </table>

      <h2 style="margin:0 0 12px 0;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9a9a9a;">Dostava</h2>
      <table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;margin-bottom:24px;">
        ${row('Adresa',          o.deliveryAddress)}
        ${row('Mjesto',          o.deliveryCity,   true)}
        ${row('Datum dostave',   dateLabel)}
        ${row('Željeno vrijeme', timeLabel,        true)}
      </table>

      <h2 style="margin:0 0 12px 0;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9a9a9a;">Narudžba</h2>
      <table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;margin-bottom:24px;">
        ${productRows(o)}
        ${row('Plaćanje', paymentLabel)}
        ${messageBlock}
      </table>

    </div>

    <div style="padding:18px 36px;background:#f9f8f6;border-top:1px solid #e8e3dc;text-align:center;">
      <p style="margin:0;color:#9a9a9a;font-size:12px;">
        Luroni cvijeće &mdash; ${artificial ? 'umjetni cvjetni aranžmani s dostavom' : 'online narudžba buketa s dostavom'}
      </p>
    </div>

  </div>

</body>
</html>`
}

export function buildMerchantEmailHtml(order: OrderEmailPayload): string {
  return buildEmailHtml(order, 'merchant')
}

export function buildCustomerEmailHtml(order: OrderEmailPayload): string {
  return buildEmailHtml(order, 'customer')
}

async function sendHtmlEmail(input: {
  to: string
  subject: string
  html: string
  audience: 'merchant' | 'customer'
}): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY env var is not set' }
  }

  const from = input.audience === 'merchant' ? MERCHANT_FROM : orderEmailFromAddress()
  const resend = new Resend(apiKey)
  const { data, error } = await resend.emails.send({
    from,
    to:      [input.to],
    subject: input.subject,
    html:    input.html,
  })

  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true, messageId: data?.id }
}

export async function sendOrderNotificationEmail(
  order: OrderEmailPayload,
): Promise<EmailResult> {
  const toEmail = process.env.ORDER_NOTIFICATION_EMAIL
  if (!toEmail) {
    return { success: false, error: 'ORDER_NOTIFICATION_EMAIL env var is not set' }
  }

  return sendHtmlEmail({
    to: toEmail,
    subject: orderEmailSubject(order, 'merchant'),
    html: buildMerchantEmailHtml(order),
    audience: 'merchant',
  })
}

export async function sendCustomerOrderConfirmationEmail(
  order: OrderEmailPayload,
): Promise<EmailResult> {
  const email = order.email.trim()
  if (!email) {
    return { success: false, error: 'Customer email is missing' }
  }
  return sendHtmlEmail({
    to: email,
    subject: orderEmailSubject(order, 'customer'),
    html: buildCustomerEmailHtml(order),
    audience: 'customer',
  })
}

export async function sendPaidOrderEmails(order: OrderEmailPayload): Promise<{
  merchant: EmailResult
  customer?: EmailResult
}> {
  const merchant = await sendOrderNotificationEmail(order)
  if (!isArtificialOrderEmail(order)) {
    return { merchant }
  }
  const customer = await sendCustomerOrderConfirmationEmail(order)
  return { merchant, customer }
}
