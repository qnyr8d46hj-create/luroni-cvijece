import { Resend }                  from 'resend'
import { NextRequest, NextResponse } from 'next/server'

// ── POST /api/send-contact-email ───────────────────────────────
//
// Sends a contact-form enquiry to the shop owner via Resend.
// Mirrors the same pattern as sendOrderNotificationEmail so it
// works reliably on Vercel serverless.
//
// Required env vars:
//   RESEND_API_KEY            — Resend secret key
//   ORDER_NOTIFICATION_EMAIL  — recipient (shop owner inbox)

export async function POST(req: NextRequest) {

  console.log('[Contact] POST /api/send-contact-email received')

  // ── Parse body ────────────────────────────────────────────
  let name: string, email: string, message: string

  try {
    ;({ name, email, message } = await req.json())
  } catch {
    console.error('[Contact] Failed to parse request body')
    return NextResponse.json({ error: 'Neispravan zahtjev.' }, { status: 400 })
  }

  // ── Server-side validation ────────────────────────────────
  const nameVal    = (name    ?? '').trim()
  const emailVal   = (email   ?? '').trim()
  const messageVal = (message ?? '').trim()

  if (nameVal.length < 2) {
    console.warn('[Contact] Validation failed: name too short')
    return NextResponse.json({ error: 'Unesite ispravno ime.' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
    console.warn('[Contact] Validation failed: invalid email')
    return NextResponse.json({ error: 'Unesite ispravnu email adresu.' }, { status: 400 })
  }
  if (messageVal.length < 5) {
    console.warn('[Contact] Validation failed: message too short')
    return NextResponse.json({ error: 'Unesite poruku.' }, { status: 400 })
  }

  // ── Guard: env vars ───────────────────────────────────────
  const apiKey  = process.env.RESEND_API_KEY
  const toEmail = process.env.ORDER_NOTIFICATION_EMAIL

  if (!apiKey) {
    console.error('[Contact] FATAL: RESEND_API_KEY is not set')
    return NextResponse.json(
      { error: 'Slanje nije uspjelo. Pokušajte ponovo.' },
      { status: 500 },
    )
  }
  if (!toEmail) {
    console.error('[Contact] FATAL: ORDER_NOTIFICATION_EMAIL is not set')
    return NextResponse.json(
      { error: 'Slanje nije uspjelo. Pokušajte ponovo.' },
      { status: 500 },
    )
  }

  console.log(`[Contact] Sending enquiry — name: "${nameVal}", from: ${emailVal}, to: ${toEmail}`)

  // ── Send via Resend ───────────────────────────────────────
  // Always use the verified sandbox sender — matches the working order email flow.
  // Never use RESEND_FROM_EMAIL here because luroni.hr is not yet verified on Resend.
  const resend = new Resend(apiKey)

  const { data, error } = await resend.emails.send({
    from:    'Luroni cvijeće <onboarding@resend.dev>',
    to:      [toEmail],
    subject: 'Novi upit s kontakt forme - Luroni cvijeće',
    html:    buildHtml(nameVal, emailVal, messageVal),
  })

  if (error) {
    console.error('[Contact] Resend error:', error)
    return NextResponse.json(
      { error: 'Slanje nije uspjelo. Pokušajte ponovo.' },
      { status: 500 },
    )
  }

  console.log(`[Contact] ✓ Email sent — Resend messageId: ${data?.id}`)
  return NextResponse.json({ success: true })
}

// ── HTML email template ────────────────────────────────────────
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildHtml(name: string, email: string, message: string): string {
  const msgHtml = esc(message).replace(/\n/g, '<br>')

  return `<!DOCTYPE html>
<html lang="hr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Novi upit s kontakt forme</title>
</head>
<body style="margin:0;padding:24px 16px;background:#f0ede8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.10);">

    <!-- Header -->
    <div style="background:#3e6b4e;padding:32px 36px;">
      <p style="margin:0 0 6px 0;color:rgba(255,255,255,0.65);font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">Luroni cvijeće</p>
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;line-height:1.3;">Novi upit s kontakt forme</h1>
    </div>

    <!-- Body -->
    <div style="padding:32px 36px 24px;">
      <table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;margin-bottom:24px;">
        <tr>
          <td style="padding:11px 16px;background:#f9f8f6;color:#5e5e5e;font-size:13px;font-weight:600;white-space:nowrap;width:30%;border-bottom:1px solid #f0ede8;">Ime</td>
          <td style="padding:11px 16px;background:#f9f8f6;color:#1a1a1a;font-size:14px;border-bottom:1px solid #f0ede8;">${esc(name)}</td>
        </tr>
        <tr>
          <td style="padding:11px 16px;background:#ffffff;color:#5e5e5e;font-size:13px;font-weight:600;white-space:nowrap;width:30%;border-bottom:1px solid #f0ede8;">Email</td>
          <td style="padding:11px 16px;background:#ffffff;color:#1a1a1a;font-size:14px;border-bottom:1px solid #f0ede8;">
            <a href="mailto:${esc(email)}" style="color:#3e6b4e;text-decoration:none;">${esc(email)}</a>
          </td>
        </tr>
      </table>

      <h2 style="margin:0 0 12px 0;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9a9a9a;">Poruka</h2>
      <div style="background:#f9f8f6;border:1px solid #e8e3dc;border-radius:10px;padding:18px;">
        <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.75;">${msgHtml}</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:18px 36px;background:#f9f8f6;border-top:1px solid #e8e3dc;text-align:center;">
      <p style="margin:0;color:#9a9a9a;font-size:12px;">Luroni cvijeće &mdash; online narudžba buketa s dostavom</p>
    </div>

  </div>
</body>
</html>`
}
