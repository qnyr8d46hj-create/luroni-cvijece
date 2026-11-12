// Deterministic Croatian gallery text. This module must stay free of network
// calls, paid APIs, Firebase, and Google credentials. A title may name a flower
// or an occasion only when the Google summary contains that word. Colors,
// prices, and places are never added. When the summary does not support a
// specific title, the public description is left empty so the same generic
// sentence is not repeated under every photo.

import { FLORIST_ID, SITE_URL } from '../seo'
import type { PublicGalleryPhoto } from './public'

export const NEUTRAL_GALLERY_TITLE = 'Buket cvijeća iz ponude Luroni cvijeće'
export const FALLBACK_GALLERY_ALT = 'Nedavno izrađen buket cvjećarnice Luroni'
export const GALLERY_PAGE_URL = `${SITE_URL}/galerija`

export interface GalleryMetadata {
  title: string
  alt: string
  description: string | null
  occasion: string | null
}

interface Occasion {
  label: string
  suffix: string
}

interface FlowerEntry {
  forms: readonly string[]
  phrase: string
}

const FLOWERS: readonly FlowerEntry[] = [
  { forms: ['ruza', 'ruze', 'ruzu', 'ruzom', 'ruzi', 'ruzama', 'ruzin', 'ruzina', 'ruzino'], phrase: 'ruža' },
  { forms: ['tulipan', 'tulipana', 'tulipani', 'tulipane', 'tulipanima', 'tulipanom'], phrase: 'tulipana' },
  { forms: ['bozur', 'bozura', 'bozuri', 'bozure', 'bozurima'], phrase: 'božura' },
  { forms: ['ljiljan', 'ljiljana', 'ljiljani', 'ljiljane', 'ljiljanima'], phrase: 'ljiljana' },
  { forms: ['orhideja', 'orhideje', 'orhideju', 'orhidejom', 'orhidejama'], phrase: 'orhideja' },
  { forms: ['hortenzija', 'hortenzije', 'hortenziju', 'hortenzijom', 'hortenzijama'], phrase: 'hortenzija' },
  { forms: ['gerber', 'gerbera', 'gerbere', 'gerberu', 'gerberom', 'gerberi', 'gerberima'], phrase: 'gerbera' },
  { forms: ['suncokret', 'suncokreta', 'suncokreti', 'suncokrete', 'suncokretima'], phrase: 'suncokreta' },
  { forms: ['karanfil', 'karanfila', 'karanfili', 'karanfile', 'karanfilima'], phrase: 'karanfila' },
  { forms: ['frezija', 'frezije', 'freziju', 'frezijom', 'frezijama'], phrase: 'frezija' },
  { forms: ['iris', 'irisa', 'irisi', 'irise', 'irisima'], phrase: 'irisa' },
  { forms: ['margareta', 'margarete', 'margaretu', 'margaretom', 'margaretama'], phrase: 'margareta' },
  { forms: ['gladijol', 'gladijola', 'gladijole', 'gladijolu', 'gladijoli', 'gladijolima'], phrase: 'gladijola' },
  { forms: ['alstromerija', 'alstromerije', 'alstromeriju', 'alstroemeria'], phrase: 'alstromerija' },
  { forms: ['krizantema', 'krizanteme', 'krizantemu', 'krizantemom', 'krizantemama'], phrase: 'krizantema' },
  { forms: ['ljubicica', 'ljubicice', 'ljubicicu', 'ljubicicom', 'ljubicicama'], phrase: 'ljubičica' },
  { forms: ['ranunkul', 'ranunkula', 'ranunkule', 'ranunkulu', 'ranunkulom'], phrase: 'ranunkula' },
  { forms: ['anemona', 'anemone', 'anemonu', 'anemonom'], phrase: 'anemona' },
  { forms: ['kala', 'kale', 'kalu', 'kalom', 'kalama'], phrase: 'kala' },
  { forms: ['seboj', 'seboja', 'seboji', 'seboje'], phrase: 'šeboja' },
  { forms: ['jorgovan', 'jorgovana', 'jorgovani', 'jorgovane'], phrase: 'jorgovana' },
  { forms: ['mimoza', 'mimoze', 'mimozu', 'mimozom'], phrase: 'mimoza' },
  { forms: ['visibaba', 'visibabe', 'visibabu', 'visibabom'], phrase: 'visibaba' },
  { forms: ['narcis', 'narcisa', 'narcisi', 'narcise', 'narcisima'], phrase: 'narcisa' },
  { forms: ['zumbul', 'zumbula', 'zumbuli', 'zumbule'], phrase: 'zumbula' },
  { forms: ['dalija', 'dalije', 'daliju', 'dalijom'], phrase: 'dalija' },
  { forms: ['aster', 'astera', 'asteri', 'astere', 'asterima'], phrase: 'astera' },
  { forms: ['gipsofila', 'gipsofile', 'gipsofilu', 'gipsofilom'], phrase: 'gipsofile' },
  { forms: ['eukaliptus', 'eukaliptusa', 'eukaliptusu', 'eukaliptusom', 'eukaliptusi'], phrase: 'eukaliptusa' },
  { forms: ['pampas', 'pampasa'], phrase: 'pampas trave' },
  { forms: ['mak', 'makov', 'makova', 'makovi', 'makove'], phrase: 'makova' },
]

const FLOWER_PHRASE = new Map<string, string>()
for (const flower of FLOWERS) {
  for (const form of flower.forms) FLOWER_PHRASE.set(form, flower.phrase)
}

const OCCASIONS: readonly { pattern: RegExp; label: string; suffix: string }[] = [
  { pattern: /\brodendan/, label: 'rođendan', suffix: 'za rođendan' },
  { pattern: /\bvjencan|\bmladenc/, label: 'vjenčanje', suffix: 'za vjenčanje' },
  { pattern: /\bgodisnjic/, label: 'godišnjica', suffix: 'za godišnjicu' },
  { pattern: /\bvalentin/, label: 'Valentinovo', suffix: 'za Valentinovo' },
  { pattern: /\bmajcin dan\b/, label: 'Majčin dan', suffix: 'za Majčin dan' },
  { pattern: /\bdan zena\b|\bosmi mart\b|\b8\s*\.?\s*mart\b/, label: 'Dan žena', suffix: 'za Dan žena' },
  { pattern: /\bkrstenj/, label: 'krštenje', suffix: 'za krštenje' },
  { pattern: /\bdiplom/, label: 'diploma', suffix: 'za diplomu' },
  { pattern: /\bzahval/, label: 'zahvala', suffix: 'za zahvalu' },
  { pattern: /\bisprik/, label: 'isprika', suffix: 'za ispriku' },
  { pattern: /\bsucut|\bsahran|\bpogreb|\bposljednji pozdrav|\bposlednji pozdrav/, label: 'sućut', suffix: 'za izraze sućuti' },
  { pattern: /\bbozic/, label: 'Božić', suffix: 'za Božić' },
  { pattern: /\buskrs/, label: 'Uskrs', suffix: 'za Uskrs' },
  { pattern: /\bnov[aeu] godin/, label: 'Nova godina', suffix: 'za Novu godinu' },
  { pattern: /\brodenj|\bnovorodjen|\bbeba\b|\bbebe\b|\bbebu\b/, label: 'rođenje', suffix: 'za rođenje djeteta' },
]

const OPERATIONAL: readonly RegExp[] = [
  /radno vrijeme|radnim vremenom|otvoreni smo|working hours/i,
  /(?:^|\s)zatvoreno(?:\s|[.!,]|$)|ne radimo|godišnji odmor|godisnji odmor|neradni/i,
  /zapošljav|zaposljav|tražimo radnik|trazimo radnik|natječaj|natjecaj|otvorena pozicija/i,
  /recenzij|ocijenite nas|ostavite recenz|google recenz|review us/i,
  /kako doći|kako doci|parkiranj/i,
]

const GENERIC = new Set([
  'buket', 'buketa', 'bukete', 'buketi', 'buketu', 'buketom', 'buketima',
  'cvijet', 'cvijeta', 'cvijetu', 'cvijetom', 'cvjetovi', 'cvjetova', 'cvjetove',
  'cvijece', 'cvijeca', 'cvijecem', 'cvjetni', 'cvjetna', 'cvjetno', 'cvjetnog', 'cvjetne', 'cvjetnu',
  'prekrasan', 'prekrasna', 'prekrasno', 'prekrasni', 'prekrasne', 'prekrasnog', 'prekrasnu',
  'divan', 'divna', 'divno', 'divni', 'divne', 'lijep', 'lijepa', 'lijepo', 'lijepi', 'lijepe', 'lijepu',
  'novi', 'nova', 'novo', 'nove', 'novu', 'novog', 'nas', 'nasa', 'nase', 'nasu', 'naseg',
  'pogledajte', 'pogledaj', 'danas', 'jucer', 'sutra', 'smo', 'ste', 'sam', 'biti', 'bio', 'bila', 'bilo',
  'ovaj', 'ova', 'ovo', 'ove', 'ovog', 'ovom', 'jedan', 'jedna', 'jedno', 'jednu',
  'poseban', 'posebna', 'posebno', 'posebni', 'posebne', 'rucno', 'slozen', 'slozena', 'slozeno',
  'slozeni', 'slozene', 'slozili', 'slozila', 'izradili', 'izradila', 'cvjecarnice', 'cvjecarna',
  'cvjecarnica', 'luroni', 'ponude', 'ponuda', 'ponudu', 'galerija', 'fotografija', 'fotografije', 'foto',
  'dostava', 'dostavu', 'dostave', 'dostavom', 'dostavljamo', 'narucite', 'naruci', 'naruciti',
  'javite', 'pozovite', 'kontaktirajte', 'pratite', 'posjetite', 'koji', 'koja', 'koje', 'koju',
  'nama', 'vama', 'vas', 'malo', 'jako', 'vrlo', 'bas', 'dan', 'dana', 'jutro', 'jutros',
  'cijena', 'cijene', 'cijenu', 'cijenom', 'akcija', 'popust',
])

const PRICE_PATTERN = /(?:€|\beur(?:a|o)?\b|\bkn\b|\bkuna\b)\s*\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?\s*(?:€|\beur(?:a|o)?\b|\bkn\b|\bkuna\b)/gi
const URL_PATTERN = /\b(?:https?:\/\/|www\.)\S+/gi
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
const PHONE_PATTERN = /(?:\+385|00385|0\d{2})[\s./-]?\d{3}[\s./-]?\d{3,4}/g
const HANDLE_PATTERN = /@[A-Za-z0-9._]{2,}/g

function fold(value: string): string {
  return value
    .toLocaleLowerCase('hr-HR')
    .replace(/đ/g, 'd')
    .replace(/[čć]/g, 'c')
    .replace(/š/g, 's')
    .replace(/ž/g, 'z')
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
}

function words(value: string): string[] {
  return fold(value).match(/[a-z0-9]+/g) ?? []
}

function isGeneric(word: string): boolean {
  if (word.length < 4) return true
  if (GENERIC.has(word)) return true
  return /^(svjez|prekras|dostav|naruc|pogled|lijep|divn)/.test(word)
}

function stripEmoji(value: string): string {
  return value.replace(/[\p{Extended_Pictographic}\u200d\uFE0F]/gu, '')
}

function sanitize(value: string): string {
  return stripEmoji(value).replace(/[<>]/g, '').replace(/#/g, '').replace(/\s+/g, ' ').trim()
}

function splitSentences(text: string): string[] {
  return (text.match(/[^.!?\n]+[.!?]?/g) ?? []).map((part) => part.trim()).filter(Boolean)
}

const LOCATION_WORD = 'rijeci|rijek[aeou]m?|rije[cč]k[a-zčćšđž]*|krk|krka|krku|krkom|opatij[a-zčćšđž]*|kastav[a-zčćšđž]*|vi[sš]kov[a-zčćšđž]*|lovran[a-zčćšđž]*|malinsk[a-zčćšđž]*|dobrinj[a-zčćšđž]*|i[cč]i[cć]i[a-zčćšđž]*|šmrik[a-zčćšđž]*|smrik[a-zčćšđž]*|otok|otoka|otoku|otokom'

function stripLocations(value: string): string {
  return value
    .replace(new RegExp(`\\b(?:u|na|za|iz|po)\\s+(?:otok(?:a|u|om)?\\s+)?(?:${LOCATION_WORD})\\b`, 'gi'), ' ')
    .replace(new RegExp(`\\b(?:${LOCATION_WORD})\\b`, 'gi'), ' ')
}

function stripDangling(value: string): string {
  let current = value.trim()
  let next = current.replace(/\b(?:za|od|sa|s|na|u|iz|i|te|po)\s*$/i, '').trim()
  while (next !== current) {
    current = next
    next = current.replace(/\b(?:za|od|sa|s|na|u|iz|i|te|po)\s*$/i, '').trim()
  }
  return current
}

function cleanSentence(sentence: string): string {
  const cleaned = stripDangling(
    stripLocations(sentence)
      .replace(URL_PATTERN, ' ')
      .replace(EMAIL_PATTERN, ' ')
      .replace(PHONE_PATTERN, ' ')
      .replace(HANDLE_PATTERN, ' ')
      .replace(PRICE_PATTERN, ' ')
      .replace(/\b(?:cijena|cijene|cijenu|cijenom|akcija|popust)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\s+([,.!?])/g, '$1')
      .replace(/^[\s,.;:!-]+|[\s,;:-]+$/g, ''),
  )
  return cleaned.replace(/[.]+$/g, (ending) => (cleaned.length > ending.length ? '.' : '')).replace(/\s+/g, ' ').trim()
}

function stripTrailingPeriod(value: string): string {
  return value.replace(/[.!?…]+$/g, '').trim()
}

function clipWords(value: string, max: number): string {
  if (value.length <= max) return value
  const clipped = value.slice(0, max + 1)
  const boundary = clipped.lastIndexOf(' ')
  const stem = (boundary > 40 ? clipped.slice(0, boundary) : value.slice(0, max)).trim()
  return `${stem.replace(/[,:;-]+$/g, '').trim()}…`
}

function normalizeTitleCase(value: string): string {
  const letters = value.match(/\p{L}/gu) ?? []
  if (letters.length < 4) return value
  const upper = letters.filter((char) => char === char.toLocaleUpperCase('hr-HR') && char !== char.toLocaleLowerCase('hr-HR'))
  if (upper.length / letters.length < 0.8) return value
  const lower = value.toLocaleLowerCase('hr-HR')
  const cased = lower.charAt(0).toLocaleUpperCase('hr-HR') + lower.slice(1)
  return cased.replace(/\bluroni\b/gi, 'Luroni')
}

function detectFlowers(text: string): string[] {
  const found: string[] = []
  for (const word of words(text)) {
    const phrase = FLOWER_PHRASE.get(word)
    if (!phrase || found.includes(phrase)) continue
    found.push(phrase)
    if (found.length === 3) break
  }
  return found
}

function detectOccasion(text: string): Occasion | null {
  const folded = fold(text)
  let best: { index: number; occasion: Occasion } | null = null
  for (const occasion of OCCASIONS) {
    const match = occasion.pattern.exec(folded)
    if (!match) continue
    if (!best || match.index < best.index) best = { index: match.index, occasion }
  }
  return best?.occasion ?? null
}

function hasSeason(text: string): boolean {
  return /\bsezon/.test(fold(text))
}

function hasArrangement(text: string): boolean {
  return /\baranz/.test(fold(text))
}

function sentenceIsSpecific(sentence: string): boolean {
  if (detectFlowers(sentence).length > 0 || detectOccasion(sentence) || hasSeason(sentence) || hasArrangement(sentence)) {
    return true
  }
  const folded = fold(sentence)
  if (!/\b(?:buket\w*|cvijet\w*|cvije\w*|cvjec\w*|aranz\w*)/.test(folded)) return false
  return words(sentence).some((word) => !isGeneric(word))
}

function joinPhrases(phrases: string[]): string {
  if (phrases.length <= 1) return phrases[0] ?? ''
  if (phrases.length === 2) return `${phrases[0]} i ${phrases[1]}`
  return `${phrases.slice(0, -1).join(', ')} i ${phrases[phrases.length - 1]}`
}

function composeTitle(flowers: string[], occasion: Occasion | null, season: boolean, arrangement: boolean): string | null {
  if (flowers.length > 0) {
    const noun = `Buket ${joinPhrases(flowers)}`
    return occasion ? `${noun} ${occasion.suffix}` : noun
  }
  if (season && occasion) return `Sezonski buket ${occasion.suffix}`
  if (season) return 'Sezonski buket'
  if (arrangement && occasion) return `Cvjetni aranžman ${occasion.suffix}`
  if (arrangement) return 'Cvjetni aranžman'
  if (occasion) return `Buket ${occasion.suffix}`
  return null
}

function chooseTitle(first: string | null, flowers: string[], occasion: Occasion | null, season: boolean, arrangement: boolean): string {
  if (first && first.length <= 90 && sentenceIsSpecific(first)) return normalizeTitleCase(stripTrailingPeriod(first))
  const composed = composeTitle(flowers, occasion, season, arrangement)
  if (composed) return composed
  if (first && sentenceIsSpecific(first)) return normalizeTitleCase(clipWords(stripTrailingPeriod(first), 90))
  return NEUTRAL_GALLERY_TITLE
}

function meaningfulExtras(text: string, title: string): string[] {
  const used = new Set(words(title))
  return words(text).filter((word) => !isGeneric(word) && !used.has(word))
}

export function galleryMetadata(summary: string): GalleryMetadata {
  const sentences = splitSentences(sanitize(summary))
    .filter((sentence) => !OPERATIONAL.some((pattern) => pattern.test(sentence)))
    .map(cleanSentence)
    .filter((sentence) => sentence.length >= 3)
  const text = sentences.join(' ')
  const flowers = detectFlowers(text)
  const occasion = detectOccasion(text)
  const title = chooseTitle(sentences[0] ?? null, flowers, occasion, hasSeason(text), hasArrangement(text))
  const specific = title !== NEUTRAL_GALLERY_TITLE
  const descriptionSentences = specific
    ? sentences.filter((sentence) => meaningfulExtras(sentence, title).length > 0).slice(0, 2)
    : []
  const joined = descriptionSentences.join(' ').trim()
  const description = joined && joined !== title && meaningfulExtras(joined, title).length > 0
    ? clipWords(joined, 320)
    : null

  return {
    title,
    alt: specific ? title : FALLBACK_GALLERY_ALT,
    description,
    occasion: occasion?.label ?? null,
  }
}

export function galleryAlt(summary: string): string {
  return galleryMetadata(summary).alt
}

export function galleryImageGalleryJsonLd(photos: PublicGalleryPhoto[]) {
  const images = photos.flatMap((photo) => {
    let contentUrl: URL
    try {
      contentUrl = new URL(photo.src)
    } catch {
      return []
    }
    if (contentUrl.protocol !== 'https:' || contentUrl.hostname !== 'firebasestorage.googleapis.com') return []
    const name = sanitize(photo.title)
    if (!name) return []
    const image: { '@type': 'ImageObject'; contentUrl: string; name: string; description?: string } = {
      '@type': 'ImageObject',
      contentUrl: photo.src,
      name,
    }
    const description = photo.description ? sanitize(photo.description) : ''
    if (description && description !== name && description !== NEUTRAL_GALLERY_TITLE && description !== FALLBACK_GALLERY_ALT) {
      image.description = description
    }
    return [image]
  })
  if (images.length === 0) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    '@id': `${GALLERY_PAGE_URL}#gallery`,
    name: 'Galerija buketa',
    url: GALLERY_PAGE_URL,
    inLanguage: 'hr-HR',
    publisher: { '@id': FLORIST_ID },
    image: images,
  }
}
