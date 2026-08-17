'use client'

import { useState, useEffect } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

/* ── Standard bouquet prices ──────────────────────────────────── */
const BOUQUET_PRICES: Record<string, number> = { S: 35, M: 45, L: 60 }

/* ── Custom bouquet price range ───────────────────────────────────
   Keep in sync with CUSTOM_BUDGET_* in create-checkout-session/route.ts */
const CUSTOM_PRICE_MIN  = 70
const CUSTOM_PRICE_MAX  = 200
const CUSTOM_PRICE_STEP = 10

/* ── Delivery locations ────────────────────────────────────────
   To add or remove a city: edit this array only.
   The selected value is saved as-is to Firestore (deliveryCity).  */
const DELIVERY_CITIES = [
  'Bakar',
  'Crikvenica',
  'Čavle',
  'Dražice',
  'Hreljin',
  'Ičići',
  'Ika',
  'Jelenje',
  'Kastav',
  'Klana',
  'Kostrena',
  'Kraljevica',
  'Kukuljanovo',
  'Lovran',
  'Matulji',
  'Novi Vinodolski',
  'Opatija',
  'Otok Krk',
  'Rijeka',
  'Selce',
  'Šmrika',
  'Viškovo',
] as const

/* ── Validation ───────────────────────────────────────────────── */
const REQUIRED = ['fullName', 'phone', 'email', 'address', 'city', 'bouquetSize', 'deliveryDate'] as const

function validate(name: string, value: string): string {
  switch (name) {
    case 'fullName':     return value.trim().length >= 2 ? '' : 'Unesite ime i prezime.'
    case 'phone':        return /^[\d\s+\-().]{7,}$/.test(value.trim()) ? '' : 'Unesite ispravan broj mobitela.'
    case 'email':        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? '' : 'Unesite ispravnu email adresu.'
    case 'address':      return value.trim().length >= 3 ? '' : 'Unesite adresu dostave.'
    case 'city':         return (DELIVERY_CITIES as readonly string[]).includes(value) ? '' : 'Molimo odaberite mjesto dostave.'
    case 'bouquetSize':  return value ? '' : 'Odaberite veličinu buketa.'
    case 'deliveryDate': {
      if (!value) return 'Odaberite datum dostave.'
      const d = new Date(value), t = new Date()
      t.setHours(0, 0, 0, 0)
      return d >= t ? '' : 'Datum ne može biti u prošlosti.'
    }
    default: return ''
  }
}

/* ── Shared input class helpers ───────────────────────────────── */
const base =
  'w-full px-3.5 py-3 text-[0.9375rem] bg-cream border-[1.5px] rounded-lg outline-none transition-all placeholder:text-faint focus:bg-white focus:shadow-[0_0_0_3px_rgba(62,107,78,0.13)]'

function inputCls(err?: string) {
  return `${base} ${err ? 'border-red-400 focus:border-red-400' : 'border-divider focus:border-forest'}`
}
function selectCls(err?: string) {
  return `${inputCls(err)} bg-[image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23777' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")] bg-no-repeat bg-[position:right_12px_center] pr-10 appearance-none`
}

/* ── Sub-components ───────────────────────────────────────────── */
function Field({
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-ink mb-1.5">
        {label}
        {required && <span className="text-rose ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1" role="alert">{error}</p>}
    </div>
  )
}

function PaymentOption({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <label className="flex-1 flex items-center gap-2.5 px-4 py-3 rounded-lg border-[1.5px] border-divider cursor-pointer select-none transition-colors has-[input:checked]:border-forest has-[input:checked]:bg-forest-light">
      <input type="radio" name="payment" value={value} className="sr-only" />
      {icon}
      <span className="text-sm font-medium text-ink">{label}</span>
    </label>
  )
}

/* ── Stepper used inside the form for Buket po želji ─────────── */
function BudgetStepper({
  value, onChange,
}: {
  value: number
  onChange: (next: number) => void
}) {
  const canDec = value > CUSTOM_PRICE_MIN
  const canInc = value < CUSTOM_PRICE_MAX

  const btnCls =
    'w-10 h-10 flex items-center justify-center border-[1.5px] border-divider bg-cream text-ink text-lg font-medium ' +
    'transition-colors hover:bg-forest-light hover:border-forest ' +
    'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-cream disabled:hover:border-divider'

  return (
    <div>
      <div className="flex items-stretch" role="group" aria-label="Odabir budžeta">
        <button
          type="button"
          onClick={() => canDec && onChange(value - CUSTOM_PRICE_STEP)}
          disabled={!canDec}
          aria-label={`Smanji budžet za ${CUSTOM_PRICE_STEP} €`}
          className={`${btnCls} rounded-l-lg border-r-0`}
        >
          −
        </button>
        <div
          className="flex items-center justify-center min-w-[6rem] px-3 border-y-[1.5px] border-divider bg-white"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="text-[1.1rem] font-bold text-forest tabular-nums">{value}&nbsp;€</span>
        </div>
        <button
          type="button"
          onClick={() => canInc && onChange(value + CUSTOM_PRICE_STEP)}
          disabled={!canInc}
          aria-label={`Povećaj budžet za ${CUSTOM_PRICE_STEP} €`}
          className={`${btnCls} rounded-r-lg border-l-0`}
        >
          +
        </button>
      </div>
      <p className="text-[0.6875rem] text-faint mt-1.5">
        {CUSTOM_PRICE_MIN}–{CUSTOM_PRICE_MAX}&nbsp;€, korak {CUSTOM_PRICE_STEP}&nbsp;€
      </p>
    </div>
  )
}

/* ── Main form ────────────────────────────────────────────── */
export function OrderForm() {
  const [errors, setErrors]           = useState<Record<string, string>>({})
  const [paymentErr, setPaymentErr]   = useState('')
  const [loading, setLoading]         = useState(false)
  const [submitted, setSubmitted]     = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [stripeRedirecting, setStripeRedirecting] = useState(false)

  // Temporary ordering restriction — fetched from server on mount so the
  // result is based on Europe/Zagreb server time, not the browser clock.
  // Remove this block (and the notice JSX below) once the restriction is lifted.
  const [orderingBlocked, setOrderingBlocked] = useState(false)
  const [blockNotice, setBlockNotice]         = useState<string | null>(null)

  // Controlled bouquet selection state — driven by the select or by the
  // external 'luroni:selectBouquet' event fired by CustomBouquetCard.
  const [selectedBouquet, setSelectedBouquet] = useState('')
  const [customBudget, setCustomBudget]       = useState(CUSTOM_PRICE_MIN)

  // Fetch ordering availability from the server (Europe/Zagreb timezone).
  useEffect(() => {
    fetch('/api/order-status')
      .then(r => r.json())
      .then(({ available, notice }: { available: boolean; notice: string | null }) => {
        if (!available) {
          setOrderingBlocked(true)
          setBlockNotice(notice)
        }
      })
      .catch(() => {}) // fail open — don't block users if the check itself fails
  }, [])

  // Listen for CTA clicks from the CustomBouquetCard section above the form.
  useEffect(() => {
    function onSelect(e: Event) {
      const { size, customBudget: budget } =
        (e as CustomEvent<{ size: string; customBudget: number }>).detail
      setSelectedBouquet(size)
      if (typeof budget === 'number') setCustomBudget(budget)
      setErrors(prev => ({ ...prev, bouquetSize: '' }))
    }
    window.addEventListener('luroni:selectBouquet', onSelect)
    return () => window.removeEventListener('luroni:selectBouquet', onSelect)
  }, [])

  const today = new Date().toLocaleDateString('sv')

  function onBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setErrors(prev => ({ ...prev, [name]: validate(name, value) }))
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: validate(name, value) }))
  }

  const isCustom = selectedBouquet === 'Buket po želji'

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // Hard stop if the server confirmed ordering is blocked today
    if (orderingBlocked) {
      setSubmitError(blockNotice ?? 'Naručivanje trenutno nije dostupno.')
      return
    }

    const form = e.currentTarget
    const data = new FormData(form)
    let ok = true

    const newErrors: Record<string, string> = {}
    for (const field of REQUIRED) {
      const msg = validate(field, String(data.get(field) ?? ''))
      newErrors[field] = msg
      if (msg) ok = false
    }

    // Extra validation for custom budget
    if (isCustom) {
      const valid =
        customBudget >= CUSTOM_PRICE_MIN &&
        customBudget <= CUSTOM_PRICE_MAX &&
        customBudget % CUSTOM_PRICE_STEP === 0
      if (!valid) {
        newErrors.bouquetSize = 'Odaberite valjani iznos.'
        ok = false
      }
    }

    setErrors(newErrors)

    const payment = (form.querySelector('[name="payment"]:checked') as HTMLInputElement | null)?.value
    if (!payment) { setPaymentErr('Odaberite način plaćanja.'); ok = false }
    else            { setPaymentErr('') }

    if (!ok) {
      form.querySelector<HTMLElement>('.border-red-400')?.focus()
      return
    }

    const bouquetSizeValue = String(data.get('bouquetSize') ?? '')
    const bouquetPrice = isCustom
      ? customBudget
      : (BOUQUET_PRICES[bouquetSizeValue] ?? null)

    setLoading(true)
    setSubmitError('')

    let navigatingToStripe = false

    try {
      const orderPayload = {
        fullName:        String(data.get('fullName')     ?? '').trim(),
        phone:           String(data.get('phone')        ?? '').trim(),
        email:           String(data.get('email')        ?? '').trim(),
        deliveryAddress: String(data.get('address')      ?? '').trim(),
        deliveryCity:    String(data.get('city')         ?? '').trim(),
        bouquetSize:     bouquetSizeValue,
        bouquetPrice,
        deliveryDate:    String(data.get('deliveryDate') ?? ''),
        deliveryTime:    String(data.get('deliveryTime') ?? ''),
        cardMessage:     String(data.get('message')      ?? '').trim(),
        paymentMethod:   payment,
        ...(isCustom ? { customBudget } : {}),
      }

      if (payment === 'card') {
        const docRef = await addDoc(collection(db, 'orders'), {
          ...orderPayload,
          status:    'pending_payment',
          createdAt: serverTimestamp(),
        })

        const res = await fetch('/api/create-checkout-session', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            orderId:       docRef.id,
            bouquetSize:   bouquetSizeValue,
            customBudget:  isCustom ? customBudget : undefined,
            customerEmail: orderPayload.email,
            customerName:  orderPayload.fullName,
          }),
        })

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}))
          throw new Error(errBody.error ?? 'Checkout session creation failed')
        }

        const { url } = await res.json()
        setStripeRedirecting(true)
        navigatingToStripe = true
        window.location.href = url

      } else {
        await addDoc(collection(db, 'orders'), {
          ...orderPayload,
          status:    'new',
          createdAt: serverTimestamp(),
        })

        setSubmitted(true)

        fetch('/api/send-order-email', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(orderPayload),
        }).catch(err => console.error('[OrderForm] Email notification failed:', err))
      }

    } catch (err) {
      console.error('Order submission failed:', err)
      setSubmitError(
        'Došlo je do greške. Molimo pokušajte ponovno ili nas kontaktirajte na info.luroni@gmail.com.'
      )
    } finally {
      if (!navigatingToStripe) setLoading(false)
    }
  }

  /* ── Success state ─────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="flex flex-col items-center text-center py-14 px-6">
        <div className="w-16 h-16 rounded-full bg-forest flex items-center justify-center mb-6 animate-pop">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="font-display text-3xl font-semibold text-ink mb-3">Narudžba primljena!</h3>
        <p className="text-base text-muted leading-[1.7] max-w-sm">
          Hvala na narudžbi! Javit ćemo vam se uskoro radi potvrde dostupnosti i termina dostave.
        </p>
      </div>
    )
  }

  /* ── Form ──────────────────────────────────────────────── */
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">

      {/* Full name */}
      <Field label="Ime i prezime" required error={errors.fullName}>
        <input
          type="text" name="fullName" id="fullName"
          placeholder="Ana Horvat" autoComplete="name"
          onBlur={onBlur} onChange={onChange}
          className={inputCls(errors.fullName)}
        />
      </Field>

      {/* Phone + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Broj mobitela" required error={errors.phone}>
          <input
            type="tel" name="phone" id="phone"
            placeholder="+385 91 234 5678" autoComplete="tel"
            onBlur={onBlur} onChange={onChange}
            className={inputCls(errors.phone)}
          />
        </Field>
        <Field label="Email" required error={errors.email}>
          <input
            type="email" name="email" id="email"
            placeholder="ana@email.com" autoComplete="email"
            onBlur={onBlur} onChange={onChange}
            className={inputCls(errors.email)}
          />
        </Field>
      </div>

      {/* Address */}
      <Field label="Adresa dostave" required error={errors.address}>
        <input
          type="text" name="address" id="address"
          placeholder="Ulica i broj" autoComplete="street-address"
          onBlur={onBlur} onChange={onChange}
          className={inputCls(errors.address)}
        />
      </Field>

      {/* City */}
      <div>
        <Field label="Mjesto dostave" required error={errors.city}>
          <select
            name="city" id="city" defaultValue=""
            onBlur={onBlur} onChange={onChange}
            className={selectCls(errors.city)}
          >
            <option value="" disabled>Odaberite mjesto dostave</option>
            {DELIVERY_CITIES.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </Field>
        <p className="text-xs text-muted mt-2 leading-[1.55]">
          Dostava je trenutno dostupna na odabranim lokacijama u Primorsko-goranskoj
          županiji i na otoku Krku.
        </p>
        <p className="text-xs text-muted mt-1.5 leading-[1.55]">
          Ne vidite svoje mjesto?{' '}
          <a href="#contact" className="text-forest underline-offset-2 hover:underline">
            Kontaktirajte nas putem obrasca za kontakt
          </a>
          {' '}ili na{' '}
          <a href="mailto:info@luroni.hr" className="text-forest underline-offset-2 hover:underline">
            info@luroni.hr
          </a>
          {' '}i provjerit ćemo mogućnost dostave.
        </p>
      </div>

      {/* Bouquet size — controlled so the card CTA can pre-select */}
      <Field label="Veličina buketa" required error={errors.bouquetSize}>
        <select
          name="bouquetSize" id="bouquetSize"
          value={selectedBouquet}
          onChange={(e) => {
            setSelectedBouquet(e.target.value)
            if (errors.bouquetSize) {
              setErrors(prev => ({ ...prev, bouquetSize: validate('bouquetSize', e.target.value) }))
            }
          }}
          onBlur={(e) => {
            setErrors(prev => ({ ...prev, bouquetSize: validate('bouquetSize', e.target.value) }))
          }}
          className={selectCls(errors.bouquetSize)}
        >
          <option value="" disabled>Odaberite veličinu</option>
          <option value="S">Buket S — 35 €</option>
          <option value="M">Buket M — 45 €</option>
          <option value="L">Buket L — 60 €</option>
          <option value="Buket po želji">Buket po želji — od 70 €</option>
        </select>

        {/* Budget stepper — visible only when Buket po želji is selected */}
        {isCustom && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-ink mb-2">Odabrani budžet</p>
            <BudgetStepper
              value={customBudget}
              onChange={setCustomBudget}
            />
          </div>
        )}
      </Field>

      {/* Date + Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Datum dostave" required error={errors.deliveryDate}>
          <input
            type="date" name="deliveryDate" id="deliveryDate"
            min={today}
            onBlur={onBlur} onChange={onChange}
            className={inputCls(errors.deliveryDate)}
          />
        </Field>
        <Field label="Željeno vrijeme">
          <select name="deliveryTime" id="deliveryTime" className={selectCls()}>
            <option value="">Bilo kada</option>
            <option value="08-12">08:00 – 12:00</option>
            <option value="12-16">12:00 – 16:00</option>
            <option value="16-20">16:00 – 20:00</option>
          </select>
        </Field>
      </div>

      {/* Message */}
      <Field label="Poruka za karticu / napomena">
        <textarea
          name="message" id="message" rows={3}
          placeholder="Npr. Sretan rođendan, draga Ana!"
          className={`${base} border-divider focus:border-forest resize-y min-h-24`}
        />
      </Field>

      {/* Payment method */}
      <fieldset>
        <legend className="block text-sm font-semibold text-ink mb-2">
          Način plaćanja <span className="text-rose">*</span>
        </legend>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <PaymentOption value="card" label="Kartica online"        icon={<CreditCardIcon />} />
          <PaymentOption value="cash" label="Gotovina pri dostavi"  icon={<CashIcon />} />
        </div>
        {paymentErr && <p className="text-xs text-red-600 mt-1.5" role="alert">{paymentErr}</p>}
      </fieldset>

      {/* Ordering restriction notice */}
      {blockNotice && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-forest-light border border-forest/20 text-sm text-ink" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5 text-forest" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {blockNotice}
        </div>
      )}

      {/* Submit error */}
      {submitError && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {submitError}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading || orderingBlocked}
        className="w-full flex items-center justify-center gap-2.5 py-4 px-8 rounded-full bg-forest text-white font-medium text-[1.0625rem] transition-all hover:bg-forest-dark hover:-translate-y-px hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
      >
        {loading ? (
          <>
            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
            </svg>
            {stripeRedirecting ? 'Preusmjeravanje na plaćanje…' : 'Slanje narudžbe…'}
          </>
        ) : (
          'Pošalji narudžbu'
        )}
      </button>

    </form>
  )
}

function CreditCardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" className="flex-shrink-0 text-muted">
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )
}

function CashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" className="flex-shrink-0 text-muted">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  )
}
