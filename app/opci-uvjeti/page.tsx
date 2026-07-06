import type { Metadata } from 'next'
import { LegalPage, LegalSection, LegalP, LegalUl } from '@/app/components/LegalPage'

export const metadata: Metadata = {
  title: 'Opći uvjeti poslovanja | Luroni Cvijeće',
  description:
    'Opći uvjeti poslovanja web-mjesta luroni.hr – narudžba, dostava, plaćanje i prava potrošača pri kupnji svježeg cvijeća.',
}

export default function OpciUvjetiPage() {
  return (
    <LegalPage
      title="Opći uvjeti poslovanja"
      subtitle="Uvjeti uređuju naručivanje, dostavu i plaćanje buketa putem luroni.hr."
    >

      <LegalSection id="prodavatelj" title="1. Podaci o prodavatelju">
        <LegalP>
          Prodavatelj je <strong className="font-medium text-ink">Luroni Gaja d.o.o.</strong>, Gornja Švarča 19, 47000 Karlovac, OIB: 89564174048 (dalje: Prodavatelj). Kontakt:{' '}
          <a href="mailto:info@luroni.hr" className="text-forest hover:underline">info@luroni.hr</a>{' '}
          · <a href="tel:+385998663592" className="text-forest hover:underline">+385 99 866 3592</a>.
        </LegalP>
      </LegalSection>

      <LegalSection id="predmet" title="2. Predmet i primjena uvjeta">
        <LegalP>
          Ovi Opći uvjeti poslovanja (dalje: Uvjeti) uređuju međusobna prava i obveze između Prodavatelja i kupca (dalje: Kupac ili Potrošač) koji putem web-mjesta luroni.hr naručuje svježe bukete cvijeća s dostavom.
        </LegalP>
        <LegalP>
          Smatra se da je Kupac upoznat s Uvjetima i da ih prihvaća u trenutku podnošenja narudžbe. Prodavatelj zadržava pravo izmjene Uvjeta bez prethodne obavijesti, a na svaku narudžbu primjenjuju se Uvjeti važeći u trenutku njezina podnošenja.
        </LegalP>
      </LegalSection>

      <LegalSection id="narudzba" title="3. Sklapanje ugovora i potvrda narudžbe">
        <LegalP>
          Kupac podnosi narudžbu ispunjavanjem online obrasca. Ugovor se smatra sklopljenim u trenutku kada Prodavatelj pošalje Kupcu potvrdu narudžbe na adresu elektroničke pošte navedenu u obrascu.
        </LegalP>
        <LegalP>
          Prodavatelj zadržava pravo odbijanja narudžbe ako tražena lokacija dostave nije unutar dostavljačkog područja, odabrani termin nije moguće ispuniti ili navedeni podaci nisu potpuni. Kupac će u tim slučajevima biti obaviješten bez odlaganja.
        </LegalP>
      </LegalSection>

      <LegalSection id="proizvodi" title="4. Opisi i fotografije proizvoda">
        <LegalP>
          Fotografije označene kao &ldquo;stvarni buketi&rdquo; prikazuju konkretne aranžmane rađene za dostavu. Ostale fotografije na web-mjesta imaju ilustrativni karakter. Svaki buket slažemo ručno od svježeg sezonskog cvijeća, pa konačan izgled može blago odstupati od prikazanog zbog sezonske dostupnosti pojedinih vrsta i boja cvijeća.
        </LegalP>
      </LegalSection>

      <LegalSection id="cijene" title="5. Cijene">
        <LegalP>
          Sve cijene navedene su u eurima (EUR) i uključuju porez na dodanu vrijednost (PDV). Dostava je besplatna za sva mjesta unutar dostavljačkog područja. Na svaku narudžbu primjenjuje se cijena važeća u trenutku njezinog podnošenja.
        </LegalP>
      </LegalSection>

      <LegalSection id="dostava" title="6. Dostava">
        <LegalP>
          Dostava je dostupna u Rijeci i okolici (Kastav, Viškovo, Grobnik, Opatija, Lovran, Ičići, Ika, Šmrika) te na otoku Krku i u okolnim naseljima. Dostava se vrši od ponedjeljka do subote, po prethodnom dogovoru o terminu.
        </LegalP>
        <LegalP>
          Kupac je dužan osigurati prisutnost primatelja na navedenoj adresi u dogovoreno vrijeme. U slučaju nedostupnosti primatelja Prodavatelj će kontaktirati Kupca radi dogovora novog termina. Prodavatelj ne snosi odgovornost za kašnjenje dostave uzrokovano višom silom ili netočnim podacima o adresi koje je naveo Kupac.
        </LegalP>
      </LegalSection>

      <LegalSection id="placanje" title="7. Načini plaćanja">
        <LegalP>Kupac može platiti:</LegalP>
        <LegalUl>
          <li>
            <strong className="font-medium text-ink">Online platnom karticom</strong> putem sigurnog sustava Stripe (Visa, Mastercard i ostale podržane kartice) – naplata se izvršava odmah pri potvrdi narudžbe.
          </li>
          <li>
            <strong className="font-medium text-ink">Gotovinom pri dostavi</strong> (cash on delivery), ako je ta mogućnost dostupna pri odabiru narudžbe.
          </li>
        </LegalUl>
        <LegalP>
          Prodavatelj ne pohranjuje podatke platnih kartica. Sve kartične transakcije obrađuje Stripe, Inc. u skladu s PCI-DSS standardima zaštite platnih podataka.
        </LegalP>
      </LegalSection>

      <LegalSection id="raskid" title="8. Pravo na jednostrani raskid ugovora">
        <LegalP>
          Sukladno čl. 95. st. 1. toč. (d) Zakona o zaštiti potrošača (NN 19/2022 i izmjene), potrošač{' '}
          <strong className="font-medium text-ink">nema pravo na jednostrani raskid</strong> ugovora sklopljenog na daljinu koji se odnosi na isporuku robe koja se brzo kvari ili kojoj brzo istječe rok trajanja.
        </LegalP>
        <LegalP>
          Svježe cvijeće je pokvarljivo dobro, stoga navedena zakonska iznimka isključuje primjenu redovnog 14-dnevnog roka za raskid. Ovo ne umanjuje prava Kupca u pogledu reklamacija opisanih u sljedećem odjeljku.
        </LegalP>
      </LegalSection>

      <LegalSection id="reklamacije" title="9. Reklamacije i odgovornost za materijalne nedostatke">
        <LegalP>
          Kupac je dužan pregledati isporučeni buket pri preuzimanju i prijaviti vidljive nedostatke. Reklamacije se podnose pisanim putem na{' '}
          <a href="mailto:info@luroni.hr" className="text-forest hover:underline">info@luroni.hr</a>{' '}
          najkasnije unutar 2 (dva) dana od isporuke, s opisom nedostatka i fotografijom buketa.
        </LegalP>
        <LegalP>
          Ako je reklamacija opravdana, Prodavatelj će, po dogovoru s Kupcem, isporučiti zamjenski buket ili izvršiti povrat uplaćenog iznosa na isti bankovni račun ili karticu, u roku od 15 dana od dana usvajanja reklamacije. Više o postupku reklamacije dostupno je u{' '}
          <a href="/reklamacije-i-povrati" className="text-forest hover:underline">Reklamacijama i povratima</a>.
        </LegalP>
      </LegalSection>

      <LegalSection id="podaci" title="10. Zaštita osobnih podataka">
        <LegalP>
          Prodavatelj obrađuje osobne podatke Kupca isključivo u svrhu obrade narudžbe i dostave, u skladu s Uredbom (EU) 2016/679 (GDPR). Detalji su dostupni u{' '}
          <a href="/politika-privatnosti" className="text-forest hover:underline">Politici privatnosti</a>.
        </LegalP>
      </LegalSection>

      <LegalSection id="sporovi" title="11. Rješavanje sporova i mjerodavno pravo">
        <LegalP>
          U slučaju spora stranke će pokušati mirno rješenje. Potrošač ima pravo pokrenuti postupak alternativnog rješavanja sporova pred tijelom koje je ovlastilo nadležno ministarstvo. Potrošači u EU mogu koristiti platformu za online rješavanje sporova:{' '}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-forest hover:underline"
          >
            ec.europa.eu/consumers/odr
          </a>.
        </LegalP>
        <LegalP>
          Mjerodavno je pravo Republike Hrvatske; za eventualne sporove nadležan je sud u Karlovcu.
        </LegalP>
      </LegalSection>

    </LegalPage>
  )
}
