import type { Metadata } from 'next'
import { LegalPage, LegalSection, LegalP, LegalUl } from '@/app/components/LegalPage'

export const metadata: Metadata = {
  title: 'Politika privatnosti | Luroni Cvijeće',
  description:
    'Saznajte kako Luroni Gaja d.o.o. prikuplja, obrađuje i štiti vaše osobne podatke u skladu s GDPR-om.',
  alternates: {
    canonical: 'https://www.luroni-cvijece.com/politika-privatnosti',
  },
  openGraph: {
    type:        'website',
    locale:      'hr_HR',
    url:         'https://www.luroni-cvijece.com/politika-privatnosti',
    siteName:    'Luroni Cvijeće',
    title:       'Politika privatnosti | Luroni Cvijeće',
    description:
      'Saznajte kako Luroni Gaja d.o.o. prikuplja, obrađuje i štiti vaše osobne podatke u skladu s GDPR-om.',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Politika privatnosti | Luroni Cvijeće',
    description:
      'Saznajte kako Luroni Gaja d.o.o. prikuplja, obrađuje i štiti vaše osobne podatke u skladu s GDPR-om.',
  },
}

export default function PolitikaPrivatnostiPage() {
  return (
    <LegalPage
      title="Politika privatnosti"
      subtitle="Kako prikupljamo, koristimo i štitimo vaše osobne podatke."
    >

      <LegalSection id="voditelj" title="1. Voditelj obrade osobnih podataka">
        <LegalP>
          Voditelj obrade osobnih podataka je{' '}
          <strong className="font-medium text-ink">Luroni Gaja d.o.o.</strong>, Gornja Švarča 19, 47000 Karlovac, OIB: 89564174048.
        </LegalP>
        <LegalP>
          Za sva pitanja vezana uz zaštitu osobnih podataka možete nas kontaktirati na:{' '}
          <a href="mailto:info@luroni.hr" className="text-forest hover:underline">info@luroni.hr</a>{' '}
          ili <a href="tel:+385998663592" className="text-forest hover:underline">+385 99 866 3592</a>.
        </LegalP>
      </LegalSection>

      <LegalSection id="podaci-koje-prikupljamo" title="2. Koje osobne podatke prikupljamo">
        <LegalP>
          Obradom narudžbe putem luroni.hr prikupljamo sljedeće kategorije osobnih podataka:
        </LegalP>
        <LegalUl>
          <li>Ime i prezime naručitelja i/ili primatelja</li>
          <li>Adresa dostave (ulica, broj, grad)</li>
          <li>Broj mobilnog telefona</li>
          <li>Adresa elektroničke pošte</li>
          <li>Datum i termin dostave</li>
          <li>Podaci o narudžbi (veličina buketa, poruka uz buket, posebne napomene)</li>
          <li>IP adresa i tehnički podaci o uređaju i pregledniku (prikupljeni automatski putem Google Analyticsa)</li>
        </LegalUl>
        <LegalP>
          Podatke platnih kartica ne pohranjujemo – sve kartičné transakcije obrađuje Stripe, Inc. izravno.
        </LegalP>
      </LegalSection>

      <LegalSection id="svrhe" title="3. Svrhe i pravne osnove obrade">
        <LegalUl>
          <li>
            <strong className="font-medium text-ink">Obrada i isporuka narudžbe:</strong> izvršenje ugovora – čl. 6. st. 1. toč. (b) GDPR.
          </li>
          <li>
            <strong className="font-medium text-ink">Komunikacija vezana uz narudžbu</strong> (potvrda, obavijest o dostavi): izvršenje ugovora – čl. 6. st. 1. toč. (b) GDPR.
          </li>
          <li>
            <strong className="font-medium text-ink">Pohrana narudžbi za računovodstvene i porezne potrebe:</strong> zakonska obveza – čl. 6. st. 1. toč. (c) GDPR.
          </li>
          <li>
            <strong className="font-medium text-ink">Analitika web-mjesta</strong> (Google Analytics): legitimni interes – čl. 6. st. 1. toč. (f) GDPR.
          </li>
          <li>
            <strong className="font-medium text-ink">Oglašavanje i konverzijsko praćenje</strong> (Google Ads): privola – čl. 6. st. 1. toč. (a) GDPR.
          </li>
        </LegalUl>
      </LegalSection>

      <LegalSection id="primatelji" title="4. Primatelji osobnih podataka">
        <LegalP>
          Vaše osobne podatke dijelimo isključivo s pouzdanim trećim stranama koje su neophodne za pružanje naše usluge:
        </LegalP>
        <LegalUl>
          <li>
            <strong className="font-medium text-ink">Stripe, Inc.</strong> (SAD) – obrada platnih kartica. Stripe ne dijeli podatke kartica s nama. Politika privatnosti:{' '}
            <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-forest hover:underline">stripe.com/privacy</a>.
          </li>
          <li>
            <strong className="font-medium text-ink">Google LLC / Firebase</strong> (SAD) – pohrana podataka narudžbi u bazi podataka Firestore (Google Cloud Platform). Politika privatnosti:{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-forest hover:underline">policies.google.com/privacy</a>.
          </li>
          <li>
            <strong className="font-medium text-ink">Resend, Inc.</strong> (SAD) – slanje transakcijskih e-poruka (potvrde narudžbi, obavijesti). Politika privatnosti:{' '}
            <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer" className="text-forest hover:underline">resend.com/privacy</a>.
          </li>
          <li>
            <strong className="font-medium text-ink">Google Analytics</strong> (Google LLC, SAD) – anonimni podaci o posjetima web-mjesta radi razumijevanja korisničkog ponašanja. Možete se odjaviti putem{' '}
            <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-forest hover:underline">Google Analytics Opt-out Add-on</a>.
          </li>
          <li>
            <strong className="font-medium text-ink">Google Ads</strong> (Google LLC, SAD) – mjerenje učinkovitosti oglasa i remarketing.
          </li>
          <li>
            <strong className="font-medium text-ink">Google Search Console</strong> (Google LLC) – tehnički podaci o izvedbi u pretraživanju (isključivo agregirani, bez osobnih podataka).
          </li>
        </LegalUl>
      </LegalSection>

      <LegalSection id="prijenos" title="5. Prijenos podataka izvan EGP-a">
        <LegalP>
          Stripe, Resend i Google imaju sjedišta u SAD-u. Prijenos osobnih podataka u SAD obavlja se temeljem standardnih ugovornih klauzula (SCC) koje je odobrila Europska komisija sukladno čl. 46. Uredbe (EU) 2016/679 (GDPR), čime se osigurava odgovarajuća razina zaštite.
        </LegalP>
      </LegalSection>

      <LegalSection id="pohrana" title="6. Pohrana i brisanje podataka">
        <LegalUl>
          <li>
            <strong className="font-medium text-ink">Podaci o narudžbama:</strong> 11 godina od datuma narudžbe (zakonska obveza temeljem Zakona o računovodstvu, NN 78/2015 i izmjene).
          </li>
          <li>
            <strong className="font-medium text-ink">Analitički podaci</strong> (Google Analytics): prema zadanim postavkama alata (standardno 26 mjeseci, a zatim agregirani podaci bez osobnih identifikatora).
          </li>
          <li>
            <strong className="font-medium text-ink">Podaci kontaktnog obrasca:</strong> 1 godinu od primitka upita, nakon čega se brišu.
          </li>
        </LegalUl>
      </LegalSection>

      <LegalSection id="prava" title="7. Vaša prava vezana uz osobne podatke">
        <LegalP>Sukladno GDPR-u imate sljedeća prava:</LegalP>
        <LegalUl>
          <li><strong className="font-medium text-ink">Pravo na pristup</strong> – uvid u osobne podatke koje obrađujemo.</li>
          <li><strong className="font-medium text-ink">Pravo na ispravak</strong> – ispravljanje netočnih ili dopunjavanje nepotpunih podataka.</li>
          <li><strong className="font-medium text-ink">Pravo na brisanje</strong> (pravo na zaborav) – brisanje podataka, uz ograničenja zakonske obveze čuvanja.</li>
          <li><strong className="font-medium text-ink">Pravo na ograničenje obrade</strong> – privremeno zaustavljanje obrade dok se utvrdi točnost podataka.</li>
          <li><strong className="font-medium text-ink">Pravo na prenosivost</strong> – primanje vaših podataka u strojno čitljivom formatu.</li>
          <li><strong className="font-medium text-ink">Pravo na prigovor</strong> – prigovor na obradu temeljenu na legitimnom interesu.</li>
          <li><strong className="font-medium text-ink">Pravo na pritužbu nadzornom tijelu</strong> – obraćanje Agenciji za zaštitu osobnih podataka (AZOP), Martićeva 14, 10000 Zagreb,{' '}
            <a href="https://azop.hr" target="_blank" rel="noopener noreferrer" className="text-forest hover:underline">azop.hr</a>.
          </li>
        </LegalUl>
        <LegalP>
          Zahtjeve za ostvarivanje prava upućujte na{' '}
          <a href="mailto:info@luroni.hr" className="text-forest hover:underline">info@luroni.hr</a>.
          Odgovoramo u roku od 30 dana od primitka zahtjeva.
        </LegalP>
      </LegalSection>

      <LegalSection id="kolacici" title="8. Kolačići">
        <LegalP>
          Web-mjesta koristi kolačiće za analitiku i marketinške svrhe. Više informacija dostupno je u{' '}
          <a href="/politika-kolacica" className="text-forest hover:underline">Politici kolačića</a>.
        </LegalP>
      </LegalSection>

      <LegalSection id="sigurnost" title="9. Sigurnost osobnih podataka">
        <LegalP>
          Osobni podaci pohranjuju se na sigurnim poslužiteljima uz pristup ograničen isključivo na ovlaštene osobe. Primjenjujemo tehničke i organizacijske mjere zaštite sukladne stanju tehnike. Svako eventualno sigurnosno narušavanje prijavit ćemo AZOP-u u zakonom propisanom roku.
        </LegalP>
      </LegalSection>

      <LegalSection id="izmjene" title="10. Izmjene politike privatnosti">
        <LegalP>
          Ovu Politiku privatnosti možemo povremeno ažurirati radi usklađenosti s promjenama zakonskih obveza ili naše poslovne prakse. Ažurirana verzija objavljuje se na ovoj stranici s datumom zadnjeg ažuriranja. Preporučujemo povremenu provjeru.
        </LegalP>
      </LegalSection>

      <LegalSection id="kontakt-pp" title="11. Kontakt">
        <LegalP>
          Za sva pitanja vezana uz zaštitu osobnih podataka kontaktirajte nas na:{' '}
          <a href="mailto:info@luroni.hr" className="text-forest hover:underline">info@luroni.hr</a>{' '}
          ili <a href="tel:+385998663592" className="text-forest hover:underline">+385 99 866 3592</a>.
        </LegalP>
      </LegalSection>

    </LegalPage>
  )
}
