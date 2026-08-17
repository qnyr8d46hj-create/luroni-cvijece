import type { Metadata } from 'next'
import { LegalPage, LegalSection, LegalP, LegalUl } from '@/app/components/LegalPage'

export const metadata: Metadata = {
  title: 'Dostava i plaćanje | Luroni Cvijeće',
  description:
    'Sve o dostavi buketa u Rijeci, okolici i na otoku Krku – rokovi, uvjeti, cijene i načini plaćanja.',
  alternates: {
    canonical: 'https://www.luroni-cvijece.com/dostava-i-placanje',
  },
  openGraph: {
    type:        'website',
    locale:      'hr_HR',
    url:         'https://www.luroni-cvijece.com/dostava-i-placanje',
    siteName:    'Luroni Cvijeće',
    title:       'Dostava i plaćanje | Luroni Cvijeće',
    description:
      'Sve o dostavi buketa u Rijeci, okolici i na otoku Krku – rokovi, uvjeti, cijene i načini plaćanja.',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Dostava i plaćanje | Luroni Cvijeće',
    description:
      'Sve o dostavi buketa u Rijeci, okolici i na otoku Krku – rokovi, uvjeti, cijene i načini plaćanja.',
  },
}

export default function DostavaIPlacanjePage() {
  return (
    <LegalPage
      title="Dostava i plaćanje"
      subtitle="Sve o isporuci svježih buketa – gdje, kada i kako."
    >

      <LegalSection id="podrucje" title="1. Područje dostave">
        <LegalP>
          Dostavljamo bukete na sljedeća mjesta:
        </LegalP>
        <LegalUl>
          <li><strong className="font-medium text-ink">Rijeka i okolica:</strong> Rijeka, Kastav, Viškovo, Grobnik, Šmrika</li>
          <li><strong className="font-medium text-ink">Opatijska rivijera:</strong> Opatija, Lovran, Ičići, Ika</li>
          <li><strong className="font-medium text-ink">Otok Krk:</strong> Malinska, Krk i okolna naselja</li>
        </LegalUl>
        <LegalP>
          Za lokacije koje nisu navedene u online obrascu, kontaktirajte nas na{' '}
          <a href="mailto:info@luroni.hr" className="text-forest hover:underline">info@luroni.hr</a>{' '}
          ili <a href="tel:+385998663592" className="text-forest hover:underline">+385 99 866 3592</a> – rado ćemo provjeriti mogućnost dostave.
        </LegalP>
      </LegalSection>

      <LegalSection id="uvjeti-dostave" title="2. Uvjeti i rokovi dostave">
        <LegalP>
          Dostava se vrši isključivo na temelju prethodnog dogovora o terminu, od{' '}
          <strong className="font-medium text-ink">ponedjeljka do subote</strong>. Uobičajeno nastojimo dostaviti u roku od 24 sata od zaprimanja potvrđene narudžbe, no konačni rok ovisi o dostupnosti svježeg cvijeća i slobodnim terminima za dostavu.
        </LegalP>
        <LegalP>
          Kupac je dužan osigurati dostupnost primatelja na navedenoj adresi u dogovoreno vrijeme. U slučaju nedostupnosti primatelja kontaktiramo Kupca radi dogovora alternativnog termina. Ako dostava u novom terminu nije moguća uslijed kvarljivosti cvijeća, a propust je nastao na strani primatelja, Prodavatelj ne snosi odgovornost za nastalu štetu.
        </LegalP>
        <LegalP>
          Prodavatelj ne snosi odgovornost za kašnjenje dostave uzrokovano višom silom (prometne nesreće, vremenske neprilike, vandalizmi) ili netočnim podacima o adresi koje je naveo Kupac.
        </LegalP>
      </LegalSection>

      <LegalSection id="cijena-dostave" title="3. Cijena dostave">
        <LegalP>
          <strong className="font-medium text-ink">Dostava je besplatna</strong> za sva mjesta unutar navedenog dostavljačkog područja. Cijena dostave ne naplaćuje se zasebno – uključena je u cijenu buketa.
        </LegalP>
      </LegalSection>

      <LegalSection id="karakteristike" title="4. Karakteristike svježeg cvijeća">
        <LegalP>
          Svježe cvijeće je pokvarljivo dobro s ograničenim rokom trajanja. Radi očuvanja kvalitete i dugovječnosti buketa preporučujemo sljedeće korake odmah po isporuci:
        </LegalP>
        <LegalUl>
          <li>Stavite buket u čistu vazu s hladnom vodom</li>
          <li>Svaka 2–3 dana promijenite vodu i obrežite stabljike za 1–2 cm pod kutom</li>
          <li>Čuvajte buket na hladnijem i sjenovitom mjestu, dalje od izravnog sunca, izvora topline i propuha</li>
          <li>Uklonite listove koji bi se našli ispod razine vode u vazi</li>
        </LegalUl>
        <LegalP>
          Prodavatelj ne snosi odgovornost za brzo propadanje cvijeća koje nastane uslijed neodgovarajućeg rukovanja od strane primatelja nakon isporuke.
        </LegalP>
      </LegalSection>

      <LegalSection id="nacini-placanja" title="5. Načini plaćanja">
        <LegalP>
          Na raspolaganju su vam sljedeći načini plaćanja:
        </LegalP>
        <LegalUl>
          <li>
            <strong className="font-medium text-ink">Online platnom karticom</strong> – putem sigurnog platnog sustava Stripe (Visa, Mastercard i ostale podržane kartice). Naplata se izvršava odmah pri potvrdi narudžbe. Stripe je certificiran sukladno PCI-DSS standardima. Podatke vaše kartice ne pohranjujemo.
          </li>
          <li>
            <strong className="font-medium text-ink">Gotovinom pri dostavi</strong> (cash on delivery) – plaćanje kurieru pri preuzimanju buketa, ako je ta mogućnost dostupna pri odabiru narudžbe.
          </li>
        </LegalUl>
      </LegalSection>

      <LegalSection id="cjenik" title="6. Cjenik">
        <LegalP>Trenutni cjenik buketa s uključenom dostavom:</LegalP>
        <LegalUl>
          <li>
            <strong className="font-medium text-ink">Buket S</strong> – 35 EUR (s PDV-om, dostava uključena)
          </li>
          <li>
            <strong className="font-medium text-ink">Buket M</strong> – 45 EUR (s PDV-om, dostava uključena)
          </li>
          <li>
            <strong className="font-medium text-ink">Buket L</strong> – 60 EUR (s PDV-om, dostava uključena)
          </li>
        </LegalUl>
        <LegalP>
          Cijene su iskazane u eurima (EUR) i uključuju porez na dodanu vrijednost (PDV). Prodavatelj zadržava pravo promjene cjenik bez prethodne najave, uz objavu na web-mjesta. Na svaku narudžbu primjenjuju se cijene važeće u trenutku njezinog podnošenja.
        </LegalP>
      </LegalSection>

    </LegalPage>
  )
}
