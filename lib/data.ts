export type BouquetSize = 'S' | 'M' | 'L'

export interface BouquetType {
  id: BouquetSize
  name: string
  price: string
  description: string
  cta: string
  image: string
  alt: string
  popular: boolean
}

export interface GalleryImage {
  src: string
  alt: string
}

export const BOUQUET_TYPES: BouquetType[] = [
  {
    id: 'S',
    name: 'Buket S',
    price: '35 €',
    description:
      'Manji, elegantan buket idealan za pažnju, zahvalu ili mali znak iznenađenja. Lijep izbor kada želite nekome uljepšati dan bez pretjerivanja.',
    cta: 'Odaberi Buket S',
    image: '/images/featured-bouquets/buket-s.jpg',
    alt: 'Buket S za dostavu cvijeća u Rijeci',
    popular: false,
  },
  {
    id: 'M',
    name: 'Buket M',
    price: '45 €',
    description:
      'Srednji buket s bogatijim izgledom, odličan za rođendane, godišnjice, posjete i posebne trenutke. Najbolji omjer cijene i dojma.',
    cta: 'Odaberi Buket M',
    image: '/images/featured-bouquets/buket-m.jpg',
    alt: 'Buket M s dostavom u Rijeci i okolici',
    popular: true,
  },
  {
    id: 'L',
    name: 'Buket L',
    price: '60 €',
    description:
      'Veći i raskošniji buket za snažan dojam. Idealan za posebne prigode, velike geste, iznenađenja i trenutke koje želite posebno naglasiti.',
    cta: 'Odaberi Buket L',
    image: '/images/featured-bouquets/buket-l.jpg',
    alt: 'Buket L s dostavom na području Rijeke i Krka',
    popular: false,
  },
]

// ── Gallery images ─────────────────────────────────────────────────────────
// To change which images appear first (before "Pogledaj više buketa"),
// edit featuredBouquets only. allBouquets must include every image number.
// All files must exist as /public/images/slozeni-buketi/buket-N.jpg (lowercase).

const featuredBouquets: number[] = [1, 2, 3, 4, 5, 6]
const allBouquets:      number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]

function toGalleryImage(n: number): GalleryImage {
  return {
    src: `/images/slozeni-buketi/buket-${n}.jpg`,
    alt: `Stvarni buket ${n} složen za dostavu cvijeća u Rijeci`,
  }
}

export const GALLERY_IMAGES_FEATURED: GalleryImage[] = featuredBouquets.map(toGalleryImage)
export const GALLERY_IMAGES_ALL:      GalleryImage[] = allBouquets.map(toGalleryImage)

export interface FaqItem {
  question: string
  answer:   string
}

// Single source of truth for FAQ — used by both the visible accordion
// (FaqSection.tsx) and the FAQPage JSON-LD in layout.tsx.
export const FAQS: FaqItem[] = [
  {
    question: 'Gdje dostavljate cvijeće?',
    answer:   'Dostavljamo bukete na području Rijeke, okolice i otoka Krka, uključujući Opatiju, Kastav, Viškovo, Grobnik, Lovran, Ičiće, Iku, Šmriku, Malinsku, Krk i okolna mjesta.',
  },
  {
    question: 'Koliko brzo dostavljate bukete?',
    answer:   'Bukete dostavljamo u roku 24h, ovisno o dostupnosti svježeg sezonskog cvijeća i dogovorenom terminu dostave.',
  },
  {
    question: 'Jesu li fotografije buketa stvarne?',
    answer:   'Fotografije složenih buketa su stvarne. Ostale fotografije buketa su ilustrativnog karaktera. Svaki buket slažemo ručno od svježeg sezonskog cvijeća, pa konačan izgled može blago odstupati.',
  },
  {
    question: 'Kako mogu platiti buket?',
    answer:   'Plaćanje je moguće karticom online ili gotovinom prilikom dostave, ovisno o dostupnim opcijama na stranici.',
  },
  {
    question: 'Mogu li dodati poruku uz buket?',
    answer:   'Da, prilikom narudžbe možete upisati kratku poruku za karticu ili dodatnu napomenu.',
  },
]

export const DELIVERY_AREAS = [
  'Rijeka',
  'Kastav',
  'Viškovo',
  'Opatija',
  'Lovran',
  'Ičići',
  'Ika',
  'Šmrika',
  'Otok Krk i okolica',
] as const
