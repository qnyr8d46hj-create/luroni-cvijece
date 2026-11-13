// Deterministic Croatian gallery text. This module must stay free of network
// calls, paid APIs, Firebase, and Google credentials. Titles stay within eight
// words. A quoted or premium bouquet name is kept as written. A flower or an
// occasion is used only when the Google summary says it. Promotional sentences
// are not appended to the title. The visible description is the florist's
// factual wording, at most two short sentences and about 150 characters, and it
// is omitted when it would only repeat the title or a slogan. Colors, prices,
// and places are never added.

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
  { forms: ['anturij', 'anturija', 'anturije', 'anturiju', 'anturijem', 'anthurium', 'anthuriuma'], phrase: 'anturija' },
  { forms: ['margareta', 'margarete', 'margaretu', 'margaretom', 'margaretama'], phrase: 'margareta' },
  { forms: ['gladijol', 'gladijola', 'gladijole', 'gladijolu', 'gladijoli', 'gladijolima'], phrase: 'gladijola' },
  { forms: ['alstromerija', 'alstromerije', 'alstromeriju', 'alstromerijom', 'alstromerijama', 'alstroemeria'], phrase: 'alstromerija' },
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
  'spoj', 'spaja', 'spajaju', 'spajanje',
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
  return /^(svjez|prekras|dostav|naruc|pogled|lijep|divn|raskos|harmon|emoc|elegan|njez|romantic|upecat|kombinac)/.test(word)
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

const DESCRIPTION_LIMIT = 150
const ALT_LIMIT = 180
const TITLE_WORD_LIMIT = 8

const SLOGAN = [
  /harmonij/,
  /elegancij/,
  /\bemocij/,
  /raskos\s+boja/,
  /boja i elegan/,
  /\bponekad\b/,
  /uljeps/,
  /privlac/,
  /jedan od njih/,
  /nije dovolj/,
  /za trenutke/,
  /pogledajte|\bnarucite\b|\bnaruci\b|\bjavite\b|\bpozovite\b|\bpratite\b|\bposjetite\b/,
  /modernim detalj/,
  /toplim ton/,
  /u svakom cvijet/,
  /odusev/,
  /\bklasika\b/,
]

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length
}

function capitalizeFirst(value: string): string {
  if (!value) return value
  return value.charAt(0).toLocaleUpperCase('hr-HR') + value.slice(1)
}

function isSlogan(sentence: string): boolean {
  if (detectFlowers(sentence).length > 0) return false
  const folded = fold(sentence)
  return SLOGAN.some((pattern) => pattern.test(folded))
}

function stripLeadingHype(value: string): string {
  const pattern = /^(?:prekrasan|prekrasna|prekrasno|prekrasni|prekrasne|divan|divna|divno|raskošan|raskošna|raskošni|nježan|nježna|romantičan|romantična|upečatljiv|upečatljiva|upečatljive|svjež|svježa|svježi|svježe|novi|nova|novo|naš|naša|ovaj|ova|ovo)\s+/i
  let current = value.trim()
  let next = current.replace(pattern, '').trim()
  while (next && next !== current) {
    current = next
    next = current.replace(pattern, '').trim()
  }
  return current
}

function stripCutoffFragment(value: string): string {
  return value.replace(/,\s*\p{L}{1,3}$/u, '').trim()
}

function segmentSummary(summary: string): string[] {
  const broken = summary
    .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '\n')
    .replace(/\u200d/g, '')
  const promoStart = /(?<=\S)\s+(?=(?:Ponekad|Neki|Za trenutke|Jer|Naručite|Pogledajte|Javite|Pozovite)\b)/
  return splitSentences(broken).flatMap((part) => part.split(promoStart).map((piece) => piece.trim()).filter(Boolean))
}

function acceptableBouquetName(name: string): boolean {
  const count = wordCount(name)
  if (count < 1 || count > 4) return false
  if (/\b(?:ponekad|dovoljan|naruci|pogledaj|javite|uljeps|privlac|trenutke)\b/.test(fold(name))) return false
  return words(name).some((word) => !isGeneric(word))
}

function buildNamedTitle(lead: string | undefined, name: string, quoted = false): string | null {
  const cleanedName = name.replace(/\s+/g, ' ').trim()
  if (!acceptableBouquetName(cleanedName)) return null
  const nameWords = words(cleanedName)
  if (nameWords.length > 0 && nameWords.every((word) => FLOWER_PHRASE.has(word) || isGeneric(word))) return null
  const prefix = lead ? `${capitalizeFirst(lead.trim())} ` : ''
  const noun = prefix ? 'buket' : 'Buket'
  const displayName = quoted ? `„${cleanedName}”` : cleanedName
  const title = `${prefix}${noun} ${displayName}`.replace(/\s+/g, ' ').trim()
  if (wordCount(title) < 3 || wordCount(title) > TITLE_WORD_LIMIT) return null
  return title
}

function namedBouquetTitle(summary: string): string | null {
  const text = stripEmoji(summary).replace(/[<>#]/g, ' ').replace(/\s+/g, ' ').trim()
  const quoted = text.match(/\b((?:premium|luksuzni|luksuzna)\s+)?buket\s*[„“"']\s*([^„“"”']{2,40}?)\s*[”"']/iu)
  if (quoted) {
    const built = buildNamedTitle(quoted[1], quoted[2], true)
    if (built) return built
  }
  const premium = text.match(/\b(premium|luksuzni|luksuzna)\s+buket\s+/iu)
  if (!premium || premium.index === undefined) return null
  const tokens = text.slice(premium.index + premium[0].length).match(/\p{L}+/gu) ?? []
  const name: string[] = []
  for (const token of tokens) {
    const folded = fold(token)
    if (['ponekad', 'neki', 'ovaj', 'ova', 'ovo', 'jer', 'narucite', 'pogledajte', 'javite', 'pozovite', 'za'].includes(folded)) break
    if (name.length === 3) break
    name.push(token)
  }
  return name.length > 0 ? buildNamedTitle(premium[1], name.join(' ')) : null
}

function fitTitle(title: string | null): string | null {
  if (!title) return null
  if (wordCount(title) <= TITLE_WORD_LIMIT) return title
  const flowers = detectFlowers(title)
  for (let count = Math.min(flowers.length, 2); count >= 1; count -= 1) {
    const shorter = composeTitle(flowers.slice(0, count), null, false, false)
    if (shorter && wordCount(shorter) <= TITLE_WORD_LIMIT) return shorter
  }
  return null
}

function shortBouquetLabel(sentences: string[]): string | null {
  for (const sentence of sentences) {
    const stripped = stripLeadingHype(stripTrailingPeriod(sentence))
    if (!/^buket\b/i.test(stripped)) continue
    if (wordCount(stripped) < 2 || wordCount(stripped) > TITLE_WORD_LIMIT) continue
    if (isSlogan(stripped)) continue
    const tokens = words(stripped)
    if (tokens.some((word) => word !== 'buket' && isGeneric(word))) continue
    const content = tokens.filter((word) => word !== 'buket')
    if (content.length === 0) continue
    if (content.filter((word) => FLOWER_PHRASE.has(word)).length > 1) continue
    if (content.every((word) => FLOWER_PHRASE.has(word))) return capitalizeFirst(stripped)
    if (/^(?:spaj|sloz|pokaz|privlac|stvar|kombin|odusev)/.test(content[0] ?? '')) continue
    if (detectFlowers(stripped).length === 0) return capitalizeFirst(stripped)
  }
  return null
}

function joinPhrases(phrases: string[]): string {
  if (phrases.length <= 1) return phrases[0] ?? ''
  if (phrases.length === 2) return `${phrases[0]} i ${phrases[1]}`
  return `${phrases.slice(0, -1).join(', ')} i ${phrases[phrases.length - 1]}`
}

function composeTitle(flowers: string[], occasion: Occasion | null, season: boolean, arrangement: boolean): string | null {
  // One flower keeps a fallback specific. A list of roses, carnations, and
  // eucalyptus is not a title: those facts belong in the description.
  const picked = flowers.slice(0, 1)
  if (picked.length > 0) {
    const noun = `Buket ${joinPhrases(picked)}`
    return occasion ? `${noun} ${occasion.suffix}` : noun
  }
  if (season && occasion) return `Sezonski buket ${occasion.suffix}`
  if (season) return 'Sezonski buket'
  if (arrangement && occasion) return `Cvjetni aranžman ${occasion.suffix}`
  if (arrangement) return 'Cvjetni aranžman'
  if (occasion) return `Buket ${occasion.suffix}`
  return null
}

const HEADLINE_TAILS = [
  /[,]?\s+elegancije i emocija$/i,
  /\s+boja i elegancije$/i,
  /\s+u svakom cvijetu$/i,
  /\s+u toplim tonovima$/i,
  /\s+s modernim detaljem$/i,
]

const COLOR_WORD = /^(?:bijel\p{L}*|crven\p{L}*|ružičast\p{L}*|ruzicast\p{L}*|narančast\p{L}*|narancast\p{L}*|žut\p{L}*|zut\p{L}*|ljubičast\p{L}*|ljubicast\p{L}*|plav\p{L}*|zelen\p{L}*|bordo|roze|roza)$/iu

function headlineRejected(value: string): boolean {
  return /^(?:danas|pogledaj|ponekad|neki|postoje|ovaj|ova|ovo|za\s+trenutke|naru[cč]|javite|pozovite)/i.test(value.trim())
}

function fillerHeadline(value: string): boolean {
  const tokens = words(value).filter((word) => !['i', 'u', 's', 'sa', 'uz', 'od', 'za'].includes(word))
  if (tokens.length === 0) return true
  const fillers = new Set(['prekrasan', 'prekrasna', 'prekrasno', 'prekrasni', 'cvijece', 'cvijeca', 'cvijecem', 'buket', 'buketa', 'nas', 'novi', 'nova', 'novo'])
  return tokens.every((word) => fillers.has(word))
}

function stripTitleHype(value: string): string {
  return value.replace(/^(?:prekrasan|prekrasna|prekrasno|divan|divna|divno|ovaj|ova|novo|novi|naš|naša)\s+/i, '').trim()
}

function hasColor(sentence: string): boolean {
  return (sentence.match(/\p{L}+/gu) ?? []).some((token) => COLOR_WORD.test(token))
}

function shortenHeadline(headline: string): string | null {
  let current = stripTrailingPeriod(headline).replace(/\s+/g, ' ').trim()
  if (!current || headlineRejected(current)) return null
  for (const tail of HEADLINE_TAILS) {
    const next = current.replace(tail, '').replace(/[,]+$/g, '').trim()
    if (next && wordCount(next) >= 2 && !fillerHeadline(next)) current = next
  }
  current = stripTitleHype(current)
  const tokens = current.match(/\p{L}+/gu) ?? []
  if (tokens.length > 4) {
    const restIsInventory = tokens.slice(2).every((token) => {
      const folded = fold(token)
      return isGeneric(folded) || Boolean(FLOWER_PHRASE.get(folded)) || COLOR_WORD.test(token)
    })
    if (restIsInventory) current = current.split(/\s+/).slice(0, 2).join(' ')
  }
  if (wordCount(current) < 2 || wordCount(current) > 5 || fillerHeadline(current)) return null
  return capitalizeFirst(current)
}

function distinctiveHeadline(summary: string): string | null {
  const broken = summary.replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '\n').replace(/\u200d/g, '')
  const first = splitSentences(broken)[0]
  if (!first) return null
  const headline = cleanSentence(stripEmoji(first).replace(/[<>#]/g, ' '))
  if (!headline || wordCount(headline) > 12 || OPERATIONAL.some((pattern) => pattern.test(headline))) return null
  return shortenHeadline(headline)
}

function meaningfulExtras(text: string, title: string): string[] {
  const used = new Set(words(title))
  const usedFlowers = new Set(detectFlowers(title))
  return words(text).filter((word) => {
    if (isGeneric(word) || used.has(word)) return false
    const flower = FLOWER_PHRASE.get(word)
    return !flower || !usedFlowers.has(flower)
  })
}

function repeatsTitle(description: string, title: string): boolean {
  const left = fold(stripTrailingPeriod(description))
  const right = fold(stripTrailingPeriod(title))
  if (!left || !right) return false
  if (left === right) return true
  if (!left.startsWith(right)) return false
  const rest = left.slice(right.length).replace(/^[\s.:;-]+/, '')
  return rest.length === 0 || words(rest).every((word) => isGeneric(word))
}

function ensurePeriod(value: string): string {
  const trimmed = value.trim()
  if (/[.!?…]$/.test(trimmed)) return trimmed
  return `${trimmed}.`
}

function factualDescription(sentences: string[], title: string): string | null {
  const chosen: string[] = []
  for (const sentence of sentences) {
    if (isSlogan(sentence)) continue
    if (detectFlowers(sentence).length === 0 && !hasSeason(sentence) && !hasArrangement(sentence) && !hasColor(sentence)) continue
    if (meaningfulExtras(sentence, title).length === 0 || repeatsTitle(sentence, title)) continue
    const next = ensurePeriod(stripTrailingPeriod(sentence))
    const joined = [...chosen, next].join(' ')
    if (chosen.length === 2) break
    if (joined.length <= DESCRIPTION_LIMIT) {
      chosen.push(next)
      continue
    }
    if (chosen.length === 0) chosen.push(clipWords(next, DESCRIPTION_LIMIT))
    break
  }
  const description = chosen.join(' ').trim()
  if (!description || repeatsTitle(description, title)) return null
  return description
}

function descriptiveAlt(title: string, description: string | null): string {
  if (!description) return title
  if (repeatsTitle(description, title) || fold(description).includes(fold(title))) return clipWords(description, ALT_LIMIT)
  return clipWords(`${stripTrailingPeriod(title)}. ${description}`, ALT_LIMIT)
}

export function galleryMetadata(summary: string): GalleryMetadata {
  const sentences = segmentSummary(summary)
    .filter((sentence) => !OPERATIONAL.some((pattern) => pattern.test(sentence)))
    .map(cleanSentence)
    .map(stripCutoffFragment)
    .filter((sentence) => sentence.length >= 3 && !isSlogan(sentence))
  const text = sentences.join(' ')
  const flowers = detectFlowers(text)
  const occasion = detectOccasion(text)
  const title = namedBouquetTitle(summary)
    ?? distinctiveHeadline(summary)
    ?? shortBouquetLabel(sentences)
    ?? fitTitle(composeTitle(flowers, occasion, hasSeason(text), hasArrangement(text)))
    ?? NEUTRAL_GALLERY_TITLE
  const specific = title !== NEUTRAL_GALLERY_TITLE
  const description = specific ? factualDescription(sentences, title) : null

  return {
    title,
    alt: specific ? descriptiveAlt(title, description) : FALLBACK_GALLERY_ALT,
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
