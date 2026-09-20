// ── NN 101/2026-1213 sales-outlet identity for price-list filenames ──
//
// Change outlet identity here only. Filenames are built from this object.
//
// TODO(NN 101/2026): `address` is currently the registered company seat from
// app/components/LegalPage.tsx (Gornja Švarča 19, 47000 Karlovac). Confirm
// whether this is the correct "adresa prodajnog objekta" for the online sales
// outlet. Do not invent a Rijeka address. Company OIB stays on legal pages
// and is not the outlet identifier.

export const PRICE_LIST_OUTLET = {
  form:        'internetska-prodaja',
  address:     'Gornja Švarča 19, 47000 Karlovac',
  addressSlug: 'Gornja-Svarca-19-47000-Karlovac',
  identifier:  'LURONI-WEB-01',
  version:     'v1',
} as const
