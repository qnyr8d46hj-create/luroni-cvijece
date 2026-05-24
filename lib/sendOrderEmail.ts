// ── lib/sendOrderEmail.ts — server-side only ──────────────────
//
// Single source of truth for order notification emails.
// Imported by:
//   - app/api/send-order-email/route.ts  (cash payments, called from OrderForm)
//   - app/api/stripe/webhook/route.ts    (card payments, called after Firestore "paid" update)
//
// Required env vars (never expose to client):
//   RESEND_API_KEY            — Resend API key
//   ORDER_NOTIFICATION_EMAIL  — recipient address (shop owner)

import { Resend } from 'resend'

// ── Shared types ───────────────────────────────────────────────
export interface OrderEmailPayload {
  fullName:        string
  phone:           string
  email:           string
  deliveryAddress: string
  deliveryCity:    string
  bouquetSize:     string
  bouquetPrice:    number | null
  deliveryDate:    string
  deliveryTime:    string
  cardMessage:     string
  paymentMethod:   string
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?:   string
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

// ── HTML email template ────────────────────────────────────────
function buildEmailHtml(o: OrderEmailPayload): string {
  const paymentLabel = PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod
  const timeLabel    = TIME_LABELS[o.deliveryTime]     ?? (o.deliveryTime || 'Bilo kada')
  const priceLabel   = o.bouquetPrice != null ? `${o.bouquetPrice} €` : '—'
  const dateLabel    = formatDate(o.deliveryDate)

  const messageBlock = o.cardMessage
    ? `<tr>
        <td style="padding:10px 16px;background:#f3f8f4;color:#5e5e5e;font-size:13px;font-weight:600;white-space:nowrap;width:40%;">Poruka / napomena</td>
        <td style="padding:10px 16px;background:#f3f8f4;color:#1a1a1a;font-size:14px;">${escHtml(o.cardMessage)}</td>
       </tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="hr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Nova narudžba buketa</title>
</head>
<body style="margin:0;padding:24px 16px;background:#f0ede8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.10);">

    <!-- Header -->
    <div style="background:#3e6b4e;padding:32px 36px;">
      <p style="margin:0 0 6px 0;color:rgba(255,255,255,0.65);font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">Luroni cvijeće</p>
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;line-height:1.3;">Nova narudžba buketa</h1>
    </div>

    <!-- Body -->
    <div style="padding:32px 36px 24px;">

      <!-- Customer -->
      <h2 style="margin:0 0 12px 0;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9a9a9a;">Podaci o kupcu</h2>
      <table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;margin-bottom:24px;">
        ${row('Ime i prezime', o.fullName)}
        ${row('Mobitel',       o.phone,  true)}
        ${row('Email',         o.email)}
      </table>

      <!-- Delivery -->
      <h2 style="margin:0 0 12px 0;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9a9a9a;">Dostava</h2>
      <table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;margin-bottom:24px;">
        ${row('Adresa',          o.deliveryAddress)}
        ${row('Mjesto',          o.deliveryCity,   true)}
        ${row('Datum dostave',   dateLabel)}
        ${row('Željeno vrijeme', timeLabel,        true)}
      </table>

      <!-- Order -->
      <h2 style="margin:0 0 12px 0;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9a9a9a;">Narudžba</h2>
      <table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;margin-bottom:24px;">
        ${row('Veličina buketa', `Buket ${o.bouquetSize}`)}
        ${row('Cijena',          priceLabel, true)}
        ${row('Plaćanje',        paymentLabel)}
        ${messageBlock}
      </table>

    </div>

    <!-- Footer -->
    <div style="padding:18px 36px;background:#f9f8f6;border-top:1px solid #e8e3dc;text-align:center;">
      <p style="margin:0;color:#9a9a9a;font-size:12px;">
        Luroni cvijeće &mdash; online narudžba buketa s dostavom
      </p>
    </div>

  </div>

</body>
</html>`
}

// ── sendOrderNotificationEmail ────────────────────────────────
//
// Call this function directly — do NOT call /api/send-order-email via fetch
// from server-side code. On Vercel a serverless function cannot reliably make
// HTTP requests back to its own routes; async work started after `return` is
// silently cut off when the function exits.
export async function sendOrderNotificationEmail(
  order: OrderEmailPayload,
): Promise<EmailResult> {
  const apiKey  = process.env.RESEND_API_KEY
  const toEmail = process.env.ORDER_NOTIFICATION_EMAIL

  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY env var is not set' }
  }
  if (!toEmail) {
    return { success: false, error: 'ORDER_NOTIFICATION_EMAIL env var is not set' }
  }

  const resend = new Resend(apiKey)

  const { data, error } = await resend.emails.send({
    from:    'Luroni cvijeće <onboarding@resend.dev>',
    to:      [toEmail],
    subject: 'Nova narudžba buketa - Luroni cvijeće',
    html:    buildEmailHtml(order),
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, messageId: data?.id }
}
