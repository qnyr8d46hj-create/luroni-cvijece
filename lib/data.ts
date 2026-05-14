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

export const GALLERY_IMAGES: GalleryImage[] = [
  { src: '/images/slozeni-buketi/buket-1.jpg', alt: 'Proljetni buket s mješavinom sezonskog cvijeća' },
  { src: '/images/slozeni-buketi/buket-2.jpg', alt: 'Romantični buket ruža za posebnu prigodu' },
  { src: '/images/slozeni-buketi/buket-3.jpg', alt: 'Elegantni bijeli buket za svečane prigode' },
  { src: '/images/slozeni-buketi/buket-4.jpg', alt: 'Šareni sezonski buket s tulipanima i ružama' },
  { src: '/images/slozeni-buketi/buket-5.jpg', alt: 'Nježni pastelni buket za rođendan' },
  { src: '/images/slozeni-buketi/buket-6.jpg', alt: 'Svježi buket s dostavom u Rijeci i na Krku' },
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
