'use client'

import { useState } from 'react'

// ── Input class helpers — mirrors OrderForm styling ────────────
const inputBase =
  'w-full px-3.5 py-3 text-[0.9375rem] bg-cream border-[1.5px] rounded-lg outline-none ' +
  'transition-all placeholder:text-faint ' +
  'focus:bg-white focus:shadow-[0_0_0_3px_rgba(62,107,78,0.13)]'

function inputCls(err?: string) {
  return `${inputBase} ${
    err ? 'border-red-400 focus:border-red-400' : 'border-divider focus:border-forest'
  }`
}

// ── Field wrapper ──────────────────────────────────────────────
function Field({
  label,
  error,
  children,
}: {
  label:    string
  error?:   string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-ink mb-1.5">
        {label}
        <span className="text-rose ml-0.5" aria-hidden="true">*</span>
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// ── Contact info items ─────────────────────────────────────────
interface InfoItem { emoji: string; text: string; href?: string }

const INFO_ITEMS: InfoItem[] = [
  { emoji: '📧', text: 'info@luroni.hr',                    href: 'mailto:info@luroni.hr' },
  { emoji: '🚚', text: 'Dostava: Rijeka, okolica i otok Krk'                              },
  { emoji: '⏰', text: 'Narudžbe zaprimamo 0-24'                                          },
]

// ── Validation helpers ─────────────────────────────────────────
function validateFields(
  name: string,
  email: string,
  message: string,
): Record<string, string> {
  const e: Record<string, string> = {}
  if (name.trim().length < 2)
    e.name = 'Unesite ispravno ime.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    e.email = 'Unesite ispravnu email adresu.'
  if (message.trim().length < 5)
    e.message = 'Unesite poruku.'
  return e
}

// ── Success state ──────────────────────────────────────────────
function SuccessMessage() {
  return (
    <div className="flex flex-col items-center text-center py-10 gap-4">
      <div
        className="w-14 h-14 rounded-full bg-forest-light flex items-center justify-center"
        style={{ animation: 'pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both' }}
        aria-hidden="true"
      >
        <svg
          width="26" height="26" viewBox="0 0 24 24"
          fill="none" stroke="#3e6b4e" strokeWidth="2.5"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h3 className="font-display text-2xl font-semibold text-ink">
        Upit je poslan!
      </h3>
      <p className="text-[0.9375rem] text-muted leading-[1.75] max-w-xs">
        Hvala na upitu! Javit ćemo vam se u najkraćem mogućem roku.
      </p>
    </div>
  )
}

// ── Main section ───────────────────────────────────────────────
export function ContactSection() {
  const [name,        setName]        = useState('')
  const [email,       setEmail]       = useState('')
  const [message,     setMessage]     = useState('')
  const [errors,      setErrors]      = useState<Record<string, string>>({})
  const [loading,     setLoading]     = useState(false)
  const [submitted,   setSubmitted]   = useState(false)
  const [submitError, setSubmitError] = useState('')

  function clearFieldError(field: string) {
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const errs = validateFields(name, email, message)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setLoading(true)
    setSubmitError('')

    try {
      const res  = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:    name.trim(),
          email:   email.trim(),
          message: message.trim(),
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setSubmitError(data.error ?? 'Slanje nije uspjelo. Pokušajte ponovo.')
      } else {
        setSubmitted(true)
      }
    } catch {
      setSubmitError(
        'Slanje nije uspjelo. Provjerite internetsku vezu i pokušajte ponovo.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      id="kontakt"
      className="py-20 md:py-28 bg-cream"
      aria-labelledby="kontakt-title"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-start">

          {/* ── Left — title, subtitle, contact info ──────────── */}
          <div>
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] uppercase text-forest mb-3">
              Kontakt
            </p>
            <h2
              id="kontakt-title"
              className="font-display text-4xl sm:text-[2.75rem] font-semibold text-ink mb-5 leading-[1.2]"
            >
              Kontaktirajte nas
            </h2>
            <p className="text-base sm:text-[1.0625rem] text-muted leading-[1.75] mb-10">
              Trebate buket za rođendan, godišnjicu ili posebnu prigodu?{' '}
              Pošaljite upit i odgovorit ćemo u najkraćem mogućem roku.
            </p>

            <ul className="space-y-3" aria-label="Kontakt informacije">
              {INFO_ITEMS.map((item) => (
                <li
                  key={item.text}
                  className="flex items-center gap-4 px-5 py-4 bg-white border-[1.5px] border-divider rounded-2xl"
                >
                  <span className="text-xl leading-none shrink-0" aria-hidden="true">
                    {item.emoji}
                  </span>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-[0.9375rem] font-medium text-forest hover:underline underline-offset-2"
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span className="text-[0.9375rem] font-medium text-ink">
                      {item.text}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* ── Right — form card ─────────────────────────────── */}
          <div className="bg-white border-[1.5px] border-divider rounded-3xl p-5 sm:p-8 shadow-lg lg:sticky lg:top-24">

            {submitted ? (
              <SuccessMessage />
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">

                <Field label="Ime" error={errors.name}>
                  <input
                    type="text"
                    value={name}
                    onChange={e => { setName(e.target.value); clearFieldError('name') }}
                    placeholder="Vaše ime"
                    autoComplete="name"
                    className={inputCls(errors.name)}
                  />
                </Field>

                <Field label="Email" error={errors.email}>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); clearFieldError('email') }}
                    placeholder="vas@email.com"
                    autoComplete="email"
                    className={inputCls(errors.email)}
                  />
                </Field>

                <Field label="Poruka" error={errors.message}>
                  <textarea
                    value={message}
                    onChange={e => { setMessage(e.target.value); clearFieldError('message') }}
                    placeholder="Opišite što trebate — veličina buketa, prigoda, željeni termin…"
                    rows={5}
                    className={`${inputCls(errors.message)} resize-none`}
                  />
                </Field>

                {submitError && (
                  <p
                    className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
                    role="alert"
                  >
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full bg-forest text-white
                    text-[0.9375rem] font-semibold tracking-[0.02em]
                    transition-all duration-200
                    hover:bg-forest-dark
                    disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Slanje…' : 'Pošalji upit'}
                </button>

              </form>
            )}

          </div>

        </div>
      </div>
    </section>
  )
}
