import type { Metadata } from 'next'
import { LegalPage, LegalSection, LegalP, LegalUl } from '@/app/components/LegalPage'

const TITLE = 'Luroni Growth Agent'
const DESCRIPTION =
  'Informacije o Luroni Growth Agentu, internom alatu za analitiku, Google Ads i Search Console izvještavanje.'
const PAGE_URL = 'https://www.luroni-cvijece.com/growth-agent'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    type:        'website',
    locale:      'hr_HR',
    url:         PAGE_URL,
    siteName:    'Luroni Cvijeće',
    title:       TITLE,
    description: DESCRIPTION,
  },
}

export default function GrowthAgentPage() {
  return (
    <LegalPage title="Luroni Growth Agent">
      <div className="mt-10 sm:mt-12">
        <LegalP>
          Luroni Growth Agent je interni alat za analitiku i izvještavanje koji koristimo za bolje razumijevanje marketinških rezultata i donošenje odluka na temelju podataka.
        </LegalP>
      </div>

      <LegalSection id="cemu-sluzi" title="Čemu služi Luroni Growth Agent?">
        <LegalP>
          Aplikacija objedinjuje informacije iz sljedećih izvora:
        </LegalP>
        <LegalUl>
          <li>Google Ads</li>
          <li>Google Search Console</li>
          <li>web-stranica Luroni</li>
        </LegalUl>
        <LegalP>
          Na temelju tih izvora izrađuje interne izvještaje o performansama i preporuke.
        </LegalP>
      </LegalSection>

      <LegalSection id="google-podaci" title="Kako koristimo Google podatke?">
        <LegalP>
          Luroni Growth Agent pristupa Google Ads i Google Search Console podacima isključivo za potrebe internog izvještavanja i analize. Podaci se koriste za praćenje performansi kampanja, pretraživanja i web-stranice te za izradu preporuka za poboljšanje marketinga.
        </LegalP>
      </LegalSection>

      <LegalSection id="automatske-promjene" title="Automatske promjene">
        <LegalP>
          Luroni Growth Agent trenutno ne izrađuje, mijenja, pauzira niti briše Google Ads kampanje, oglase, ključne riječi, budžete ili ponude. Preporuke se pregledavaju prije bilo kakve marketinške promjene.
        </LegalP>
      </LegalSection>

      <LegalSection id="pristup" title="Pristup">
        <LegalP>
          Alat je namijenjen isključivo internom korištenju od strane Luroni poslovanja i ovlaštenih korisnika. Nije dostupan kupcima niti trećim stranama.
        </LegalP>
      </LegalSection>

      <section className="mt-10 sm:mt-12">
        <LegalP>
          <a href="/politika-privatnosti" className="text-forest hover:underline">
            Politika privatnosti
          </a>
        </LegalP>
      </section>
    </LegalPage>
  )
}
