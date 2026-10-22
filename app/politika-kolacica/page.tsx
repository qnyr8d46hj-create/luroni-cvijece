import type { Metadata } from 'next'
import { LegalPage, LegalSection, LegalP, LegalUl } from '@/app/components/LegalPage'
import { CookieSettingsLink } from '@/app/components/CookieSettingsLink'
import { pageSeo } from '@/lib/seo'

export const metadata: Metadata = pageSeo({
  title: 'Politika kolačića | Luroni Cvijeće',
  description:
    'Saznajte koje kolačiće koristi luroni-cvijece.com, zašto ih koristimo i kako možete dati ili povući privolu.',
  path: '/politika-kolacica',
})

export default function PolitikaKolacicaPage() {
  return (
    <LegalPage
      title="Politika kolačića"
      subtitle="Koje kolačiće i slične tehnologije koristimo i kako ih možete kontrolirati."
      updatedAt="Listopad 2026."
    >

      <LegalSection id="sto-su" title="1. Što su kolačići?">
        <LegalP>
          Kolačići (engl. <em>cookies</em>) su male tekstualne datoteke koje web-mjesta pohranjuju na vaš uređaj (računalo, tablet ili mobitel). Uz kolačiće koristimo i slične tehnologije lokalne pohrane u pregledniku (npr. localStorage i sessionStorage).
        </LegalP>
        <LegalP>
          Koristimo prve strane kolačiće (postavljene od luroni-cvijece.com) i, samo uz vašu privolu, kolačiće trećih strana (Google Analytics 4).
        </LegalP>
      </LegalSection>

      <LegalSection id="privola" title="2. Privola i vaš izbor">
        <LegalP>
          Pri prvom posjetu prikazujemo banner kolačića s jednako dostupnim opcijama <strong className="font-medium text-ink">Prihvati sve</strong>, <strong className="font-medium text-ink">Odbij neobavezne</strong> i <strong className="font-medium text-ink">Postavke kolačića</strong>. Neobavezne kategorije (analitika i marketing) nisu unaprijed odabrane.
        </LegalP>
        <LegalP>
          Nužni kolačići rade uvijek. Analitičke i marketinške tehnologije ne učitavamo dok ne date odgovarajuću privolu. Narudžba svježih buketa, umjetnih aranžmana, gotovinsko plaćanje i Stripe Checkout rade i ako odbijete neobavezne kolačiće.
        </LegalP>
        <LegalP>
          Izbor spremamo do 12 mjeseci. Privolu možete u svakom trenutku promijeniti ili povući putem{' '}
          <CookieSettingsLink className="text-forest hover:underline" />
          {' '}u podnožju stranice ili na ovoj stranici.
        </LegalP>
      </LegalSection>

      <LegalSection id="kategorije" title="3. Kategorije koje koristimo">

        <div className="mt-1">
          <p className="text-[0.9375rem] font-medium text-ink mb-2">Nužni</p>
          <LegalP>
            Potrebni su za osnovni rad web-mjesta, spremanje vašeg izbora kolačića te za slanje narudžbe i plaćanje. Ne mogu se isključiti i ne koriste se za marketing.
          </LegalP>
          <LegalUl>
            <li>
              <strong className="font-medium text-ink">luroni_cookie_consent</strong> – sprema vaš izbor kategorija (12 mjeseci). Ista informacija može biti i u localStorage pod istim nazivom.
            </li>
            <li>
              <strong className="font-medium text-ink">Stripe Checkout</strong> – pri kartičnom plaćanju preusmjeravamo vas na Stripe. Stripe na svojoj domeni postavlja kolačiće nužne za sigurnu uplatu. Podatke kartice ne pohranjujemo.
            </li>
            <li>
              Firebase / Firestore koristi se za spremanje narudžbe svježeg buketa. To nije marketinški kolačić.
            </li>
          </LegalUl>
        </div>

        <div className="mt-4">
          <p className="text-[0.9375rem] font-medium text-ink mb-2">Analitika</p>
          <LegalP>
            Uključuje se samo uz analitičku privolu. Koristimo je za razumijevanje posjeta i, ako je plaćanje karticom uspješno, za mjerenje kupnje u Google Analytics 4 (GA4).
          </LegalP>
          <LegalUl>
            <li>
              <strong className="font-medium text-ink">Google Analytics 4</strong> – učitava se tek nakon analitičke privole. Tipični kolačići: <strong className="font-medium text-ink">_ga</strong> (do 2 godine), <strong className="font-medium text-ink">_ga_*</strong> (do 2 godine), <strong className="font-medium text-ink">_gid</strong> (24 sata), <strong className="font-medium text-ink">_gat_gtag_*</strong> (1 minuta).
            </li>
            <li>
              <strong className="font-medium text-ink">sessionStorage ga4_tracked_*</strong> – sprječava dvostruko slanje događaja kupnje na stranici zahvale, i to tek nakon što je događaj stvarno poslan.
            </li>
            <li>
              <strong className="font-medium text-ink">Vercel Analytics</strong> i <strong className="font-medium text-ink">Vercel Speed Insights</strong> – prve strane mjerne skripte Vercela za posjete i brzinu stranice. Učitavaju se samo uz analitičku privolu.
            </li>
          </LegalUl>
        </div>

        <div className="mt-4">
          <p className="text-[0.9375rem] font-medium text-ink mb-2">Marketing</p>
          <LegalP>
            Na web-mjestu <strong className="font-medium text-ink">nije instaliran zaseban Google Ads piksel</strong> niti Google Tag Manager. Marketinška kategorija upravlja Google Consent Mode signalima za oglašavanje (<em>ad_storage</em>, <em>ad_user_data</em>, <em>ad_personalization</em>).
          </LegalP>
          <LegalP>
            Ti se signali odobravaju samo ako date marketinšku privolu. Analitička privola sama po sebi ne uključuje marketing. Ako GA4 nije učitan (nema analitičke privole), marketinški signali se ne šalju Googleu jer se Google skripta uopće ne učitava.
          </LegalP>
          <LegalP>
            Ako je dana i analitička i marketinška privola, GA4 može postaviti oglasne kolačiće (npr. <strong className="font-medium text-ink">_gcl_au</strong>) ovisno o postavkama Google računa. Konverzije Google Ads kampanja, ako se mjere, dolaze uvozom GA4 događaja kupnje, a ne zasebnim Ads pikselom na ovoj stranici.
          </LegalP>
        </div>

      </LegalSection>

      <LegalSection id="povlacenje" title="4. Promjena i povlačenje privole">
        <LegalP>
          Otvorite{' '}
          <CookieSettingsLink className="text-forest hover:underline" />
          {' '}u podnožju bilo koje stranice. Ako povučete analitičku ili marketinšku privolu, prestajemo učitavati neobavezno praćenje u budućim posjetima i brišemo primjenjive prve strane opcijske kolačiće (npr. _ga, _gid, _gat*, _gcl*) tamo gdje je to tehnički moguće.
        </LegalP>
        <LegalP>
          Kolačićima možete upravljati i u pregledniku:
        </LegalP>
        <LegalUl>
          <li>
            <strong className="font-medium text-ink">Google Chrome:</strong> Postavke → Privatnost i sigurnost → Kolačići
          </li>
          <li>
            <strong className="font-medium text-ink">Mozilla Firefox:</strong> Postavke → Privatnost i sigurnost → Kolačići i podaci stranica
          </li>
          <li>
            <strong className="font-medium text-ink">Safari:</strong> Postavke → Privatnost → Upravljanje podacima web stranice
          </li>
          <li>
            <strong className="font-medium text-ink">Microsoft Edge:</strong> Postavke → Kolačići i dozvole stranice
          </li>
        </LegalUl>
        <LegalP>
          Više informacija: {' '}
          <a
            href="https://www.allaboutcookies.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-forest hover:underline"
          >
            allaboutcookies.org
          </a>
          {' '}i{' '}
          <a
            href="https://www.youronlinechoices.eu"
            target="_blank"
            rel="noopener noreferrer"
            className="text-forest hover:underline"
          >
            youronlinechoices.eu
          </a>.
        </LegalP>
        <LegalP>
          Za pitanja u vezi s kolačićima kontaktirajte nas na{' '}
          <a href="mailto:info@luroni.hr" className="text-forest hover:underline">info@luroni.hr</a>.
        </LegalP>
      </LegalSection>

    </LegalPage>
  )
}
