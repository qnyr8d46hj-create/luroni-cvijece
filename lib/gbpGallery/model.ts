import type { PublicGalleryPhoto } from './public'

export type { PublicGalleryPhoto }

export const HOMEPAGE_GALLERY_LIMIT = 6
export const GALLERY_PAGE_LIMIT = 12
export const MIN_SYNCED_HOMEPAGE_PHOTOS = 6
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024

export interface RemotePhoto {
  mediaResourceName: string | null
  googleUrl: string
}

export interface RemoteLocalPost {
  resourceName: string
  createTime: string
  updateTime: string
  summary: string
  topicType: string
  state: string
  photo: RemotePhoto | null
}

export interface StoredGalleryPost {
  resourceName: string
  mediaResourceName: string | null
  sourceUrl: string | null
  createTime: string
  updateTime: string
  summary: string
  topicType: string
  state: string
  suitable: boolean
  suitabilityReasons: string[]
  visibilityOverride: 'show' | 'hide' | null
  storagePath: string | null
  imageUrl: string | null
  contentType: string | null
  deletedAt: string | null
  lastSeenAt: string | null
  imageStoredAt: string | null
  imageSyncError: string | null
}

export interface StoredImage {
  imageUrl: string
  storagePath: string
  contentType: 'image/jpeg' | 'image/png' | 'image/webp'
  token: string
}

export interface Suitability {
  suitable: boolean
  reasons: string[]
}

export interface PlannedUpsert {
  remote: RemoteLocalPost
  previous: StoredGalleryPost | null
  downloadImage: boolean
  skipWrite: boolean
}

export interface SyncPlan {
  aborted: boolean
  abortReason: string | null
  upserts: PlannedUpsert[]
  deletions: string[]
}

const POST_NAME =
  /^accounts\/[A-Za-z0-9_-]+\/locations\/[A-Za-z0-9_-]+\/localPosts\/([A-Za-z0-9_-]{1,128})$/

const BOUQUET_TERMS = [
  'buket',
  'cvijet',
  'cvijeć',
  'cvjec',
  'ruž',
  'ruz',
  'tulipan',
  'božur',
  'bozur',
  'ljiljan',
  'orhide',
  'hortenz',
  'sezon',
  'aranž',
  'aranz',
  'vjenčan',
  'vjencan',
  'rođendan',
  'rodendan',
  'cvjećar',
  'cvjecar',
]

const NON_BOUQUET_PATTERNS: { id: string; pattern: RegExp }[] = [
  { id: 'hours', pattern: /radno vrijeme|radnim vremenom|otvoreni smo|working hours/i },
  { id: 'closure', pattern: /(?:^|\s)zatvoreno(?:\s|[.!,]|$)|ne radimo|godišnji odmor|godisnji odmor|neradni/i },
  { id: 'hiring', pattern: /zapošljav|zaposljav|tražimo radnik|trazimo radnik|natječaj|natjecaj|otvorena pozicija/i },
  { id: 'review', pattern: /recenzij|ocijenite nas|ostavite recenz|google recenz|review us/i },
  { id: 'directions', pattern: /kako doći|kako doci|parkiranj/i },
]

export function isImageHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '')
  return (
    host === 'googleusercontent.com' ||
    host.endsWith('.googleusercontent.com') ||
    host === 'ggpht.com' ||
    host.endsWith('.ggpht.com')
  )
}

export function isAllowedImageUrl(value: string): boolean {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return false
    if (url.username || url.password) return false
    return isImageHost(url.hostname)
  } catch {
    return false
  }
}

export function docIdFromResourceName(resourceName: string): string {
  const match = POST_NAME.exec(resourceName)
  if (!match) throw new Error('Unexpected Google local post id')
  return match[1]
}

export function normalizeTimestamp(value: string): string | null {
  if (!value.trim()) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

export function sniffImage(
  bytes: Uint8Array,
  headerContentType: string | null,
): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (bytes.byteLength < 12 || bytes.byteLength > MAX_IMAGE_BYTES) return null
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  const webp =
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  const detected = jpeg ? 'image/jpeg' : png ? 'image/png' : webp ? 'image/webp' : null
  if (!detected) return null
  if (headerContentType) {
    const mime = headerContentType.split(';')[0]?.trim().toLowerCase()
    if (mime && mime !== 'application/octet-stream' && mime !== detected) return null
  }
  return detected
}

export function isStoredGalleryImageUrl(value: string | null): boolean {
  if (!value) return false
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.hostname !== 'firebasestorage.googleapis.com') return false
    if (!/^\/v0\/b\/[A-Za-z0-9][A-Za-z0-9.-]{1,220}\/o\/gbp-gallery%2F[A-Za-z0-9_-]{1,128}\.(jpg|png|webp)$/.test(url.pathname)) {
      return false
    }
    const token = url.searchParams.get('token') ?? ''
    return url.searchParams.get('alt') === 'media' && /^[0-9a-f-]{36}$/i.test(token)
  } catch {
    return false
  }
}

export function extensionFor(contentType: 'image/jpeg' | 'image/png' | 'image/webp'): 'jpg' | 'png' | 'webp' {
  if (contentType === 'image/png') return 'png'
  if (contentType === 'image/webp') return 'webp'
  return 'jpg'
}

export function galleryObjectPath(resourceName: string, contentType: 'image/jpeg' | 'image/png' | 'image/webp'): string {
  return `gbp-gallery/${docIdFromResourceName(resourceName)}.${extensionFor(contentType)}`
}

export function firebaseDownloadUrl(bucket: string, objectPath: string, token: string): string {
  if (!/^[a-z0-9][a-z0-9.-]{1,220}$/i.test(bucket)) throw new Error('Unexpected storage bucket')
  if (!/^gbp-gallery\/[A-Za-z0-9_-]{1,128}\.(jpg|png|webp)$/.test(objectPath)) {
    throw new Error('Unexpected gallery object path')
  }
  if (!/^[0-9a-f-]{36}$/i.test(token)) throw new Error('Unexpected download token')
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`
}

function hasBouquetLanguage(summary: string): boolean {
  const text = summary.toLocaleLowerCase('hr-HR')
  return BOUQUET_TERMS.some((term) => text.includes(term))
}

function nonBouquetSignals(summary: string): string[] {
  return NON_BOUQUET_PATTERNS.filter(({ pattern }) => pattern.test(summary)).map(({ id }) => id)
}

// A live photo post can be suitable with no caption. Keywords never approve a
// post on their own, and they only reject obvious non-bouquet copy.
export function classifyPost(post: RemoteLocalPost): Suitability {
  if (!post.photo) return { suitable: false, reasons: ['no_photo'] }
  if (!isAllowedImageUrl(post.photo.googleUrl)) return { suitable: false, reasons: ['image_host_not_allowed'] }
  if (!post.createTime || !post.updateTime) return { suitable: false, reasons: ['missing_timestamp'] }
  if (post.state !== 'LIVE') return { suitable: false, reasons: [`state_${post.state || 'unknown'}`] }
  if (post.topicType === 'ALERT') return { suitable: false, reasons: ['alert_topic'] }
  if (post.topicType !== 'STANDARD' && post.topicType !== 'EVENT' && post.topicType !== 'OFFER') {
    return { suitable: false, reasons: [`topic_${post.topicType || 'unknown'}`] }
  }

  const reasons = ['live_photo_post']
  const negative = nonBouquetSignals(post.summary)
  const bouquetLanguage = hasBouquetLanguage(post.summary)
  if (negative.length > 0 && !bouquetLanguage) {
    return { suitable: false, reasons: ['non_bouquet_copy', ...negative] }
  }
  if (negative.length > 0 && bouquetLanguage) {
    return { suitable: false, reasons: ['mixed_operational_copy', ...negative, 'has_bouquet_language'] }
  }
  reasons.push(bouquetLanguage ? 'bouquet_language' : 'photo_without_keyword_requirement')
  return { suitable: true, reasons }
}

export function galleryAlt(summary: string): string {
  const cleaned = summary.replace(/\s+/g, ' ').trim()
  if (!cleaned || nonBouquetSignals(cleaned).length > 0) {
    return 'Nedavno izrađen buket cvjećarnice Luroni'
  }
  if (cleaned.length <= 140) return cleaned
  return `${cleaned.slice(0, 137).trimEnd()}…`
}

export function isPubliclyVisible(post: StoredGalleryPost): boolean {
  if (post.deletedAt) return false
  if (!isStoredGalleryImageUrl(post.imageUrl)) return false
  if (post.visibilityOverride === 'hide') return false
  if (post.visibilityOverride === 'show') return true
  return post.suitable
}

export function selectPublicPhotos(posts: StoredGalleryPost[], limit: number): PublicGalleryPhoto[] {
  return posts
    .filter(isPubliclyVisible)
    .sort((a, b) => b.createTime.localeCompare(a.createTime) || b.updateTime.localeCompare(a.updateTime))
    .slice(0, limit)
    .map(toPublicPhoto)
}

export function homepageUsesSyncedGallery(visibleCount: number): boolean {
  return visibleCount >= MIN_SYNCED_HOMEPAGE_PHOTOS
}

export function toPublicPhoto(post: StoredGalleryPost): PublicGalleryPhoto {
  return {
    id: docIdFromResourceName(post.resourceName),
    src: post.imageUrl ?? '',
    alt: galleryAlt(post.summary),
    createdAt: post.createTime,
  }
}

export function dedupeRemotePosts(posts: RemoteLocalPost[]): RemoteLocalPost[] {
  const byId = new Map<string, RemoteLocalPost>()
  for (const post of posts) {
    const previous = byId.get(post.resourceName)
    if (!previous || post.updateTime > previous.updateTime) byId.set(post.resourceName, post)
  }
  return [...byId.values()]
}

function sameMedia(remote: RemoteLocalPost, previous: StoredGalleryPost): boolean {
  return (
    (previous.mediaResourceName ?? null) === (remote.photo?.mediaResourceName ?? null) &&
    (previous.sourceUrl ?? null) === (remote.photo?.googleUrl ?? null)
  )
}

function shouldDownload(remote: RemoteLocalPost, previous: StoredGalleryPost | null): boolean {
  if (!remote.photo || !isAllowedImageUrl(remote.photo.googleUrl)) return false
  if (!previous || !isStoredGalleryImageUrl(previous.imageUrl)) return true
  if (previous.imageSyncError) return true
  if (previous.updateTime !== remote.updateTime) return true
  if (!sameMedia(remote, previous)) return true
  return false
}

function materialChange(remote: RemoteLocalPost, previous: StoredGalleryPost): boolean {
  const suitability = classifyPost(remote)
  return (
    previous.deletedAt !== null ||
    previous.updateTime !== remote.updateTime ||
    previous.createTime !== remote.createTime ||
    previous.summary !== remote.summary ||
    previous.state !== remote.state ||
    previous.topicType !== remote.topicType ||
    previous.suitable !== suitability.suitable ||
    previous.suitabilityReasons.join('|') !== suitability.reasons.join('|') ||
    !sameMedia(remote, previous) ||
    !isStoredGalleryImageUrl(previous.imageUrl) ||
    Boolean(previous.imageSyncError)
  )
}

export function planSync(remote: RemoteLocalPost[], existing: StoredGalleryPost[]): SyncPlan {
  const deduped = dedupeRemotePosts(remote)
  if (deduped.length === 0 && existing.some((post) => !post.deletedAt)) {
    return { aborted: true, abortReason: 'empty_remote_list', upserts: [], deletions: [] }
  }

  const remoteIds = new Set(deduped.map((post) => post.resourceName))
  const existingById = new Map(existing.map((post) => [post.resourceName, post]))
  const upserts = deduped.map((post) => {
    const previous = existingById.get(post.resourceName) ?? null
    const downloadImage = shouldDownload(post, previous)
    const skipWrite = previous !== null && !downloadImage && !materialChange(post, previous)
    return { remote: post, previous, downloadImage, skipWrite }
  })
  const deletions = existing
    .filter((post) => !post.deletedAt && !remoteIds.has(post.resourceName))
    .map((post) => post.resourceName)

  return { aborted: false, abortReason: null, upserts, deletions }
}

export function nextStoredPost(input: {
  remote: RemoteLocalPost
  previous: StoredGalleryPost | null
  nowIso: string
  image: StoredImage | null
  imageFailed: boolean
}): StoredGalleryPost {
  const suitability = classifyPost(input.remote)
  const previousImage = input.previous?.imageUrl
    ? {
        storagePath: input.previous.storagePath,
        imageUrl: input.previous.imageUrl,
        contentType: input.previous.contentType,
        imageStoredAt: input.previous.imageStoredAt,
      }
    : null
  const keepPrevious = !input.image && previousImage
  const imageSyncError = input.image
    ? null
    : input.imageFailed
      ? previousImage
        ? 'preserved_previous_image'
        : 'image_unavailable'
      : null

  return {
    resourceName: input.remote.resourceName,
    mediaResourceName: input.remote.photo?.mediaResourceName ?? null,
    sourceUrl: input.remote.photo?.googleUrl ?? null,
    createTime: input.remote.createTime,
    updateTime: input.remote.updateTime,
    summary: input.remote.summary,
    topicType: input.remote.topicType,
    state: input.remote.state,
    suitable: suitability.suitable,
    suitabilityReasons: suitability.reasons,
    visibilityOverride: input.previous?.visibilityOverride ?? null,
    storagePath: input.image?.storagePath ?? (keepPrevious ? previousImage.storagePath : null),
    imageUrl: input.image?.imageUrl ?? (keepPrevious ? previousImage.imageUrl : null),
    contentType: input.image?.contentType ?? (keepPrevious ? previousImage.contentType : null),
    deletedAt: null,
    lastSeenAt: input.nowIso,
    imageStoredAt: input.image ? input.nowIso : keepPrevious ? previousImage.imageStoredAt : null,
    imageSyncError,
  }
}

export function markDeleted(previous: StoredGalleryPost, nowIso: string): StoredGalleryPost {
  return {
    ...previous,
    deletedAt: previous.deletedAt ?? nowIso,
    lastSeenAt: nowIso,
  }
}

export function firestorePayload(post: StoredGalleryPost): Record<string, string | number | boolean | null | string[]> {
  return {
    resourceName: post.resourceName,
    mediaResourceName: post.mediaResourceName,
    sourceUrl: post.sourceUrl,
    createTime: post.createTime,
    updateTime: post.updateTime,
    summary: post.summary,
    topicType: post.topicType,
    state: post.state,
    suitable: post.suitable,
    suitabilityReasons: post.suitabilityReasons,
    storagePath: post.storagePath,
    imageUrl: post.imageUrl,
    contentType: post.contentType,
    deletedAt: post.deletedAt,
    lastSeenAt: post.lastSeenAt,
    imageStoredAt: post.imageStoredAt,
    imageSyncError: post.imageSyncError,
  }
}

function readString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > max) return null
  return trimmed
}

function readNullableString(value: unknown, max: number): string | null {
  if (value == null) return null
  return readString(value, max)
}

export function parseStoredPost(data: unknown): StoredGalleryPost | null {
  if (!data || typeof data !== 'object') return null
  const record = data as Record<string, unknown>
  const resourceName = readString(record.resourceName, 300)
  if (!resourceName || !POST_NAME.test(resourceName)) return null
  const createTime = readString(record.createTime, 40)
  const updateTime = readString(record.updateTime, 40)
  if (!createTime || !updateTime || !normalizeTimestamp(createTime) || !normalizeTimestamp(updateTime)) return null
  const summary = typeof record.summary === 'string' ? record.summary.slice(0, 2000) : ''
  const reasons = Array.isArray(record.suitabilityReasons)
    ? record.suitabilityReasons.filter((reason): reason is string => typeof reason === 'string').slice(0, 20)
    : []
  const override = record.visibilityOverride === 'show' || record.visibilityOverride === 'hide'
    ? record.visibilityOverride
    : null
  if (typeof record.suitable !== 'boolean') return null

  return {
    resourceName,
    mediaResourceName: readNullableString(record.mediaResourceName, 1024),
    sourceUrl: readNullableString(record.sourceUrl, 2000),
    createTime,
    updateTime,
    summary,
    topicType: readString(record.topicType, 64) ?? '',
    state: readString(record.state, 64) ?? '',
    suitable: record.suitable,
    suitabilityReasons: reasons,
    visibilityOverride: override,
    storagePath: readNullableString(record.storagePath, 300),
    imageUrl: readNullableString(record.imageUrl, 2000),
    contentType: readNullableString(record.contentType, 64),
    deletedAt: readNullableString(record.deletedAt, 40),
    lastSeenAt: readNullableString(record.lastSeenAt, 40),
    imageStoredAt: readNullableString(record.imageStoredAt, 40),
    imageSyncError: readNullableString(record.imageSyncError, 80),
  }
}
