import { randomUUID } from 'node:crypto'
import {
  assertOutbound,
  buildListPostsUrl,
  buildRefreshTokenRequest,
  parseLocalPostsPage,
  readAccessToken,
  type FetchImpl,
  type GbpSyncEnv,
} from './google'
import {
  dedupeRemotePosts,
  galleryObjectPath,
  isAllowedImageUrl,
  markDeleted,
  nextStoredPost,
  planSync,
  sniffImage,
  type RemoteLocalPost,
  type StoredGalleryPost,
  type StoredImage,
} from './model'

export interface SyncSummary {
  ok: boolean
  skipped?: boolean
  preserved?: boolean
  reason?: string
  fetched?: number
  upserted?: number
  deleted?: number
  imagesStored?: number
  imagesPreserved?: number
  error?: string
  missing?: string[]
}

export interface GalleryImageUpload {
  path: string
  bytes: Uint8Array
  contentType: 'image/jpeg' | 'image/png' | 'image/webp'
  token: string
}

export interface GalleryStore {
  listPosts(): Promise<StoredGalleryPost[]>
  savePost(post: StoredGalleryPost): Promise<void>
  uploadImage(input: GalleryImageUpload): Promise<string>
}

const MAX_PAGES = 20

async function refreshAccessToken(env: GbpSyncEnv, fetchImpl: FetchImpl): Promise<string> {
  const request = buildRefreshTokenRequest(env)
  assertOutbound(request)
  const response = await fetchImpl(request)
  if (response.status !== 200 || !response.text) throw new Error('OAuth token refresh failed')
  return readAccessToken(response.text)
}

async function listAllLocalPosts(
  env: GbpSyncEnv,
  accessToken: string,
  fetchImpl: FetchImpl,
): Promise<RemoteLocalPost[]> {
  const posts: RemoteLocalPost[] = []
  let pageToken: string | null = null
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const request = {
      url: buildListPostsUrl(env.accountId, env.locationId, pageToken),
      method: 'GET' as const,
      headers: { authorization: `Bearer ${accessToken}`, accept: 'application/json' },
    }
    assertOutbound(request)
    const response = await fetchImpl(request)
    if (response.status !== 200 || !response.text) throw new Error('Local posts list failed')
    const parsed = parseLocalPostsPage(response.text)
    posts.push(...parsed.posts)
    if (!parsed.nextPageToken) return dedupeRemotePosts(posts)
    pageToken = parsed.nextPageToken
  }
  throw new Error('Local posts list was incomplete')
}

async function downloadImage(startUrl: string, fetchImpl: FetchImpl): Promise<{ bytes: Uint8Array; contentType: string | null }> {
  let current = startUrl
  for (let hop = 0; hop < 3; hop += 1) {
    if (!isAllowedImageUrl(current)) throw new Error('Image host is not allowed')
    const request = { url: current, method: 'GET' as const }
    assertOutbound(request)
    const response = await fetchImpl(request)
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers?.location
      if (!location) throw new Error('Image redirect was missing a location')
      current = new URL(location, current).toString()
      continue
    }
    if (response.status !== 200 || !response.bytes) throw new Error('Image download failed')
    return { bytes: response.bytes, contentType: response.headers?.['content-type'] ?? null }
  }
  throw new Error('Image download redirected too many times')
}

async function resolveImage(
  remote: RemoteLocalPost,
  download: boolean,
  fetchImpl: FetchImpl,
  store: GalleryStore,
): Promise<{ image: StoredImage | null; imageFailed: boolean }> {
  if (!download || !remote.photo) return { image: null, imageFailed: false }
  try {
    const downloaded = await downloadImage(remote.photo.googleUrl, fetchImpl)
    const contentType = sniffImage(downloaded.bytes, downloaded.contentType)
    if (!contentType) return { image: null, imageFailed: true }
    const path = galleryObjectPath(remote.resourceName, contentType)
    const token = randomUUID()
    const imageUrl = await store.uploadImage({
      path,
      bytes: downloaded.bytes,
      contentType,
      token,
    })
    return {
      image: { imageUrl, storagePath: path, contentType, token },
      imageFailed: false,
    }
  } catch {
    return { image: null, imageFailed: true }
  }
}

// Reads Business Profile local posts and stores photos. It never sends a
// Business Profile write request. A failed Google read leaves stored photos as
// they are.
export async function syncGbpGallery(deps: {
  env: GbpSyncEnv
  fetchImpl: FetchImpl
  store: GalleryStore
  now?: () => Date
}): Promise<SyncSummary> {
  const nowIso = (deps.now ?? (() => new Date()))().toISOString()

  let accessToken: string
  try {
    accessToken = await refreshAccessToken(deps.env, deps.fetchImpl)
  } catch {
    return { ok: false, preserved: true, error: 'OAuth token refresh failed' }
  }

  let remote: RemoteLocalPost[]
  try {
    remote = await listAllLocalPosts(deps.env, accessToken, deps.fetchImpl)
  } catch {
    return { ok: false, preserved: true, error: 'Google post list failed' }
  }

  const existing = await deps.store.listPosts()
  const plan = planSync(remote, existing)
  if (plan.aborted) {
    console.info(`[gbpGallery] preserved existing photos reason=${plan.abortReason}`)
    return {
      ok: true,
      skipped: true,
      preserved: true,
      reason: plan.abortReason ?? 'aborted',
      fetched: remote.length,
    }
  }

  let upserted = 0
  let imagesStored = 0
  let imagesPreserved = 0
  for (const item of plan.upserts) {
    if (item.skipWrite) continue
    const resolved = await resolveImage(item.remote, item.downloadImage, deps.fetchImpl, deps.store)
    const stored = nextStoredPost({
      remote: item.remote,
      previous: item.previous,
      nowIso,
      image: resolved.image,
      imageFailed: resolved.imageFailed,
    })
    await deps.store.savePost(stored)
    upserted += 1
    if (resolved.image) imagesStored += 1
    if (resolved.imageFailed && item.previous?.imageUrl) imagesPreserved += 1
  }

  let deleted = 0
  const existingById = new Map(existing.map((post) => [post.resourceName, post]))
  for (const resourceName of plan.deletions) {
    const previous = existingById.get(resourceName)
    if (!previous) continue
    await deps.store.savePost(markDeleted(previous, nowIso))
    deleted += 1
  }

  console.info(
    `[gbpGallery] fetched=${remote.length} upserted=${upserted} deleted=${deleted} imagesStored=${imagesStored} imagesPreserved=${imagesPreserved}`,
  )
  return { ok: true, fetched: remote.length, upserted, deleted, imagesStored, imagesPreserved }
}
