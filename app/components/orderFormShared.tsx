export const orderFormInputBase =
  'w-full px-3.5 py-3 text-[0.9375rem] bg-cream border-[1.5px] rounded-lg outline-none transition-all placeholder:text-faint focus:bg-white focus:shadow-[0_0_0_3px_rgba(62,107,78,0.13)]'

export function inputCls(err?: string) {
  return `${orderFormInputBase} ${err ? 'border-red-400 focus:border-red-400' : 'border-divider focus:border-forest'}`
}

export function selectCls(err?: string) {
  return `${inputCls(err)} bg-[image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23777' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")] bg-no-repeat bg-[position:right_12px_center] pr-10 appearance-none`
}

export function Field({
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

export function PaymentOption({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <label className="flex-1 flex items-center gap-2.5 px-4 py-3 rounded-lg border-[1.5px] border-divider cursor-pointer select-none transition-colors has-[input:checked]:border-forest has-[input:checked]:bg-forest-light">
      <input type="radio" name="payment" value={value} className="sr-only" />
      {icon}
      <span className="text-sm font-medium text-ink">{label}</span>
    </label>
  )
}

export function CreditCardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" className="flex-shrink-0 text-muted">
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )
}

export function CashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" className="flex-shrink-0 text-muted">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  )
}
