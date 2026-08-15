'use client'

interface SelectBouquetCtaProps {
  size: string
  customBudget?: number
  className?: string
  children: React.ReactNode
}

/**
 * Shared CTA for bouquet cards. Dispatches `luroni:selectBouquet` so OrderForm
 * can pre-select the matching option, then scrolls to #order.
 */
export function SelectBouquetCta({
  size,
  customBudget,
  className,
  children,
}: SelectBouquetCtaProps) {
  function handleClick() {
    window.dispatchEvent(
      new CustomEvent('luroni:selectBouquet', {
        detail: { size, ...(typeof customBudget === 'number' ? { customBudget } : {}) },
      }),
    )
    document.getElementById('order')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <a href="#order" onClick={handleClick} className={className}>
      {children}
    </a>
  )
}
