'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ARTIFICIAL_BOUQUET_ORDER_PATH } from '@/lib/artificialBouquetPaths'
import { formatEuro } from '@/lib/productPrices'

type CatalogProduct = {
  sku: string
  name: string
  priceEur: number
  image: string
  available: boolean
}

function AvailabilityBadge({ available }: { available: boolean }) {
  if (available) {
    return (
      <span className="px-2.5 py-0.5 rounded-full bg-forest/[0.09] text-forest text-[0.7rem] font-bold tracking-wider uppercase">
        Dostupno
      </span>
    )
  }
  return (
    <span className="px-2.5 py-0.5 rounded-full bg-[#f3eee8] text-muted text-[0.7rem] font-bold tracking-wider uppercase">
      Trenutačno nedostupno
    </span>
  )
}

export function ArtificialProductCard({
  product,
  checkoutEnabled = false,
}: {
  product: CatalogProduct
  checkoutEnabled?: boolean
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = `${product.sku}-lightbox-title`

  function openLightbox() {
    dialogRef.current?.showModal()
  }

  function closeLightbox() {
    dialogRef.current?.close()
  }

  return (
    <article
      className={`flex flex-col h-full rounded-3xl bg-white border transition-all duration-300 ${
        product.available
          ? 'border-divider shadow-[0_1px_4px_rgba(0,0,0,0.07)]'
          : 'border-divider/80 opacity-80'
      }`}
      aria-label={`${product.name}, ${formatEuro(product.priceEur)}`}
    >
      <button
        type="button"
        onClick={openLightbox}
        aria-haspopup="dialog"
        aria-label={`Povećaj fotografiju: ${product.name}`}
        className="relative aspect-[3/4] w-full overflow-hidden rounded-t-3xl bg-[#f3eee8] cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-forest"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          unoptimized
          className="object-contain object-center"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
        />
      </button>

      <div className="flex flex-col flex-1 p-6">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h2 className="font-display text-2xl font-semibold text-ink leading-tight">
            {product.name}
          </h2>
          <span className="text-[1.4rem] font-bold text-forest whitespace-nowrap">
            {formatEuro(product.priceEur)}
          </span>
        </div>
        <p className="text-xs font-semibold tracking-[0.08em] uppercase text-faint mb-3">
          {product.sku}
        </p>
        <div className="mb-6">
          <AvailabilityBadge available={product.available} />
        </div>
        {product.available && checkoutEnabled ? (
          <Link
            href={`${ARTIFICIAL_BOUQUET_ORDER_PATH}?sku=${encodeURIComponent(product.sku)}`}
            className="mt-auto inline-flex items-center justify-center px-6 py-3 rounded-full bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors"
          >
            Naruči
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="mt-auto inline-flex items-center justify-center px-6 py-3 rounded-full bg-forest/45 text-white text-sm font-medium cursor-not-allowed"
          >
            {product.available ? 'Naručivanje uskoro' : 'Naruči'}
          </button>
        )}
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="fixed inset-0 m-0 max-w-none max-h-none w-full h-full bg-black/75 p-4 sm:p-8 open:flex items-center justify-center"
        onClick={(event) => {
          if (event.target === event.currentTarget) closeLightbox()
        }}
        onCancel={closeLightbox}
      >
        <div className="relative flex max-h-full w-full max-w-[min(92vw,720px)] flex-col items-center">
          <button
            type="button"
            onClick={closeLightbox}
            className="mb-3 self-end min-h-11 px-4 rounded-full bg-white/95 text-ink text-sm font-medium shadow-sm hover:bg-white"
          >
            Zatvori
          </button>
          <Image
            src={product.image}
            alt={product.name}
            width={1200}
            height={1600}
            unoptimized
            className="max-h-[min(90vh,960px)] w-auto max-w-full h-auto object-contain object-center bg-[#f3eee8] rounded-2xl"
          />
          <p id={titleId} className="mt-3 text-white text-sm font-medium">
            {product.name}
          </p>
        </div>
      </dialog>
    </article>
  )
}
