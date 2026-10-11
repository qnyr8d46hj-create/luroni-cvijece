import {
  getUnavailableDeliveryMessage,
  isDeliveryDateBlocked,
} from '@/lib/orderAvailability'
import { isDeliveryCity } from '@/lib/deliveryLocations'

export function validateFullName(value: string): string {
  return value.trim().length >= 2 ? '' : 'Unesite ime i prezime.'
}

export function validatePhone(value: string): string {
  return /^[\d\s+\-().]{7,}$/.test(value.trim()) ? '' : 'Unesite ispravan broj mobitela.'
}

export function validateEmail(value: string): string {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? '' : 'Unesite ispravnu email adresu.'
}

export function validateAddress(value: string): string {
  return value.trim().length >= 3 ? '' : 'Unesite adresu dostave.'
}

export function validateCity(value: string): string {
  return isDeliveryCity(value) ? '' : 'Molimo odaberite mjesto dostave.'
}

export function validateDeliveryDate(value: string): string {
  if (!value) return 'Odaberite datum dostave.'
  const d = new Date(value)
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  if (d < t) return 'Datum ne može biti u prošlosti.'
  if (isDeliveryDateBlocked(value)) {
    return getUnavailableDeliveryMessage(value, '') ?? ''
  }
  return ''
}

export function validatePaymentMethod(value: string): string {
  if (value === 'card' || value === 'cash') return ''
  return 'Odaberite način plaćanja.'
}

/** Server-side bundle of the same customer/delivery checks the forms use. */
export function validateOrderDeliveryFields(input: {
  fullName: string
  phone: string
  email: string
  deliveryAddress: string
  deliveryCity: string
  deliveryDate: string
  deliveryTime: string
}): string | null {
  const checks = [
    validateFullName(input.fullName),
    validatePhone(input.phone),
    validateEmail(input.email),
    validateAddress(input.deliveryAddress),
    validateCity(input.deliveryCity),
    validateDeliveryDate(input.deliveryDate),
  ]
  const first = checks.find(Boolean)
  if (first) return first
  return getUnavailableDeliveryMessage(input.deliveryDate, input.deliveryTime)
}
