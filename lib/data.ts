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

// Single source of truth — add more images by incrementing the length.
// All files must exist as /public/images/slozeni-buketi/buket-N.jpg (lowercase).
export const GALLERY_IMAGES: GalleryImage[] = Array.from({ length: 15 }, (_, i) => ({
  src: `/images/slozeni-buketi/buket-${i + 1}.jpg`,
  alt: `Stvarni buket ${i + 1} složen za dostavu cvijeća u Rijeci`,
}))

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
