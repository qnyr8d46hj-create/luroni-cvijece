import { Resend }           from 'resend'
import { NextRequest, NextResponse } from 'next/server'

// ── Resend client — server-side only ──────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY!)

// ── POST /api/contact ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  let name: string, email: string, message: string

  try {
    ;({ name, email, message } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Neispravan zahtjev.' }, { status: 400 })
  }

  // ── Server-side validation ────────────────────────────────
  const nameVal    = (name    ?? '').trim()
  const emailVal   = (email   ?? '').trim()
  const messageVal = (message ?? '').trim()

  if (nameVal.length < 2) {
    return NextResponse.json({ error: 'Unesite ispravno ime.' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
    return NextResponse.json({ error: 'Unesite ispravnu email adresu.' }, { status: 400 })
  }
  if (messageVal.length < 5) {
    return NextResponse.json({ error: 'Unesite poruku.' }, { status: 400 })
  }

  // ── Resolve addresses ─────────────────────────────────────
  // CONTACT_EMAIL — dedicated inbox for contact form (optional, falls back to order email)
  const toEmail = (
    process.env.CONTACT_EMAIL ??
    process.env.ORDER_NOTIFICATION_EMAIL ??
    'info@luroni.hr'
  )

  // Use RESEND_FROM_EMAIL if set (verified domain), otherwise fall back to sandbox sender.
  const fromEmail = process.env.RESEND_FROM_EMAIL
    ? `Luroni cvijeće <${process.env.RESEND_FROM_EMAIL}>`
    : 'Luroni cvijeće <onboarding@resend.dev>'

  console.log(`[Contact] Sending enquiry from "${nameVal}" <${emailVal}> to ${toEmail}`)

  // ── Send via Resend ───────────────────────────────────────
  const { error } = await resend.emails.send({
    from:    fromEmail,
    to:      [toEmail],
    replyTo: emailVal,          // one-click reply goes straight back to the customer
    subject: `Upit od ${nameVal} — Luroni cvijeće`,
    html:    buildHtml(nameVal, emailVal, messageVal),
  })

  if (error) {
    console.error('[Contact] Resend error:', error)
    return NextResponse.json(
      { error: 'Slanje nije uspjelo. Pokušajte ponovo.' },
      { status: 500 },
    )
  }

  console.log(`[Contact] ✓ Email sent — from "${nameVal}" to ${toEmail}`)
  return NextResponse.json({ success: true })
}

// ── HTML email template ────────────────────────────────────────
function esc(s: string) {
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
  <title>Upit — Luroni cvijeće</title>
</head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#faf9f6;margin:0;padding:32px 16px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;
              padding:32px;border:1px solid #e5e0d8;">

    <!-- Header -->
    <h2 style="margin:0 0 4px;font-size:22px;color:#1a1a1a;">
      Novi upit putem kontakt forme
    </h2>
    <p style="margin:0 0 28px;font-size:13px;color:#9a9a9a;">
      luroni-cvijece.com — kontakt forma
    </p>

    <!-- Sender details -->
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
      <tr>
        <td style="padding:8px 0;color:#5e5e5e;width:80px;vertical-align:top;">Ime</td>
        <td style="padding:8px 0;color:#1a1a1a;font-weight:600;">${esc(name)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#5e5e5e;vertical-align:top;">Email</td>
        <td style="padding:8px 0;">
          <a href="mailto:${esc(email)}" style="color:#3e6b4e;text-decoration:none;">
            ${esc(email)}
          </a>
        </td>
      </tr>
    </table>

    <!-- Message body -->
    <div style="background:#faf9f6;border:1px solid #e5e0d8;border-radius:10px;padding:18px;">
      <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#5e5e5e;
                text-transform:uppercase;letter-spacing:0.1em;">
        Poruka
      </p>
      <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.75;">
        ${msgHtml}
      </p>
    </div>

    <!-- Reply nudge -->
    <p style="margin:24px 0 0;font-size:12px;color:#9a9a9a;line-height:1.6;">
      Možete odgovoriti izravno na ovaj email — Reply-To je postavljen na
      <a href="mailto:${esc(email)}" style="color:#3e6b4e;">${esc(email)}</a>.
    </p>
  </div>
</body>
</html>`
}
