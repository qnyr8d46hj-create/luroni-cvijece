'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  coerceDeliveryTime,
  getDeliveryRestrictionNotice,
  getUnavailableDeliveryMessage,
  isDeliveryDateBlocked,
  isDeliveryTimeOptionDisabled,
} from '@/lib/orderAvailability'
import { DELIVERY_CITIES } from '@/lib/deliveryLocations'
import {
  validateAddress,
  validateCity,
  validateDeliveryDate,
  validateEmail,
  validateFullName,
  validatePhone,
} from '@/lib/orderFieldValidation'
import { ARTIFICIAL_BOUQUET_PAGE_PATH } from '@/lib/artificialBouquetPaths'
import { formatEuro } from '@/lib/productPrices'
import {
  CashIcon,
  CreditCardIcon,
  Field,
  inputCls,
  PaymentOption,
  selectCls,
  orderFormInputBase as base,
} from './orderFormShared'

export type ArtificialOrderProduct = {
  sku: string
  name: string
  priceEur: number
  image: string
}

const REQUIRED = ['fullName', 'phone', 'email', 'address', 'city', 'deliveryDate'] as const

function validate(name: string, value: string): string {
  switch (name) {
    case 'fullName':     return validateFullName(value)
    case 'phone':        return validatePhone(value)
    case 'email':        return validateEmail(value)
    case 'address':      return validateAddress(value)
    case 'city':         return validateCity(value)
    case 'deliveryDate': return validateDeliveryDate(value)
    default: return ''
  }
}

export function ArtificialOrderForm({ product }: { product: ArtificialOrderProduct }) {
  const [errors, setErrors]           = useState<Record<string, string>>({})
  const [paymentErr, setPaymentErr]   = useState('')
  const [loading, setLoading]         = useState(false)
  const [submitted, setSubmitted]     = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [stripeRedirecting, setStripeRedirecting] = useState(false)
  const [orderingBlocked, setOrderingBlocked] = useState(false)
  const [blockNotice, setBlockNotice]         = useState<string | null>(null)
  const [deliveryDate, setDeliveryDate]       = useState('')
  const [deliveryTime, setDeliveryTime]       = useState('')

  useEffect(() => {
    fetch('/api/order-status')
      .then(r => r.json())
      .then(({ available, notice }: { available: boolean; notice: string | null }) => {
        if (!available) {
          setOrderingBlocked(true)
          setBlockNotice(notice)
        }
      })
      .catch(() => {})
  }, [])

  const today = new Date().toLocaleDateString('sv')
  const restrictionNotice = getDeliveryRestrictionNotice(deliveryDate)

  function onBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setErrors(prev => ({ ...prev, [name]: validate(name, value) }))
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: validate(name, value) }))
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

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

    const dateVal = String(data.get('deliveryDate') ?? '')
    const timeVal = String(data.get('deliveryTime') ?? '')
    const slotMsg = getUnavailableDeliveryMessage(dateVal, timeVal)
    if (slotMsg) {
      if (isDeliveryDateBlocked(dateVal)) {
        newErrors.deliveryDate = slotMsg
      } else {
        newErrors.deliveryTime = slotMsg
      }
      ok = false
    }

    setErrors(newErrors)

    const payment = (form.querySelector('[name="payment"]:checked') as HTMLInputElement | null)?.value
    if (!payment) { setPaymentErr('Odaberite način plaćanja.'); ok = false }
    else            { setPaymentErr('') }

    if (!ok) {
      form.querySelector<HTMLElement>('.border-red-400')?.focus()
      return
    }

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'begin_checkout', {
        currency: 'EUR',
        value: product.priceEur,
        payment_method: payment,
        delivery_city: String(data.get('city') ?? ''),
        items: [
          {
            item_id: product.sku,
            item_name: product.name,
            price: product.priceEur,
            quantity: 1,
          },
        ],
      })
    }

    setLoading(true)
    setSubmitError('')

    let navigatingToStripe = false

    try {
      const res = await fetch('/api/create-artificial-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          sku:             product.sku,
          paymentMethod:   payment,
          fullName:        String(data.get('fullName')     ?? '').trim(),
          phone:           String(data.get('phone')        ?? '').trim(),
          email:           String(data.get('email')        ?? '').trim(),
          deliveryAddress: String(data.get('address')      ?? '').trim(),
          deliveryCity:    String(data.get('city')         ?? '').trim(),
          deliveryDate:    String(data.get('deliveryDate') ?? ''),
          deliveryTime:    String(data.get('deliveryTime') ?? ''),
          cardMessage:     String(data.get('message')      ?? '').trim(),
        }),
      })

      const result = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(result.error ?? 'Order creation failed')
      }

      if (payment === 'card') {
        if (!result.url) throw new Error('Checkout session creation failed')
        setStripeRedirecting(true)
        navigatingToStripe = true
        window.location.href = result.url
      } else {
        setSubmitted(true)
      }
    } catch (err) {
      console.error('Artificial order submission failed:', err)
      setSubmitError(
        'Došlo je do greške. Molimo pokušajte ponovno ili nas kontaktirajte na info.luroni@gmail.com.',
      )
    } finally {
      if (!navigatingToStripe) setLoading(false)
    }
  }

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

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="flex gap-4 p-4 rounded-2xl bg-cream border border-divider">
        <div className="relative w-20 h-[6.67rem] flex-shrink-0 overflow-hidden rounded-xl bg-[#f3eee8]">
          <Image
            src={product.image}
            alt={product.name}
            fill
            unoptimized
            className="object-contain object-center"
            sizes="80px"
          />
        </div>
        <div className="min-w-0">
          <p className="font-display text-xl font-semibold text-ink leading-tight">{product.name}</p>
          <p className="text-xs font-semibold tracking-[0.08em] uppercase text-faint mt-1">{product.sku}</p>
          <p className="text-[1.15rem] font-bold text-forest mt-2">{formatEuro(product.priceEur)}</p>
          <p className="text-xs text-muted mt-1">Količina: 1</p>
        </div>
      </div>

      <Field label="Ime i prezime" required error={errors.fullName}>
        <input
          type="text" name="fullName" id="artificial-fullName"
          placeholder="Ana Horvat" autoComplete="name"
          onBlur={onBlur} onChange={onChange}
          className={inputCls(errors.fullName)}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Broj mobitela" required error={errors.phone}>
          <input
            type="tel" name="phone" id="artificial-phone"
            placeholder="+385 91 234 5678" autoComplete="tel"
            onBlur={onBlur} onChange={onChange}
            className={inputCls(errors.phone)}
          />
        </Field>
        <Field label="Email" required error={errors.email}>
          <input
            type="email" name="email" id="artificial-email"
            placeholder="ana@email.com" autoComplete="email"
            onBlur={onBlur} onChange={onChange}
            className={inputCls(errors.email)}
          />
        </Field>
      </div>

      <Field label="Adresa dostave" required error={errors.address}>
        <input
          type="text" name="address" id="artificial-address"
          placeholder="Ulica i broj" autoComplete="street-address"
          onBlur={onBlur} onChange={onChange}
          className={inputCls(errors.address)}
        />
      </Field>

      <div>
        <Field label="Mjesto dostave" required error={errors.city}>
          <select
            name="city" id="artificial-city" defaultValue=""
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
          županiji i na otoku Krku. Dostava je besplatna.
        </p>
      </div>

      <div>
        <p className="text-sm text-muted leading-[1.55] mb-3">
          Naručite do 14:00 za dostavu isti dan, ovisno o dostupnosti.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Datum dostave" required error={errors.deliveryDate}>
            <input
              type="date" name="deliveryDate" id="artificial-deliveryDate"
              min={today}
              value={deliveryDate}
              onBlur={onBlur}
              onChange={(e) => {
                const value = e.target.value
                const nextTime = coerceDeliveryTime(value, deliveryTime)
                setDeliveryDate(value)
                if (nextTime !== deliveryTime) setDeliveryTime(nextTime)
                const dateErr = validateDeliveryDate(value)
                const timeMsg = getUnavailableDeliveryMessage(value, nextTime)
                setErrors(prev => ({
                  ...prev,
                  deliveryDate: dateErr,
                  deliveryTime: timeMsg && !isDeliveryDateBlocked(value) ? timeMsg : '',
                }))
              }}
              className={inputCls(errors.deliveryDate)}
            />
          </Field>
          <Field label="Željeno vrijeme" error={errors.deliveryTime}>
            <select
              name="deliveryTime"
              id="artificial-deliveryTime"
              value={deliveryTime}
              onChange={(e) => {
                const value = e.target.value
                setDeliveryTime(value)
                setErrors(prev => ({
                  ...prev,
                  deliveryTime: getUnavailableDeliveryMessage(deliveryDate, value) ?? '',
                }))
              }}
              className={selectCls(errors.deliveryTime)}
            >
              <option value="" disabled={isDeliveryTimeOptionDisabled(deliveryDate, '')}>
                Bilo kada
              </option>
              <option value="08-12" disabled={isDeliveryTimeOptionDisabled(deliveryDate, '08-12')}>
                08:00 – 12:00
              </option>
              <option value="12-16" disabled={isDeliveryTimeOptionDisabled(deliveryDate, '12-16')}>
                12:00 – 16:00
              </option>
              <option value="16-20" disabled={isDeliveryTimeOptionDisabled(deliveryDate, '16-20')}>
                16:00 – 20:00
              </option>
            </select>
          </Field>
        </div>
        {restrictionNotice && (
          <p className="text-sm text-muted leading-[1.55] mt-3" role="status">
            {restrictionNotice}
          </p>
        )}
      </div>

      <Field label="Poruka za karticu / napomena">
        <textarea
          name="message" id="artificial-message" rows={3}
          placeholder="Npr. Poruka uz aranžman ili napomena za dostavu"
          className={`${base} border-divider focus:border-forest resize-y min-h-24`}
        />
      </Field>

      <fieldset>
        <legend className="block text-sm font-semibold text-ink mb-2">
          Način plaćanja <span className="text-rose">*</span>
        </legend>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <PaymentOption value="card" label="Kartica online"       icon={<CreditCardIcon />} />
          <PaymentOption value="cash" label="Gotovina pri dostavi" icon={<CashIcon />} />
        </div>
        {paymentErr && <p className="text-xs text-red-600 mt-1.5" role="alert">{paymentErr}</p>}
      </fieldset>

      {blockNotice && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-forest-light border border-forest/20 text-sm text-ink" role="alert">
          {blockNotice}
        </div>
      )}

      {submitError && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700" role="alert">
          {submitError}
        </div>
      )}

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

      <p className="text-center text-sm text-muted">
        <Link href={ARTIFICIAL_BOUQUET_PAGE_PATH} className="text-forest underline-offset-2 hover:underline">
          Natrag na katalog aranžmana
        </Link>
      </p>
    </form>
  )
}
