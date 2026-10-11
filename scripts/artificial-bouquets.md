# Umjetni cvjetni aranžmani — katalog (Phase 1)

Firestore collection: `artificial_bouquets`  
Document ID = SKU. Polje `id` se ne sprema. Nema kategorije veličine S/M/L.

Stranica: `/umjetni-cvjetni-aranzmani`  
Fotografije (javne WebP): `/public/images/umjetni-buketi/{SKU}.webp`  
Originali (HEIC, nisu na webu): `assets/artificial-bouquets-originals/Aranzman N.heic`

Početni katalog: 17 modela. **Ne uvozi ovaj dokument kao live proizvode.** Cijene nisu finalizirane — u Firestore upisujte `priceEur` tek kad su tri cjenovna razreda dogovorena.

## Početni modeli

| SKU | Javni naziv | Datoteka fotografije |
|---|---|---|
| UM-001 | Aranžman 1 | UM-001.webp |
| UM-002 | Aranžman 2 | UM-002.webp |
| UM-003 | Aranžman 3 | UM-003.webp |
| UM-004 | Aranžman 4 | UM-004.webp |
| UM-005 | Aranžman 5 | UM-005.webp |
| UM-006 | Aranžman 6 | UM-006.webp |
| UM-007 | Aranžman 7 | UM-007.webp |
| UM-008 | Aranžman 8 | UM-008.webp |
| UM-009 | Aranžman 9 | UM-009.webp |
| UM-010 | Aranžman 10 | UM-010.webp |
| UM-011 | Aranžman 11 | UM-011.webp |
| UM-012 | Aranžman 12 | UM-012.webp |
| UM-013 | Aranžman 13 | UM-013.webp |
| UM-014 | Aranžman 14 | UM-014.webp |
| UM-015 | Aranžman 15 | UM-015.webp |
| UM-016 | Aranžman 16 | UM-016.webp |
| UM-017 | Aranžman 17 | UM-017.webp |

Svaki model ima vlastiti `priceEur`. Tri cjenovna razreda dolaze kasnije; ne koristiti izmišljene iznose. Jedan model može imati jedan ili više jednakih fizičkih primjeraka. Količina se u Phase 1 ne prati.

## CSV stupci

```
sku,name,priceEur,image,available,active,sortOrder
```

- `sku` — ID dokumenta, oblik `UM-NNN` (npr. `UM-001`)
- `name` — javni naziv (`Aranžman 1` … `Aranžman 17`)
- `priceEur` — pozitivni broj; prazan ili `0` se odbija
- `image` — opcionalno; prazno = `/images/umjetni-buketi/{SKU}.webp`
- `available` — `true` / `false`
- `active` — `true` / `false` (`false` = sakriven s javne stranice)
- `sortOrder` — cijeli broj; manji broj = ranije unutar iste dostupnosti

Oblik retka (nije važeći uvoz dok `priceEur` nije stvarna cijena):

```
UM-001,Aranžman 1,,UM-001.webp,false,false,1
```

Prazan `priceEur` uvoz odbija, pa ovaj red ne može slučajno postati live proizvod.

## Konverzija fotografija

Originali ostaju u `assets/artificial-bouquets-originals/` (mapa je u `.gitignore`).
Imena: `Aranzman 1.heic` … `Aranzman 17.heic` → `UM-001.webp` … `UM-017.webp`.

```
npx tsx scripts/convert-artificial-bouquet-images.ts
```

WebP: najduža stranica 1600 px, kvaliteta 82, orijentacija i omjer sačuvani. Originalni HEIC se ne briše.

## Dodati proizvod

1. Uslikati aranžman i spremiti original kao `assets/artificial-bouquets-originals/Aranzman N.heic`.
2. Pokrenuti konverziju (gore) da nastane `public/images/umjetni-buketi/UM-00N.webp`.
3. Dodati red u CSV ili ručno kreirati dokument `artificial_bouquets/UM-001`.
4. Dry-run:

```
npx tsx scripts/import-artificial-bouquets.ts path/to/file.csv
```

Produkcijski upis (samo s dogovorenim cijenama):

```
npx tsx scripts/import-artificial-bouquets.ts path/to/file.csv --confirm
```

Postojeći dokumenti se ne prepisuju osim s `--overwrite`. Svi redovi se validiraju prije bilo kojeg upisa.

## Promijeniti cijenu

Ažurirati `priceEur` u Firestoreu ili u CSV-u pa `--confirm --overwrite` za taj SKU.

## Trenutačno nedostupno (`available=false`)

Proizvod ostaje vidljiv, označen kao „Trenutačno nedostupno“.

## Sakriti proizvod (`active=false`)

Proizvod nestaje s javne stranice.

## Firestore pravila

U repozitoriju nema `firestore.rules`. Admin SDK zaobilazi pravila. Klijentu treba zabraniti čitanje i pisanje kolekcije `artificial_bouquets`. Ne dirati postojeća klijentska pravila za `orders`.
