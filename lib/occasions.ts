export interface Occasion {
  id: string
  title: string
  description: string
  image: string
  alt: string
  order: number
}

/**
 * Homepage occasion cards. Copy and images are test-friendly and can be
 * swapped without touching checkout or product identifiers.
 */
export const OCCASIONS: Occasion[] = [
  {
    id: 'rodendan',
    title: 'Rođendan',
    description: 'Neka se osjećaju posebno.',
    image: '/images/slozeni-buketi/buket-7.jpg',
    alt: 'Šareni buket s ružičastim gerberama, prikladan za rođendanski dar',
    order: 1,
  },
  {
    id: 'ljubav-godisnjica',
    title: 'Ljubav & godišnjica',
    description: 'Za trenutke kada želite reći više.',
    image: '/images/slozeni-buketi/buket-5.jpg',
    alt: 'Raskošni buket božura u ružičastim i crvenim tonovima',
    order: 2,
  },
  {
    id: 'oprosti-mi',
    title: 'Oprosti mi',
    description: 'Ponekad riječi nisu dovoljne.',
    image: '/images/slozeni-buketi/buket-16.jpg',
    alt: 'Nježan buket s bijelim ljiljanom i pastelnim cvijećem',
    order: 3,
  },
  {
    id: 'rodenje-bebe',
    title: 'Rođenje bebe',
    description: 'Nježna dobrodošlica za novi život.',
    image: '/images/slozeni-buketi/buket-4.jpg',
    alt: 'Pastelni buket u plavom papiru, nježnih ružičastih i bijelih tonova',
    order: 4,
  },
  {
    id: 'luroni-signature',
    title: 'Luroni Signature',
    description:
      'Za sve ostale trenutke. Recite nam prigodu i prepustite ostalo našem floristu.',
    image: '/images/slozeni-buketi/buket-1.jpg',
    alt: 'Ručno složen Luroni buket s breskvasto-ružičastim ružama i crvenim bobicama',
    order: 5,
  },
]
