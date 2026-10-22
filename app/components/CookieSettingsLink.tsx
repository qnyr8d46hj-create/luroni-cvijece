'use client'

import type { ReactNode } from 'react'
import { openCookieSettings } from '@/lib/cookieConsent'

export function CookieSettingsLink({
  className,
  children = 'Postavke kolačića',
}: {
  className?: string
  children?: ReactNode
}) {
  return (
    <button type="button" className={className} onClick={openCookieSettings}>
      {children}
    </button>
  )
}
