// Mocked Google responses only. This file must not call the live Google APIs.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  assertOutbound,
  buildListPostsUrl,
  buildRefreshTokenRequest,
  isGbpSyncEnabled,
  normalizeAccountId,
  parseLocalPostsPage,
  readAccessToken,
  readGbpSyncEnv,
  type FetchCall,
  type FetchImpl,
  type FetchResult,
  type GbpSyncEnv,
} from '../lib/gbpGallery/google'
import {
  handleGbpGalleryCron,
  handleManualGbpGallerySync,
  isCronAuthorized,
  isManualSyncAuthorized,
} from '../lib/gbpGallery/cron'
import {
  classifyPost,
  dedupeRemotePosts,
  firebaseDownloadUrl,
  firestorePayload,
  galleryAlt,
  homepageUsesSyncedGallery,
  landingUsesSyncedGallery,
  isPubliclyVisible,
  isStoredGalleryImageUrl,
  nextStoredPost,
  parseStoredPost,
  planSync,
  selectPublicPhotos,
  type RemoteLocalPost,
  type StoredGalleryPost,
  type StoredImage,
} from '../lib/gbpGallery/model'
import { syncGbpGallery, type GalleryStore } from '../lib/gbpGallery/sync'
import {
  FALLBACK_GALLERY_ALT,
  galleryImageGalleryJsonLd,
  galleryMetadata,
  NEUTRAL_GALLERY_TITLE,
} from '../lib/gbpGallery/metadata'

globalThis.fetch = async () => {
  throw new Error('Gallery tests must not call the network')
}

function fail(message: string): never {
  console.error(`FAIL: ${message}`)
  process.exit(1)
}

function assert(condition: unknown, message: string) {
  if (!condition) fail(message)
}

const root = process.cwd()
const TOKEN = 'mock-access-token-0123456789'
const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xd9, 0, 0, 0, 0, 0, 0, 0, 0])
const IMAGE_TOKEN = '11111111-1111-4111-8111-111111111111'
const ENV: GbpSyncEnv = {
  clientId: 'website-client.apps.googleusercontent.com',
  clientSecret: 'website-client-secret',
  refreshToken: 'website-refresh-token',
  accountId: '100',
  locationId: '200',
}

function resourceName(id: string) {
  return `accounts/100/locations/200/localPosts/${id}`
}

function remotePost(id: string, overrides: Partial<RemoteLocalPost> = {}): RemoteLocalPost {
  const name = resourceName(id)
  return {
    resourceName: name,
    createTime: '2026-11-01T09:00:00.000Z',
    updateTime: '2026-11-01T09:00:00.000Z',
    summary: '',
    topicType: 'STANDARD',
    state: 'LIVE',
    photo: {
      mediaResourceName: `${name}/media/1`,
      googleUrl: `https://lh3.googleusercontent.com/bouquet-${id}`,
    },
    ...overrides,
  }
}

function storedImage(id: string): StoredImage {
  const storagePath = `gbp-gallery/${id}.jpg`
  return {
    imageUrl: firebaseDownloadUrl('luroni-cvijece.appspot.com', storagePath, IMAGE_TOKEN),
    storagePath,
    contentType: 'image/jpeg',
    token: IMAGE_TOKEN,
  }
}

function storedFrom(post: RemoteLocalPost, override: 'show' | 'hide' | null = null): StoredGalleryPost {
  const saved = nextStoredPost({
    remote: post,
    previous: null,
    nowIso: '2026-11-02T00:00:00.000Z',
    image: post.photo ? storedImage(post.resourceName.split('/').pop() ?? 'x') : null,
    imageFailed: false,
  })
  saved.visibilityOverride = override
  return saved
}

function apiPost(post: RemoteLocalPost) {
  return {
    name: post.resourceName,
    createTime: post.createTime,
    updateTime: post.updateTime,
    summary: post.summary,
    topicType: post.topicType,
    state: post.state,
    media: post.photo
      ? [{ name: post.photo.mediaResourceName, mediaFormat: 'PHOTO', googleUrl: post.photo.googleUrl }]
      : [{ mediaFormat: 'VIDEO', googleUrl: 'https://lh3.googleusercontent.com/video' }],
  }
}

function memoryStore(initial: StoredGalleryPost[] = []) {
  const posts = new Map(initial.map((post) => [post.resourceName, structuredClone(post)]))
  const uploads: string[] = []
  let saves = 0
  const store: GalleryStore = {
    async listPosts() {
      return [...posts.values()].map((post) => structuredClone(post))
    },
    async savePost(post) {
      saves += 1
      posts.set(post.resourceName, structuredClone(post))
    },
    async uploadImage(input) {
      uploads.push(input.path)
      return firebaseDownloadUrl('luroni-cvijece.appspot.com', input.path, input.token)
    },
  }
  return { posts, uploads, store, saves: () => saves }
}

function mockGoogle(options: {
  posts?: RemoteLocalPost[]
  page2?: RemoteLocalPost[]
  failSecondPage?: boolean
  listStatus?: number
  tokenStatus?: number
  imageStatus?: number
  imageLocation?: string
  imageBytes?: Uint8Array
  imageType?: string
}) {
  const calls: FetchCall[] = []
  let listCalls = 0
  const fetchImpl: FetchImpl = async (call): Promise<FetchResult> => {
    calls.push(call)
    const url = new URL(call.url)
    if (url.hostname === 'oauth2.googleapis.com') {
      return {
        status: options.tokenStatus ?? 200,
        text: JSON.stringify({ access_token: TOKEN, refresh_token: 'should-not-leak' }),
      }
    }
    if (url.hostname === 'mybusiness.googleapis.com') {
      listCalls += 1
      if (options.failSecondPage && listCalls > 1) return { status: 500, text: '{"error":{"message":"nope"}}' }
      if ((options.listStatus ?? 200) !== 200) return { status: options.listStatus ?? 500, text: '{"error":{}}' }
      const posts = url.searchParams.get('pageToken') ? options.page2 ?? [] : options.posts ?? []
      const body: { localPosts: unknown[]; nextPageToken?: string } = { localPosts: posts.map(apiPost) }
      if (!url.searchParams.get('pageToken') && (options.page2 || options.failSecondPage)) body.nextPageToken = 'page-2'
      return { status: 200, text: JSON.stringify(body) }
    }
    if (options.imageLocation && !url.searchParams.has('followed')) {
      return { status: 302, headers: { location: options.imageLocation } }
    }
    if ((options.imageStatus ?? 200) !== 200) return { status: options.imageStatus ?? 404, headers: {} }
    return {
      status: 200,
      bytes: options.imageBytes ?? JPEG,
      headers: { 'content-type': options.imageType ?? 'image/jpeg' },
    }
  }
  return { calls, fetchImpl }
}

async function runSync(
  fetchImpl: FetchImpl,
  store: GalleryStore,
) {
  return syncGbpGallery({
    env: ENV,
    fetchImpl,
    store,
    now: () => new Date('2026-11-10T04:15:00.000Z'),
  })
}

async function main() {
const plain = remotePost('plain')
const plainClass = classifyPost(plain)
assert(plainClass.suitable, 'A live photo with no caption is suitable')
assert(
  plainClass.reasons.includes('photo_without_keyword_requirement'),
  'Suitability does not require a bouquet keyword',
)
assert(!classifyPost(remotePost('words', { photo: null, summary: 'Prekrasan buket ruža' })).suitable, 'Bouquet keywords without a photo are not enough')
assert(
  !classifyPost(remotePost('hours', { summary: 'Radno vrijeme: pon-pet 9-17' })).suitable,
  'Hours copy is not a bouquet photo',
)
assert(
  classifyPost(remotePost('rose', { summary: 'Novi buket ruža za dostavu' })).suitable,
  'A live bouquet photo with a caption is suitable',
)
assert(!classifyPost(remotePost('alert', { topicType: 'ALERT', summary: 'Buket' })).suitable, 'Alert posts are not gallery photos')
assert(!classifyPost(remotePost('rejected', { state: 'REJECTED' })).suitable, 'Rejected posts are not gallery photos')
assert(
  !classifyPost(remotePost('evil', { photo: { mediaResourceName: null, googleUrl: 'https://evil.example/a.jpg' } })).suitable,
  'A non-Google image host is not suitable',
)
assert(
  !classifyPost(remotePost('mixed', { summary: 'Buket ruža. Danas smo zatvoreno.' })).suitable,
  'Mixed closure and bouquet copy waits for a manual override',
)

const hidden = storedFrom(remotePost('shown', { summary: 'Buket' }), 'hide')
assert(!isPubliclyVisible(hidden), 'Manual hide overrides a suitable photo')
const forced = storedFrom(remotePost('forced', { summary: 'Radno vrijeme 9-17' }), 'show')
assert(!forced.suitable && isPubliclyVisible(forced), 'Manual show overrides the automatic filter')
const removed = storedFrom(remotePost('removed', { summary: 'Buket' }), 'show')
removed.deletedAt = '2026-11-03T00:00:00.000Z'
assert(!isPubliclyVisible(removed), 'A deleted post stays hidden even with show override')
forced.imageUrl = 'https://evil.example/a.jpg'
assert(!isPubliclyVisible(forced), 'Only Firebase gallery URLs can be displayed')
assert(!isStoredGalleryImageUrl('javascript:alert(1)'), 'Script URLs are not gallery images')

const older = storedFrom(remotePost('older', { createTime: '2026-11-01T00:00:00.000Z', summary: 'Buket' }))
const newer = storedFrom(remotePost('newer', { createTime: '2026-11-08T00:00:00.000Z', summary: 'Buket' }))
const middle = storedFrom(remotePost('middle', { createTime: '2026-11-04T00:00:00.000Z', summary: 'Buket' }))
const selected = selectPublicPhotos([older, hidden, newer, middle], 2)
assert(selected.map((photo) => photo.id).join() === 'newer,middle', 'Public photos are the newest visible posts')
assert(homepageUsesSyncedGallery(5) === false, 'Five synced photos keep the static homepage gallery')
assert(homepageUsesSyncedGallery(6) === true, 'Six synced photos replace the static homepage gallery')
assert(landingUsesSyncedGallery(3) === false, 'Fewer than four synced photos leave a landing page without the strip')
assert(landingUsesSyncedGallery(4) === true, 'Four synced photos can fill a landing strip')
assert(galleryAlt('Radno vrijeme 9-17') === 'Nedavno izrađen buket cvjećarnice Luroni', 'Operational copy is not used as alt text')
assert(galleryAlt('Buket ruža') === 'Buket ruža', 'A bouquet caption can be the alt text')

const insufficient = ['', 'Buket', 'Prekrasno cvijeće', 'Pogledajte naš novi buket'].map(galleryMetadata)
assert(insufficient.every((meta) => meta.title === NEUTRAL_GALLERY_TITLE), 'A thin caption keeps the neutral title')
assert(insufficient.every((meta) => meta.alt === FALLBACK_GALLERY_ALT), 'A thin caption keeps the fallback alt')
assert(insufficient.every((meta) => meta.description === null), 'A thin caption does not repeat a generic description')
assert(insufficient.every((meta) => meta.occasion === null), 'A thin caption does not invent an occasion')

const roseMeta = galleryMetadata('Buket ruža')
assert(roseMeta.title === 'Buket ruža' && roseMeta.alt === 'Buket ruža', 'A rose caption becomes the title and alt')
assert(roseMeta.description === null && roseMeta.occasion === null, 'A short rose caption does not add a description or occasion')
assert(!/crven|bijel|roza|ružič|rijek|krk|opatij|€|\beur\b|\bkn\b/i.test(`${roseMeta.title} ${roseMeta.alt}`), 'A rose caption does not gain a color, place, or price')

const birthdayMeta = galleryMetadata('Buket za rođendan')
assert(birthdayMeta.title === 'Buket za rođendan', 'A birthday caption stays a birthday title')
assert(birthdayMeta.occasion === 'rođendan', 'A birthday caption records the occasion')
assert(!/ruž|tulipan|božur|ljiljan|rijek|krk|€/i.test(birthdayMeta.title), 'A birthday caption does not gain a flower, place, or price')
assert(birthdayMeta.description === null, 'A short birthday caption does not add a description')

const detailedMeta = galleryMetadata('Prekrasan buket ruža za rođendan. Složili smo ga od svježih crvenih ruža.')
assert(/ruž/i.test(detailedMeta.title) && /rođendan/i.test(detailedMeta.title), 'A detailed caption keeps the supported flower and occasion')
assert(!/tulipan|božur|rijek|krk|€/i.test(`${detailedMeta.title} ${detailedMeta.description ?? ''}`), 'A detailed caption does not gain another flower, place, or price')
assert(detailedMeta.description?.toLocaleLowerCase('hr-HR').includes('crven'), 'A detailed caption keeps the color the florist wrote')
assert(detailedMeta.occasion === 'rođendan', 'A detailed caption records the supported occasion')

const pricedMeta = galleryMetadata('Buket ruža. Cijena 25€.')
assert(!/€|25|eur/i.test(`${pricedMeta.title} ${pricedMeta.alt} ${pricedMeta.description ?? ''}`), 'Prices are left out of gallery text')

const mixedMeta = galleryMetadata('Tulipani i ruže za Valentinovo')
assert(/tulipan/i.test(mixedMeta.title) && /ruž/i.test(mixedMeta.title) && /valentin/i.test(mixedMeta.title), 'A mixed caption keeps both flowers and the occasion')
assert(!/božur|ljiljan|rijek|krk|€/i.test(mixedMeta.title), 'A mixed caption does not gain another flower, place, or price')
assert(mixedMeta.occasion === 'Valentinovo', 'Valentinovo is recorded only from the caption')

const longMeta = galleryMetadata('Danas vam pokazujemo jedan buket koji smo složili od svježih tulipana za poseban rođendan, uz puno pažnje i sezonskog zelenila iz našeg izloga, jer želimo da fotografija ostane vjeran zapis ovog jutarnjeg rada u cvjećarnici.')
assert(longMeta.title === 'Buket tulipana za rođendan', 'A long caption becomes a short supported title')
assert(longMeta.description !== null && /zelenil/i.test(longMeta.description), 'A long caption keeps the extra florist detail as the description')
assert(!/€|rijek|krk/i.test(`${longMeta.title} ${longMeta.description}`), 'A long caption does not gain a price or place')

const cityMeta = galleryMetadata('Buket ruža za dostavu u Rijeci i na Krku')
assert(/ruž/i.test(cityMeta.title), 'A delivery caption keeps the flower the florist named')
assert(!/rijek|rijeci|riječ|krk|opatij|kastav|viškov|lovran|malinsk/i.test(`${cityMeta.title} ${cityMeta.alt} ${cityMeta.description ?? ''}`), 'Gallery text does not attach a delivery place to the photo')

const proteaMeta = galleryMetadata('Buket protea')
assert(proteaMeta.title.toLocaleLowerCase('hr-HR').includes('protea'), 'An unknown flower stays in the title when the florist named it')
assert(!/ruž|tulipan|božur/i.test(proteaMeta.title), 'An unknown flower does not get replaced with another flower')
assert(proteaMeta.description === null, 'A short specific caption does not repeat itself as a description')

function captionWordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length
}

function captionSentences(value: string): number {
  return value.split(/(?<=[.!?])\s+/).filter(Boolean).length
}

const harmonijaSource = 'Cvjetna harmonija boja i elegancije 🌸💐 Ponekad je dovoljan samo jedan buket da nekome uljepšate cijeli dan. ❤️ Ovaj raskošni buket spaj'
const harmonijaMeta = galleryMetadata(harmonijaSource)
assert(harmonijaMeta.title === NEUTRAL_GALLERY_TITLE, 'A floral slogan does not become the bouquet title')
assert(!/cvjetna harmonija|ponekad|uljepšate|elegancije/i.test(`${harmonijaMeta.title} ${harmonijaMeta.alt} ${harmonijaMeta.description ?? ''}`), 'The harmonija slogan and its call to action are left out')
assert(captionWordCount(harmonijaMeta.title) <= 8, 'The harmonija title stays within eight words')
assert(!/ruž|orhide|tulipan|ljiljan|karanfil|kala\b|eukalipt|antur/i.test(`${harmonijaMeta.title} ${harmonijaMeta.description ?? ''} ${harmonijaMeta.alt}`), 'The harmonija caption does not invent flowers')
assert(harmonijaMeta.description === null, 'A slogan without a factual bouquet sentence has no description')

const raskosSource = 'Raskoš boja, elegancije i emocija 💐❤️ Neki buketi jednostavno privlače pogled, a ovaj je jedan od njih! 🌸 Spoj nježnih bijelih ruža, in'
const raskosMeta = galleryMetadata(raskosSource)
assert(raskosMeta.title === 'Buket ruža', 'The raskoš slogan becomes the rose the florist named')
assert(captionWordCount(raskosMeta.title) >= 2 && captionWordCount(raskosMeta.title) <= 8, 'The raskoš title stays concise')
assert(!/raskoš boja|elegancije i emocija|privlače pogled|jedan od njih/i.test(`${raskosMeta.title} ${raskosMeta.description ?? ''} ${raskosMeta.alt}`), 'The raskoš slogan is not appended to the caption')
assert(raskosMeta.description !== null && /bijel/i.test(raskosMeta.description) && /ruž/i.test(raskosMeta.description), 'The raskoš description keeps the white roses the florist wrote')
assert(!raskosMeta.description?.toLocaleLowerCase('hr-HR').includes(raskosMeta.title.toLocaleLowerCase('hr-HR')), 'The raskoš description does not repeat its title')
assert((raskosMeta.description?.length ?? 0) <= 150 && captionSentences(raskosMeta.description ?? '') <= 2, 'The raskoš description stays within two short sentences')
assert(!/orhide|tulipan|ljiljan|karanfil|antur/i.test(`${raskosMeta.title} ${raskosMeta.description ?? ''}`), 'The raskoš caption does not invent another flower')

const plavaSource = 'Premium buket „Plava elegancija” 💙🤍 Za trenutke kada običan buket jednostavno nije dovoljan. Raskošna kombinacija bijelih orhideja, ele'
const plavaMeta = galleryMetadata(plavaSource)
assert(plavaMeta.title === 'Premium buket Plava elegancija', 'A named premium bouquet keeps its name')
assert(captionWordCount(plavaMeta.title) >= 3 && captionWordCount(plavaMeta.title) <= 8, 'The Plava elegancija title stays within eight words')
assert(!/za trenutke|nije dovoljan|običan buket/i.test(plavaMeta.title), 'The promotional sentence is not appended to the Plava elegancija title')
assert(plavaMeta.description !== null && /orhide/i.test(plavaMeta.description) && /bijel/i.test(plavaMeta.description), 'The Plava elegancija description keeps the white orchids the florist wrote')
assert(!/plava elegancija|premium buket|za trenutke|nije dovoljan/i.test(plavaMeta.description ?? ''), 'The Plava elegancija description does not repeat the title or the slogan')
assert((plavaMeta.description?.length ?? 0) <= 150 && captionSentences(plavaMeta.description ?? '') <= 2, 'The Plava elegancija description stays within two short sentences')
assert(!/ruž|tulipan|ljiljan|karanfil/i.test(`${plavaMeta.title} ${plavaMeta.description ?? ''} ${plavaMeta.alt}`), 'The Plava elegancija caption does not invent another flower')
assert(plavaMeta.alt.includes('Premium buket Plava elegancija') && /orhide/i.test(plavaMeta.alt), 'Alt text keeps the bouquet name and the flowers the florist named')

const captionPhotos = [
  selectPublicPhotos([storedFrom(remotePost('harmonija', { summary: harmonijaSource }))], 1)[0],
  selectPublicPhotos([storedFrom(remotePost('raskos', { summary: raskosSource }))], 1)[0],
  selectPublicPhotos([storedFrom(remotePost('plava', { summary: plavaSource }))], 1)[0],
]
assert(captionPhotos.every((photo) => photo), 'The three screenshot captions become public photos')
const captionJson = galleryImageGalleryJsonLd(captionPhotos.flatMap((photo) => photo ? [photo] : []))
assert(captionJson?.image.length === 3, 'ImageGallery lists the three cleaned captions')
assert(captionJson?.image[0]?.name === NEUTRAL_GALLERY_TITLE && !('description' in (captionJson.image[0] ?? {})), 'ImageGallery does not publish the harmonija slogan')
assert(captionJson?.image[1]?.name === 'Buket ruža' && captionJson.image[1]?.description === raskosMeta.description, 'ImageGallery uses the cleaned raskoš title and description')
assert(captionJson?.image[2]?.name === 'Premium buket Plava elegancija' && captionJson.image[2]?.description === plavaMeta.description, 'ImageGallery uses the cleaned Plava elegancija title and description')
assert(!/cvjetna harmonija|raskoš boja|za trenutke kada|ponekad je dovoljan/i.test(JSON.stringify(captionJson)), 'ImageGallery does not repeat the promotional sentences')

const overridden = storedFrom(remotePost('meta', { summary: 'Buket ruža' }))
overridden.metadataOverride = { title: 'Ručno ispravljen naslov', alt: 'Ručni alt', description: 'Ručni opis', occasion: 'rođendan' }
const overriddenPhoto = selectPublicPhotos([overridden], 1)[0]
assert(overriddenPhoto?.title === 'Ručno ispravljen naslov' && overriddenPhoto.alt === 'Ručni alt', 'A manual title and alt replace the generated text')
assert(overriddenPhoto?.description === 'Ručni opis' && overriddenPhoto.occasion === 'rođendan', 'A manual description and occasion replace the generated text')
const partial = storedFrom(remotePost('partial', { summary: 'Buket ruža' }))
partial.metadataOverride = { title: 'Samo naslov', alt: null, description: null, occasion: null }
const partialPhoto = selectPublicPhotos([partial], 1)[0]
assert(partialPhoto?.title === 'Samo naslov' && partialPhoto.alt === 'Buket ruža' && partialPhoto.description === null, 'An empty override field still follows the summary')

const summaryPlan = planSync(
  [remotePost('edit', { summary: 'Novi buket ruža', updateTime: '2026-11-05T00:00:00.000Z' })],
  [storedFrom(remotePost('edit', { summary: 'Stari buket' }))],
)
assert(summaryPlan.upserts[0]?.downloadImage === false, 'A summary change does not require a new image')
assert(summaryPlan.upserts[0]?.skipWrite === false, 'A summary change is still written')
const mediaPlan = planSync(
  [remotePost('edit', {
    photo: {
      mediaResourceName: `${resourceName('edit')}/media/2`,
      googleUrl: 'https://lh3.googleusercontent.com/bouquet-edit-2',
    },
  })],
  [storedFrom(remotePost('edit', { summary: 'Stari buket' }))],
)
assert(mediaPlan.upserts[0]?.downloadImage === true, 'A new Google media URL is downloaded')

const duplicate = dedupeRemotePosts([
  remotePost('dup', { updateTime: '2026-11-01T00:00:00.000Z', summary: 'stari' }),
  remotePost('dup', { updateTime: '2026-11-02T00:00:00.000Z', summary: 'novi' }),
])
assert(duplicate.length === 1 && duplicate[0]?.summary === 'novi', 'The same post id keeps the newer update timestamp')

const payload = firestorePayload(hidden)
assert(!('visibilityOverride' in payload), 'Sync writes do not include the manual visibility override')
assert(!('metadataOverride' in payload), 'Sync writes do not include the manual metadata override')
const roundTrip = parseStoredPost({
  ...payload,
  visibilityOverride: 'hide',
  metadataOverride: { title: 'Ručni naslov', alt: '', description: 12, occasion: null },
})
assert(roundTrip?.visibilityOverride === 'hide' && roundTrip.imageUrl === hidden.imageUrl, 'Stored metadata keeps a manual hide flag')
assert(roundTrip?.metadataOverride?.title === 'Ručni naslov', 'Stored metadata keeps a manual title')
assert(roundTrip?.metadataOverride?.alt === null && roundTrip.metadataOverride.description === null, 'Blank or invalid override fields are ignored')
assert(parseStoredPost(payload)?.metadataOverride === null, 'Older gallery documents stay readable without an override')

assert(normalizeAccountId('accounts/100') === '100', 'Account ids may arrive with the accounts/ prefix')
assert(buildListPostsUrl('100', 'locations/200', 'next').includes('/v4/accounts/100/locations/200/localPosts'), 'List URL is the local posts read endpoint')
let rejectedWrite = false
try {
  assertOutbound({ url: 'https://mybusiness.googleapis.com/v4/accounts/100/locations/200/localPosts', method: 'POST' })
} catch {
  rejectedWrite = true
}
assert(rejectedWrite, 'Business Profile writes are refused')
let rejectedDelete = false
try {
  assertOutbound({ url: 'https://mybusiness.googleapis.com/v4/accounts/100/locations/200/media', method: 'GET' })
} catch {
  rejectedDelete = true
}
assert(rejectedDelete, 'The client can only list local posts')

const tokenRequest = buildRefreshTokenRequest(ENV)
assert(tokenRequest.method === 'POST' && tokenRequest.url === 'https://oauth2.googleapis.com/token', 'OAuth uses only the token endpoint')
assert(tokenRequest.body?.includes('grant_type=refresh_token') === true, 'OAuth refresh uses the refresh_token grant')
assert(readAccessToken(JSON.stringify({ access_token: TOKEN, refresh_token: ENV.refreshToken })) === TOKEN, 'Token parsing returns only the access token')

assert(isGbpSyncEnabled({}) === false, 'Sync is disabled when the flag is absent')
assert(isGbpSyncEnabled({ GBP_SYNC_ENABLED: 'TRUE' }) === false, 'Sync stays disabled unless the flag is exactly true')
assert(isGbpSyncEnabled({ GBP_SYNC_ENABLED: 'true' }) === true, 'Sync can be enabled explicitly')
const incomplete = readGbpSyncEnv({ GBP_OAUTH_CLIENT_SECRET: 'super-secret-value' })
assert(!incomplete.ok, 'Incomplete GBP configuration is rejected')
if (!incomplete.ok) {
  assert(!incomplete.missing.join(' ').includes('super-secret-value'), 'Missing-config errors do not echo secret values')
}

assert(isCronAuthorized({ authorization: null, cronSecret: undefined, nodeEnv: 'production' }) === false, 'Production cron without a secret is refused')
assert(isCronAuthorized({ authorization: 'Bearer wrong', cronSecret: 'expected', nodeEnv: 'production' }) === false, 'A wrong cron secret is refused')
assert(isCronAuthorized({ authorization: 'Bearer expected', cronSecret: 'expected', nodeEnv: 'production' }) === true, 'The matching cron secret is accepted')
assert(isCronAuthorized({ authorization: null, cronSecret: undefined, nodeEnv: 'development' }) === true, 'Local development can call the endpoint without a secret')
assert(isManualSyncAuthorized({ authorization: null, cronSecret: undefined }) === false, 'Manual sync without a configured secret is refused')
assert(isManualSyncAuthorized({ authorization: 'Bearer expected', cronSecret: undefined }) === false, 'Manual sync is refused when the secret is missing')
assert(isManualSyncAuthorized({ authorization: 'Bearer expected', cronSecret: '' }) === false, 'Manual sync is refused when the secret is empty')
assert(isManualSyncAuthorized({ authorization: null, cronSecret: 'expected' }) === false, 'Manual sync without a bearer token is refused')
assert(isManualSyncAuthorized({ authorization: 'Bearer wrong', cronSecret: 'expected' }) === false, 'A wrong manual sync secret is refused')
assert(isManualSyncAuthorized({ authorization: 'Bearer expected-extra', cronSecret: 'expected' }) === false, 'A longer bearer token is refused')
assert(isManualSyncAuthorized({ authorization: 'Bearer expected', cronSecret: 'expected' }) === true, 'The matching cron secret authorizes a manual sync')

let ran = false
const disabled = await handleGbpGalleryCron({
  authorized: true,
  enabled: false,
  run: async () => {
    ran = true
    return { ok: true }
  },
})
assert(disabled.status === 200 && disabled.body.skipped === true && !ran, 'Disabled sync does not call Google')
const unauthorized = await handleGbpGalleryCron({
  authorized: false,
  enabled: true,
  run: async () => {
    ran = true
    return { ok: true }
  },
})
assert(unauthorized.status === 401 && !ran, 'An unauthorized cron does not sync')
let enabledRan = false
const enabled = await handleGbpGalleryCron({
  authorized: true,
  enabled: true,
  run: async () => {
    enabledRan = true
    return { ok: true, fetched: 3 }
  },
})
assert(enabled.status === 200 && enabled.body.fetched === 3 && enabledRan && enabled.body.skipped !== true, 'An enabled scheduled sync still runs')
const crashed = await handleGbpGalleryCron({
  authorized: true,
  enabled: true,
  run: async () => {
    throw new Error('refresh token leaked')
  },
})
assert(
  crashed.status === 500 && crashed.body.preserved === true && crashed.body.error === 'Sync failed' && !JSON.stringify(crashed.body).includes('refresh'),
  'A failed scheduled sync does not report credentials',
)

let manualRan = false
const manualDenied = await handleManualGbpGallerySync({
  authorized: false,
  run: async () => {
    manualRan = true
    return { ok: true }
  },
})
assert(manualDenied.status === 401 && manualDenied.body.error === 'Unauthorized' && !manualRan, 'An unauthorized manual sync does not import')
const manual = await handleManualGbpGallerySync({
  authorized: true,
  run: async () => ({ ok: true, fetched: 2, imagesStored: 2 }),
})
assert(
  manual.status === 200 && manual.body.ok === true && manual.body.skipped !== true && manual.body.imagesStored === 2,
  'An authorized manual sync runs while the daily flag is unset',
)

let releaseManual: (() => void) | undefined
const manualHold = new Promise<{ ok: true; imagesStored: number }>((resolve) => {
  releaseManual = () => resolve({ ok: true, imagesStored: 1 })
})
const inFlight = handleManualGbpGallerySync({ authorized: true, run: () => manualHold })
let overlapRan = false
const overlap = await handleManualGbpGallerySync({
  authorized: true,
  run: async () => {
    overlapRan = true
    return { ok: true }
  },
})
assert(overlap.status === 409 && overlap.body.preserved === true && !overlapRan, 'A second manual sync does not start while one is running')
const deniedDuringSync = await handleManualGbpGallerySync({
  authorized: false,
  run: async () => ({ ok: true, imagesStored: 9 }),
})
assert(deniedDuringSync.status === 401 && deniedDuringSync.body.error === 'Unauthorized', 'An unauthorized request during a sync is still refused')
ran = false
const skippedDuringManual = await handleGbpGalleryCron({
  authorized: true,
  enabled: false,
  run: async () => {
    ran = true
    return { ok: true }
  },
})
assert(
  skippedDuringManual.status === 200 && skippedDuringManual.body.skipped === true && skippedDuringManual.body.reason === 'GBP_SYNC_ENABLED is not true' && !ran,
  'Authorized GET still skips while the flag is unset',
)
if (!releaseManual) fail('Manual sync lock was not acquired')
releaseManual()
const finishedManual = await inFlight
assert(finishedManual.status === 200 && finishedManual.body.imagesStored === 1, 'The in-flight manual sync still finishes')
const manualAfter = await handleManualGbpGallerySync({
  authorized: true,
  run: async () => ({ ok: true, fetched: 1 }),
})
assert(manualAfter.status === 200 && manualAfter.body.fetched === 1, 'A later manual sync can run after the first finishes')

const fresh = memoryStore()
const freshFetch = mockGoogle({ posts: [remotePost('one', { summary: 'Buket ruža' }), remotePost('two')] })
const freshSummary = await runSync(freshFetch.fetchImpl, fresh.store)
assert(freshSummary.ok && freshSummary.imagesStored === 2, 'New photos are stored from mocked posts')
assert(fresh.uploads.length === 2, 'Each new photo is uploaded once')
assert(
  freshFetch.calls.filter((call) => call.method === 'POST').every((call) => call.url === 'https://oauth2.googleapis.com/token'),
  'The only POST is the OAuth token request',
)
assert(
  freshFetch.calls.filter((call) => call.url.includes('mybusiness.googleapis.com')).every((call) => call.method === 'GET'),
  'Business Profile requests are GET list calls',
)
assert(
  freshFetch.calls.filter((call) => call.url.includes('googleusercontent.com')).every((call) => !call.headers?.authorization),
  'Image downloads do not send the OAuth bearer token',
)
assert(!JSON.stringify(freshSummary).includes(ENV.refreshToken), 'Sync results do not include the refresh token')
assert(!JSON.stringify(freshSummary).includes(TOKEN), 'Sync results do not include the access token')

const sameRemote = remotePost('same', { summary: 'Buket ruža' })
const sameStore = memoryStore([storedFrom(sameRemote)])
const sameFetch = mockGoogle({ posts: [sameRemote] })
await runSync(sameFetch.fetchImpl, sameStore.store)
assert(sameStore.saves() === 0 && sameStore.uploads.length === 0, 'An unchanged post is not downloaded or rewritten')

const editedRemote = remotePost('edit', { summary: 'Novi buket ruža', updateTime: '2026-11-05T00:00:00.000Z' })
const editedPrevious = storedFrom(remotePost('edit', { summary: 'Stari buket' }), 'hide')
editedPrevious.metadataOverride = { title: 'Ručni naslov', alt: 'Ručni alt', description: null, occasion: null }
const editedStore = memoryStore([editedPrevious])
const editedFetch = mockGoogle({ posts: [editedRemote] })
await runSync(editedFetch.fetchImpl, editedStore.store)
const edited = editedStore.posts.get(editedRemote.resourceName)
assert(edited?.summary === 'Novi buket ruža', 'An edited post updates its caption')
assert(edited?.visibilityOverride === 'hide', 'Editing a post keeps the manual visibility override')
assert(edited?.metadataOverride?.title === 'Ručni naslov' && edited.metadataOverride.alt === 'Ručni alt', 'Editing a post keeps the manual metadata override')
assert(edited?.imageUrl === editedPrevious.imageUrl && edited.imageSyncError === null, 'A summary edit keeps the stored image')
assert(editedStore.uploads.length === 0, 'A summary-only edit does not upload the image again')
assert(editedFetch.calls.every((call) => !call.url.includes('googleusercontent.com')), 'A summary-only edit does not download the image')

const preservedPrevious = storedFrom(remotePost('keep', { summary: 'Stari buket' }))
const preservedStore = memoryStore([preservedPrevious])
const preservedRemote = remotePost('keep', {
  summary: 'Novi buket',
  updateTime: '2026-11-06T00:00:00.000Z',
  photo: {
    mediaResourceName: `${resourceName('keep')}/media/2`,
    googleUrl: 'https://lh3.googleusercontent.com/bouquet-keep-new',
  },
})
const preservedFetch = mockGoogle({
  posts: [preservedRemote],
  imageStatus: 404,
})
const preservedSummary = await runSync(preservedFetch.fetchImpl, preservedStore.store)
const preserved = preservedStore.posts.get(resourceName('keep'))
assert(preserved?.imageUrl === preservedPrevious.imageUrl, 'A failed image download keeps the stored photo')
assert(preserved?.summary === 'Novi buket', 'Caption updates still apply when the image is preserved')
assert(preserved?.imageSyncError === 'preserved_previous_image', 'Image failure is recorded without discarding the photo')
assert(preservedSummary.imagesPreserved === 1, 'The sync reports that an existing image was preserved')

const retryPrevious = preservedStore.posts.get(resourceName('keep'))
if (!retryPrevious) fail('Preserved post exists')
const retryPlan = planSync([preservedRemote], [retryPrevious])
assert(retryPlan.upserts[0]?.downloadImage === true, 'A preserved image is retried on the next sync')

const listed = remotePost('listed', { summary: 'Buket' })
const gone = storedFrom(remotePost('gone', { summary: 'Stari buket' }))
const deletionStore = memoryStore([storedFrom(listed), gone])
await runSync(mockGoogle({ posts: [listed] }).fetchImpl, deletionStore.store)
const deleted = deletionStore.posts.get(resourceName('gone'))
assert(deleted?.deletedAt === '2026-11-10T04:15:00.000Z', 'A post missing from a complete list is marked deleted')
assert(deleted?.imageUrl === gone.imageUrl, 'Deleting a post keeps its stored image')
assert(!isPubliclyVisible(deleted!), 'A deleted post leaves the public gallery')

const returned = storedFrom(remotePost('back', { summary: 'Buket' }))
returned.deletedAt = '2026-11-01T00:00:00.000Z'
const returnStore = memoryStore([returned])
await runSync(mockGoogle({ posts: [remotePost('back', { summary: 'Buket' })] }).fetchImpl, returnStore.store)
assert(returnStore.posts.get(resourceName('back'))?.deletedAt === null, 'A returning post is visible again')
assert(returnStore.uploads.length === 0, 'A returning post reuses its stored image')

const emptyStore = memoryStore([storedFrom(remotePost('stay', { summary: 'Buket' }))])
const emptySummary = await runSync(mockGoogle({ posts: [] }).fetchImpl, emptyStore.store)
assert(emptySummary.preserved === true && emptyStore.saves() === 0, 'An empty Google response does not hide existing photos')

const partialStore = memoryStore([storedFrom(remotePost('safe', { summary: 'Buket' }))])
const partialSummary = await runSync(
  mockGoogle({ posts: [remotePost('new', { summary: 'Buket' })], failSecondPage: true }).fetchImpl,
  partialStore.store,
)
assert(partialSummary.ok === false && partialSummary.preserved === true, 'A partial page list preserves stored photos')
assert(partialStore.saves() === 0 && partialStore.uploads.length === 0, 'No writes happen after an incomplete Google read')

const oauthStore = memoryStore([storedFrom(remotePost('oauth', { summary: 'Buket' }))])
const oauthSummary = await runSync(mockGoogle({ tokenStatus: 401, posts: [] }).fetchImpl, oauthStore.store)
assert(oauthSummary.error === 'OAuth token refresh failed' && oauthStore.saves() === 0, 'OAuth failure makes no gallery changes')

const listStore = memoryStore([storedFrom(remotePost('list', { summary: 'Buket' }))])
const listSummary = await runSync(mockGoogle({ listStatus: 500, posts: [] }).fetchImpl, listStore.store)
assert(listSummary.error === 'Google post list failed' && listStore.saves() === 0, 'A failed post list makes no gallery changes')

const htmlStore = memoryStore()
await runSync(
  mockGoogle({
    posts: [remotePost('html', { summary: 'Buket' })],
    imageBytes: Uint8Array.from(Array(12).fill(0x3c)),
    imageType: 'text/html',
  }).fetchImpl,
  htmlStore.store,
)
assert(htmlStore.uploads.length === 0, 'Non-image bytes are not stored')
assert(htmlStore.posts.get(resourceName('html'))?.imageUrl === null, 'A non-image response does not become a gallery photo')

const redirectStore = memoryStore([storedFrom(remotePost('redirect', { summary: 'Buket' }))])
await runSync(
  mockGoogle({
    posts: [remotePost('redirect', {
      summary: 'Buket',
      updateTime: '2026-11-07T00:00:00.000Z',
      photo: {
        mediaResourceName: `${resourceName('redirect')}/media/2`,
        googleUrl: 'https://lh3.googleusercontent.com/bouquet-redirect-new',
      },
    })],
    imageLocation: 'https://evil.example/stolen.jpg',
  }).fetchImpl,
  redirectStore.store,
)
assert(
  redirectStore.posts.get(resourceName('redirect'))?.imageUrl === storedFrom(remotePost('redirect', { summary: 'Buket' })).imageUrl,
  'A redirect away from Google keeps the stored photo',
)

const page2 = remotePost('page2', { summary: 'Buket s druge stranice', createTime: '2026-11-09T00:00:00.000Z' })
const pagedStore = memoryStore()
await runSync(mockGoogle({ posts: [remotePost('page1', { summary: 'Buket' })], page2: [page2] }).fetchImpl, pagedStore.store)
assert(pagedStore.posts.has(resourceName('page2')), 'Later list pages are included')

const dupStore = memoryStore()
const dupFetch = mockGoogle({
  posts: [
    remotePost('dup', { updateTime: '2026-11-01T00:00:00.000Z', summary: 'stari buket' }),
    remotePost('dup', { updateTime: '2026-11-03T00:00:00.000Z', summary: 'novi buket' }),
  ],
})
await runSync(dupFetch.fetchImpl, dupStore.store)
assert(dupStore.posts.size === 1 && dupStore.posts.get(resourceName('dup'))?.summary === 'novi buket', 'Duplicate posts in one response are stored once')
assert(dupStore.uploads.length === 1, 'A duplicate post uploads one image')

let parserRejected = false
try {
  parseLocalPostsPage(JSON.stringify({ localPosts: [{ name: 'not-a-post', createTime: '2026-11-01T00:00:00.000Z', updateTime: '2026-11-01T00:00:00.000Z' }] }))
} catch {
  parserRejected = true
}
assert(parserRejected, 'Unexpected post ids abort the read instead of deleting stored photos')
const video = parseLocalPostsPage(JSON.stringify({
  localPosts: [{
    name: resourceName('video'),
    createTime: '2026-11-01T00:00:00.000Z',
    updateTime: '2026-11-01T00:00:00.000Z',
    media: [{ mediaFormat: 'VIDEO', googleUrl: 'https://lh3.googleusercontent.com/video' }],
    state: 'LIVE',
    topicType: 'STANDARD',
  }],
}))
assert(video.posts[0]?.photo === null, 'Video posts are not treated as gallery photos')

function read(rel: string) {
  return readFileSync(resolve(root, rel), 'utf8')
}

const sourceFiles = [
  'lib/gbpGallery/public.ts',
  'lib/gbpGallery/metadata.ts',
  'lib/gbpGallery/model.ts',
  'lib/gbpGallery/google.ts',
  'lib/gbpGallery/sync.ts',
  'lib/gbpGallery/cron.ts',
  'lib/gbpGallery/http.ts',
  'lib/gbpGallery/storage.ts',
  'lib/gbpGallery/firestore.ts',
  'lib/gbpGallery/read.ts',
  'app/api/cron/sync-gbp-gallery/route.ts',
  'app/components/BouquetPhotoGrid.tsx',
  'app/components/RecentBouquetsSection.tsx',
]
for (const rel of sourceFiles) {
  const source = read(rel)
  assert(!source.includes('NEXT_PUBLIC_'), `${rel} must not use a public env var`)
  for (const line of source.split('\n')) {
    if (!line.includes('console.')) continue
    assert(!/accessToken|refreshToken|clientSecret|privateKey|FIREBASE_PRIVATE/.test(line), `${rel} logs a credential`)
  }
}

const route = read('app/api/cron/sync-gbp-gallery/route.ts')
assert(route.includes('CRON_SECRET') && route.includes('isGbpSyncEnabled'), 'The cron route requires the secret and the sync flag')
assert(/export async function POST/.test(route), 'Manual gallery sync is a POST on the existing route')
assert(route.includes('isManualSyncAuthorized'), 'Manual POST requires the cron secret in every environment')
assert(route.includes('maxDuration = 60'), 'The sync route allows the first import to finish on the current plan')
const postSource = route.slice(route.indexOf('export async function POST'))
assert(!postSource.includes('isGbpSyncEnabled'), 'Manual POST does not require GBP_SYNC_ENABLED')
assert(!postSource.includes('NODE_ENV'), 'Manual POST has no development auth bypass')
assert(!/export async function (PUT|PATCH|DELETE)/.test(route), 'The sync route has no other write handlers')
const http = read('lib/gbpGallery/http.ts')
assert(http.includes("redirect: 'manual'"), 'Google fetches do not follow redirects automatically')
const storage = read('lib/gbpGallery/storage.ts')
assert(!storage.includes('publicRead') && !storage.includes('makePublic') && !storage.includes('predefinedAcl'), 'Uploads are not world-writable ACLs')
const firestore = read('lib/gbpGallery/firestore.ts')
assert(firestore.includes('merge: true') && firestore.includes('visibilityOverride') && firestore.includes('metadataOverride'), 'Firestore writes merge and leave manual overrides alone')
const homepage = read('app/page.tsx')
assert(homepage.includes('GallerySection') && homepage.includes('loadHomepagePhotos'), 'Homepage keeps the static gallery as the fallback')
const section = read('app/components/RecentBouquetsSection.tsx')
assert(section.includes('Naši nedavno izrađeni buketi'), 'Homepage section title is set')
assert(
  section.includes('Svaki buket je poseban. Pogledajte neke od naših posljednjih cvjetnih kreacija.'),
  'Homepage section subtitle is set',
)
const grid = read('app/components/BouquetPhotoGrid.tsx')
assert(grid.includes('Naruči sličan buket') && grid.includes('href="/#order"'), 'Lightbox links to the existing order section')
assert(!grid.includes('firebase') && !grid.includes('gbpGallery/sync'), 'The lightbox does not import server sync code')
assert(grid.includes('Učitaj još'), 'The gallery reveals another page of photos in the browser')
assert(!grid.includes('fetch('), 'Load more does not request more photos')
assert(grid.includes("'lazy'") && grid.includes("'eager'"), 'Later photos lazy load and the first gallery page loads with its captions')
assert(grid.indexOf('<figcaption') < grid.indexOf('Učitaj još'), 'Captions render with the first photos, before Učitaj još')
assert(grid.includes('line-clamp-2') && grid.includes('min-h-24'), 'Caption blocks stay on two lines so the cards remain balanced')
assert(grid.includes('sizes={sizes}'), 'Gallery photos use responsive sizes')
const galerija = read('app/galerija/page.tsx')
assert(galerija.includes('initialCount={GALLERY_PAGE_INITIAL}'), 'The gallery page starts with the six newest photos')
assert(galerija.includes('pageSize={GALLERY_PAGE_INITIAL}'), 'Učitaj još reveals the next six photos')
assert(!read('app/page.tsx').includes('initialCount'), 'The homepage still shows its photos at once')
assert(!read('app/page.tsx').includes('showCaptions'), 'The homepage does not add gallery captions')
assert(!read('app/dostava-cvijeca-rijeka/page.tsx').includes('showCaptions'), 'Rijeka does not add gallery captions')
assert(!read('app/cvjecarna-krk/page.tsx').includes('showCaptions'), 'Krk does not add gallery captions')
assert(galerija.includes('showCaptions'), 'The gallery page shows bouquet titles')
assert(galerija.includes('galleryJsonLd = photos ? galleryImageGalleryJsonLd(photos) : null'), 'ImageGallery JSON-LD is built only for synced photos')
assert(galerija.includes('galleryJsonLd ? <JsonLd data={galleryJsonLd} /> : null'), 'The static gallery does not render ImageGallery JSON-LD')
for (const page of ['app/page.tsx', 'app/dostava-cvijeca-rijeka/page.tsx', 'app/cvjecarna-krk/page.tsx']) {
  assert(!read(page).includes('galleryImageGalleryJsonLd') && !read(page).includes('ImageGallery'), `${page} does not add gallery structured data`)
}
assert(grid.includes('photo.description') && grid.includes('showCaptions'), 'Visible descriptions are optional caption text')
assert(!grid.includes('Buket cvijeća iz ponude Luroni cvijeće'), 'The gallery grid does not hard-code one description under every photo')
const metadataSource = read('lib/gbpGallery/metadata.ts')
assert(!metadataSource.includes('fetch(') && !/openai|anthropic|generativelanguage/i.test(metadataSource), 'Metadata generation does not call a paid AI API')
assert(!metadataSource.includes('collection('), 'Metadata generation does not create a collection')
const emptyJsonLd = galleryImageGalleryJsonLd([])
assert(emptyJsonLd === null, 'ImageGallery JSON-LD is omitted when there are no synced photos')
const jsonLdPhotos = selectPublicPhotos([
  storedFrom(remotePost('jsonrose', { summary: 'Buket ruža za rođendan. Složili smo ga od svježih crvenih ruža.' })),
  storedFrom(remotePost('jsonblank', { summary: '' })),
], 5)
const jsonLd = galleryImageGalleryJsonLd(jsonLdPhotos)
assert(jsonLd?.['@type'] === 'ImageGallery' && jsonLd['@context'] === 'https://schema.org', 'Synced photos publish one ImageGallery')
assert(jsonLd?.publisher['@id'] === 'https://www.luroni-cvijece.com', 'ImageGallery points at the existing florist id')
assert(Array.isArray(jsonLd?.image) && jsonLd.image.length === 2, 'ImageGallery lists the synced photos')
assert(jsonLd?.image.every((image) => image['@type'] === 'ImageObject' && image.contentUrl.startsWith('https://firebasestorage.googleapis.com/')), 'Image objects use the stored Firebase URLs')
const blankJsonImage = jsonLd?.image.find((image) => image.name === NEUTRAL_GALLERY_TITLE)
assert(blankJsonImage && !('description' in blankJsonImage), 'A generic photo does not repeat a description in JSON-LD')
const jsonLdText = JSON.stringify(jsonLd)
assert(!jsonLdText.includes('€') && !jsonLdText.includes('Offer') && !jsonLdText.includes('PostalAddress') && !jsonLdText.includes('FAQPage'), 'ImageGallery adds no prices, places, or duplicate page schema')
const rijeka = read('app/dostava-cvijeca-rijeka/page.tsx')
assert(
  rijeka.indexOf('<BouquetTypesSection') < rijeka.indexOf('<RecentBouquetsSection') &&
    rijeka.indexOf('<RecentBouquetsSection') < rijeka.indexOf('<OrderingSection'),
  'Rijeka places the gallery between bouquet sizes and ordering',
)
assert(rijeka.includes('loadLandingPhotos'), 'Rijeka reads the synced bouquet photos')
const krk = read('app/cvjecarna-krk/page.tsx')
assert(krk.includes('loadLandingPhotos') && krk.includes('GALLERY_IMAGES_FEATURED'), 'Krk uses synced photos and keeps the static fallback')
assert(krk.includes('href="/galerija"'), 'Krk links to the gallery')
assert(krk.includes('orderHref="/#order"'), 'Krk ordering still opens the existing order section')
for (const claim of [
  'Buket pripremljen za dostavu cvijeća na Krku',
  'Svježi buket za dostavu na otoku Krku',
  'Ručno složeni sezonski buket za dostavu na Krku',
  'Cvjetni aranžman spreman za dostavu na otoku Krku',
  'Buket S pripremljen za dostavu cvijeća na Krku',
  'Svježi buket M za dostavu na otoku Krku',
  'Buket L složen za dostavu cvijeća na Krku',
  'svježi buketi s dostavom na otoku Krku',
]) {
  assert(!krk.includes(claim), `Krk no longer claims this photo was delivered there: ${claim}`)
}
const vercel = read('vercel.json')
assert(vercel.includes('/api/cron/sync-gbp-gallery') && vercel.includes('15 5 * * *'), 'Daily gallery cron is registered')
assert(!vercel.includes('publish-price-list'), 'The disabled price-list cron stays unregistered')
const reader = read('lib/gbpGallery/read.ts')
assert(reader.includes('homepageUsesSyncedGallery'), 'Homepage publication uses the six-photo threshold')
assert(reader.includes('unstable_cache'), 'Gallery reads are cached on the server')
assert(reader.includes('revalidate: GALLERY_READ_REVALIDATE_SECONDS'), 'The gallery cache lasts about one hour')
assert(reader.includes('readVisibleGalleryPhotos(GALLERY_PAGE_LIMIT)'), 'Homepage, gallery, and landing pages share one photo read')
assert(reader.includes('photos.slice(0, limit)'), 'Callers reuse the cached read instead of querying again')
assert(!reader.includes('GBP_SYNC_ENABLED'), 'Display reads do not toggle synchronization')

console.log('GBP gallery synchronization checks passed.')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'GBP gallery checks failed')
  process.exit(1)
})
