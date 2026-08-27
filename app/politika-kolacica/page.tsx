import type { Metadata } from 'next'
import { LegalPage, LegalSection, LegalP, LegalUl } from '@/app/components/LegalPage'
import { pageSeo } from '@/lib/seo'

export const metadata: Metadata = pageSeo({
  title: 'Politika kolačića | Luroni Cvijeće',
  description:
    'Saznajte koje kolačiće koristi luroni.hr, zašto ih koristimo i kako ih možete kontrolirati.',
  path: '/politika-kolacica',
})

export default function PolitikaKolacicaPage() {
  return (
    <LegalPage
      title="Politika kolačića"
      subtitle="Koje kolačiće koristimo i kako ih možete kontrolirati."
    >

      <LegalSection id="sto-su" title="1. Što su kolačići?">
        <LegalP>
          Kolačići (engl. <em>cookies</em>) su male tekstualne datoteke koje web-mjesta pohranjuje na vaš uređaj (računalo, tablet ili mobitel) pri prvom posjetu. Kolačići sami po sebi ne sadržavaju osobne identifikacijske podatke, no u kombinaciji s drugim podacima mogu se koristiti za identifikaciju korisnika.
        </LegalP>
        <LegalP>
          Koristimo prve strane kolačiće (postavljene izravno od luroni.hr) i kolačiće trećih strana (postavljene od partnera poput Googlea).
        </LegalP>
      </LegalSection>

      <LegalSection id="zasto" title="2. Zašto koristimo kolačiće?">
        <LegalP>Kolačiće koristimo radi:</LegalP>
        <LegalUl>
          <li>Pravilnog funkcioniranja web-mjesta i sigurnosti transakcija</li>
          <li>Razumijevanja načina na koji posjetitelji koriste web-mjesta (analitika)</li>
          <li>Prikazivanja relevantnih oglasa i mjerenja učinkovitosti marketinških kampanja</li>
        </LegalUl>
      </LegalSection>

      <LegalSection id="kategorije" title="3. Kategorije kolačića koje koristimo">

        <div className="mt-1">
          <p className="text-[0.9375rem] font-medium text-ink mb-2">Nužni kolačići</p>
          <LegalP>
            Ovi kolačići neophodni su za osnovno funkcioniranje web-mjesta – bez njih neke ključne funkcionalnosti, poput sigurnog plaćanja, ne bi radile. Ne mogu se isključiti. Ne prikupljaju osobne podatke u marketinške svrhe.
          </LegalP>
        </div>

        <div className="mt-4">
          <p className="text-[0.9375rem] font-medium text-ink mb-2">Analitički kolačići</p>
          <LegalP>
            Koristimo Google Analytics kako bismo razumjeli koje stranice posjetitelji učestalije posjećuju, koliko dugo ostaju i s kojih uređaja pristupaju. Svi podaci su anonimizirani ili pseudonomizirani.
          </LegalP>
          <LegalUl>
            <li><strong className="font-medium text-ink">_ga</strong> – razlikuje korisnike (2 godine)</li>
            <li><strong className="font-medium text-ink">_gid</strong> – razlikuje korisnike (24 sata)</li>
            <li><strong className="font-medium text-ink">_gat_gtag_*</strong> – ograničava broj zahtjeva prema Googleu (1 minuta)</li>
          </LegalUl>
          <LegalP>
            Analitičke kolačiće možete isključiti instalacijom{' '}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noopener noreferrer"
              className="text-forest hover:underline"
            >
              Google Analytics Opt-out Browser Add-on
            </a>.
          </LegalP>
        </div>

        <div className="mt-4">
          <p className="text-[0.9375rem] font-medium text-ink mb-2">Marketinški kolačići</p>
          <LegalP>
            Koristimo Google Ads kolačiće za mjerenje učinkovitosti oglasa (konverzijsko praćenje) i prikazivanje relevantnih promotivnih poruka. Google Ads kolačiće možete upravljati putem{' '}
            <a
              href="https://adssettings.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-forest hover:underline"
            >
              postavki Google oglasa
            </a>.
          </LegalP>
        </div>

      </LegalSection>

      <LegalSection id="upravljanje" title="4. Upravljanje kolačićima i povlačenje privole">
        <LegalP>
          Kolačićima možete upravljati izravno u postavkama svog preglednika:
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
          Ako blokirate ili izbrišete kolačiće, neke funkcionalnosti web-mjesta mogu raditi nepotpuno. Više informacija o upravljanju kolačićima dostupno je na{' '}
          <a
            href="https://www.allaboutcookies.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-forest hover:underline"
          >
            allaboutcookies.org
          </a>{' '}
          i{' '}
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
