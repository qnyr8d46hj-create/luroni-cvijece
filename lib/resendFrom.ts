const SANDBOX_FROM = 'Luroni cvijeće <onboarding@resend.dev>'

/** Use the custom domain only when it is explicitly marked verified. */
export function orderEmailFromAddress(): string {
  if (process.env.RESEND_DOMAIN_VERIFIED === 'true' && process.env.RESEND_FROM_EMAIL) {
    return `Luroni cvijeće <${process.env.RESEND_FROM_EMAIL}>`
  }
  return SANDBOX_FROM
}
