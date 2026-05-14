import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'Dostava cvijeća Rijeka i Krk | Luroni cvijeće',
  description:
    'Naručite svježe bukete online uz besplatnu dostavu u Rijeci, okolici i na otoku Krku. Buket S, M i L s dostavom u roku 24h.',
  openGraph: {
    title: 'Dostava cvijeća Rijeka i Krk | Luroni cvijeće',
    description: 'Svježi buketi s besplatnom dostavom u Rijeci, okolici i na otoku Krku.',
    images: ['/images/hero/hero-buket.jpg'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body className="min-h-screen bg-cream text-ink antialiased font-sans">
        {children}
      </body>
    </html>
  )
}
