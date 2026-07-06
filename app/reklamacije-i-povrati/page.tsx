import type { Metadata } from 'next'
import { LegalPage, LegalSection, LegalP, LegalUl } from '@/app/components/LegalPage'

export const metadata: Metadata = {
  title: 'Reklamacije i povrati | Luroni Cvijeće',
  description:
    'Postupak reklamacije za bukete Luroni cvijeće – kako podnijeti prigovor, rokovi rješavanja i vaša prava kao potrošača.',
}

export default function ReklamacijeIPovrati() {
  return (
    <LegalPage
      title="Reklamacije i povrati"
      subtitle="Nismo vas zadovoljili? Evo kako riješiti reklamaciju brzo i bez komplikacija."
    >

      <LegalSection id="podnosenje" title="1. Kako podnijeti reklamaciju">
        <LegalP>
          Ako ste nezadovoljni isporučenim buketom ili buket ima vidljive nedostatke (oštećeni cvijet, pogrešna veličina, nepotpuna dostava), molimo kontaktirajte nas pisanim putem:
        </LegalP>
        <LegalUl>
          <li>
            <strong className="font-medium text-ink">E-mail:</strong>{' '}
            <a href="mailto:info@luroni.hr" className="text-forest hover:underline">info@luroni.hr</a>
          </li>
          <li>
            <strong className="font-medium text-ink">Rok za podnošenje:</strong> najkasnije 2 (dva) dana od datuma isporuke
          </li>
        </LegalUl>
        <LegalP>Reklamacija mora sadržavati:</LegalP>
        <LegalUl>
          <li>Ime i adresu dostave</li>
          <li>Datum isporuke</li>
          <li>Detaljan opis problema ili nedostatka</li>
          <li>Fotografije isporučenog buketa koje potvrđuju navode reklamacije</li>
        </LegalUl>
        <LegalP>
          Bez fotografije i opisa problema nismo u mogućnosti utvrditi osnovanost reklamacije i zadržavamo pravo njezina odbijanja.
        </LegalP>
      </LegalSection>

      <LegalSection id="rokovi" title="2. Rokovi i postupak rješavanja">
        <LegalP>
          Potvrdu primitka reklamacije poslat ćemo vam u roku od{' '}
          <strong className="font-medium text-ink">48 sati</strong> od zaprimanja. Reklamacija se rješava u roku od{' '}
          <strong className="font-medium text-ink">15 (petnaest) kalendarskih dana</strong> od zaprimanja potpune dokumentacije.
        </LegalP>
        <LegalP>
          Ako je za rješavanje reklamacije potrebna dodatna provjera ili informacija, o tome ćemo vas pravovremeno obavijestiti, a rok rješavanja može se produžiti za onoliko dana koliko je trajalo prikupljanje dodatnih podataka.
        </LegalP>
      </LegalSection>

      <LegalSection id="rjesenje" title="3. Rješenje reklamacije">
        <LegalP>Ako je reklamacija opravdana, ponudit ćemo jedno od sljedećih rješenja, po dogovoru s Kupcem:</LegalP>
        <LegalUl>
          <li>
            <strong className="font-medium text-ink">Zamjenski buket</strong> iste ili slične vrijednosti, dostavljan u dogovorenom terminu.
          </li>
          <li>
            <strong className="font-medium text-ink">Djelomičan ili potpun povrat</strong> uplaćenog iznosa na isti bankovni račun ili karticu s koje je plaćanje izvršeno, u roku od 15 dana od prihvaćanja reklamacije.
          </li>
        </LegalUl>
        <LegalP>
          Reklamacije podnijete izvan roka od 2 dana ili bez potrebnih fotografija neće biti uvažene. Prodavatelj ne prihvaća reklamacije zasnovane isključivo na osobnim preferencijama ili procjenama estetskog izgleda, pod uvjetom da buket odgovara naručenoj veličini i opisu.
        </LegalP>
      </LegalSection>

      <LegalSection id="iznimka" title="4. Pravo na jednostrani raskid – iznimka za svježe cvijeće">
        <LegalP>
          Sukladno čl. 95. st. 1. toč. (d) Zakona o zaštiti potrošača (NN 19/2022 i izmjene), potrošač{' '}
          <strong className="font-medium text-ink">ne može jednostrano raskinuti</strong> ugovor sklopljen na daljinu koji se odnosi na isporuku robe koja se brzo kvari ili kojoj brzo istječe rok trajanja.
        </LegalP>
        <LegalP>
          Svježe cvijeće po svojoj prirodi spada u kategoriju pokvarljivih dobara – namijenjena je broj isporuka i konzumacija unutar kratkog vremenskog roka. Stoga se zakonska iznimka primjenjuje na sve narudžbe buketa putem luroni.hr, a uobičajeno 14-dnevno pravo na raskid bez obrazloženja nije primjenjivo.
        </LegalP>
        <LegalP>
          Navedeno ne isključuje prava potrošača na reklamaciju opisana u prethodnim odjeljcima, koja ostaju na snazi u cijelosti.
        </LegalP>
      </LegalSection>

      <LegalSection id="adr" title="5. Alternativno rješavanje sporova">
        <LegalP>
          Ako smatrate da vaša reklamacija nije riješena na zadovoljavajući način, na raspolaganju su vam sljedeći putovi:
        </LegalP>
        <LegalUl>
          <li>
            Podnošenje pritužbe{' '}
            <strong className="font-medium text-ink">Državnom inspektoratu</strong> (nadzorno tijelo za zaštitu potrošača u RH):{' '}
            <a href="https://dirh.hr" target="_blank" rel="noopener noreferrer" className="text-forest hover:underline">dirh.hr</a>
          </li>
          <li>
            Podnošenje prijedloga za alternativno rješavanje spora pred tijelom upisanim u registar MINGO-a, sukladno Zakonu o alternativnom rješavanju potrošačkih sporova (NN 94/2017).
          </li>
          <li>
            Korištenje{' '}
            <strong className="font-medium text-ink">EU platforme za online rješavanje sporova (ODR):</strong>{' '}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-forest hover:underline"
            >
              ec.europa.eu/consumers/odr
            </a>
          </li>
        </LegalUl>
        <LegalP>
          Uvijek pokušavamo mirno i brzo riješiti svaki spor. Kontaktirajte nas na{' '}
          <a href="mailto:info@luroni.hr" className="text-forest hover:underline">info@luroni.hr</a>{' '}
          – najčešće možemo naći prihvatljivo rješenje u kratkom roku.
        </LegalP>
      </LegalSection>

    </LegalPage>
  )
}
