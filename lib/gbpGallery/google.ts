import {
  docIdFromResourceName,
  isAllowedImageUrl,
  isImageHost,
  normalizeTimestamp,
  type RemoteLocalPost,
} from './model'

export interface FetchCall {
  url: string
  method: 'GET' | 'POST'
  headers?: Record<string, string>
  body?: string
}

export interface FetchResult {
  status: number
  headers?: Record<string, string>
  text?: string
  bytes?: Uint8Array
}

export type FetchImpl = (call: FetchCall) => Promise<FetchResult>

export interface GbpSyncEnv {
  clientId: string
  clientSecret: string
  refreshToken: string
  accountId: string
  locationId: string
}

const ENV_KEYS = [
  'GBP_OAUTH_CLIENT_ID',
  'GBP_OAUTH_CLIENT_SECRET',
  'GBP_OAUTH_REFRESH_TOKEN',
  'GBP_ACCOUNT_ID',
  'GBP_LOCATION_ID',
] as const

const SAFE_ID = /^[A-Za-z0-9_-]{1,128}$/

export function isGbpSyncEnabled(env: { GBP_SYNC_ENABLED?: string; [key: string]: string | undefined }): boolean {
  return env.GBP_SYNC_ENABLED === 'true'
}

function plainCredential(value: string): string {
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 2048 || /[\r\n\0]/.test(trimmed)) {
    throw new Error('GBP credential is invalid')
  }
  return trimmed
}

export function normalizeAccountId(value: string): string {
  const id = value.trim().replace(/^accounts\//, '')
  if (!SAFE_ID.test(id)) throw new Error('GBP account id is invalid')
  return id
}

export function normalizeLocationId(value: string): string {
  const id = value.trim().replace(/^locations\//, '')
  if (!SAFE_ID.test(id)) throw new Error('GBP location id is invalid')
  return id
}

export function readGbpSyncEnv(
  env: Record<string, string | undefined>,
): { ok: true; value: GbpSyncEnv } | { ok: false; missing: string[] } {
  const missing = ENV_KEYS.filter((key) => !env[key]?.trim())
  if (missing.length > 0) return { ok: false, missing: [...missing] }
  try {
    return {
      ok: true,
      value: {
        clientId: plainCredential(env.GBP_OAUTH_CLIENT_ID ?? ''),
        clientSecret: plainCredential(env.GBP_OAUTH_CLIENT_SECRET ?? ''),
        refreshToken: plainCredential(env.GBP_OAUTH_REFRESH_TOKEN ?? ''),
        accountId: normalizeAccountId(env.GBP_ACCOUNT_ID ?? ''),
        locationId: normalizeLocationId(env.GBP_LOCATION_ID ?? ''),
      },
    }
  } catch {
    return { ok: false, missing: ['GBP_ACCOUNT_ID or GBP_LOCATION_ID is not a plain id'] }
  }
}

export function buildRefreshTokenRequest(env: Pick<GbpSyncEnv, 'clientId' | 'clientSecret' | 'refreshToken'>): FetchCall {
  const body = new URLSearchParams({
    client_id: env.clientId,
    client_secret: env.clientSecret,
    refresh_token: env.refreshToken,
    grant_type: 'refresh_token',
  })
  return {
    url: 'https://oauth2.googleapis.com/token',
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  }
}

export function readAccessToken(text: string): string {
  let payload: unknown
  try {
    payload = JSON.parse(text)
  } catch {
    throw new Error('OAuth token response was not JSON')
  }
  if (!payload || typeof payload !== 'object') throw new Error('OAuth token response was not an object')
  const token = (payload as { access_token?: unknown }).access_token
  if (typeof token !== 'string' || token.length < 20 || token.length > 4096) {
    throw new Error('OAuth token response did not include an access token')
  }
  return token
}

export function buildListPostsUrl(accountId: string, locationId: string, pageToken?: string | null): string {
  const account = normalizeAccountId(accountId)
  const location = normalizeLocationId(locationId)
  const url = new URL(`https://mybusiness.googleapis.com/v4/accounts/${account}/locations/${location}/localPosts`)
  url.searchParams.set('pageSize', '100')
  if (pageToken) url.searchParams.set('pageToken', pageToken)
  return url.toString()
}

export function assertOutbound(call: FetchCall): void {
  const url = new URL(call.url)
  if (url.protocol !== 'https:') throw new Error('GBP client only allows https')
  if (url.username || url.password) throw new Error('GBP client refuses credentials in URLs')
  const authorization = call.headers?.authorization

  if (url.hostname === 'oauth2.googleapis.com') {
    if (call.method !== 'POST' || url.pathname !== '/token') {
      throw new Error('OAuth helper may only POST /token')
    }
    if (authorization) throw new Error('Token request must not send a bearer token')
    return
  }

  if (url.hostname === 'mybusiness.googleapis.com') {
    if (call.method !== 'GET') throw new Error('GBP client refuses non-GET Business Profile requests')
    if (!/^\/v4\/accounts\/[A-Za-z0-9_-]+\/locations\/[A-Za-z0-9_-]+\/localPosts$/.test(url.pathname)) {
      throw new Error('GBP client may only list local posts')
    }
    return
  }

  if (call.method === 'GET' && isImageHost(url.hostname)) {
    if (authorization) throw new Error('Image download must not send a bearer token')
    return
  }

  throw new Error('Blocked outbound request')
}

function readPageToken(value: unknown): string | null {
  if (value == null || value === '') return null
  if (typeof value !== 'string' || value.length > 2048 || /[\r\n\0]/.test(value)) {
    throw new Error('Local posts page token was invalid')
  }
  return value
}

function photoFromMedia(media: unknown): RemoteLocalPost['photo'] {
  if (!Array.isArray(media)) return null
  for (const item of media) {
    if (!item || typeof item !== 'object') continue
    const record = item as Record<string, unknown>
    if (record.mediaFormat !== 'PHOTO') continue
    const googleUrl = typeof record.googleUrl === 'string' ? record.googleUrl : ''
    const sourceUrl = typeof record.sourceUrl === 'string' ? record.sourceUrl : ''
    const candidate = isAllowedImageUrl(googleUrl) ? googleUrl : isAllowedImageUrl(sourceUrl) ? sourceUrl : ''
    if (!candidate) continue
    const mediaResourceName = typeof record.name === 'string' && record.name.length <= 1024 ? record.name : null
    return { mediaResourceName, googleUrl: candidate }
  }
  return null
}

export function parseLocalPostsPage(text: string): { posts: RemoteLocalPost[]; nextPageToken: string | null } {
  let payload: unknown
  try {
    payload = JSON.parse(text)
  } catch {
    throw new Error('Local posts response was not JSON')
  }
  if (!payload || typeof payload !== 'object') throw new Error('Local posts response was not an object')
  const record = payload as Record<string, unknown>
  if ('error' in record) throw new Error('Local posts request was rejected')
  const rawPosts = record.localPosts
  if (rawPosts == null) return { posts: [], nextPageToken: readPageToken(record.nextPageToken) }
  if (!Array.isArray(rawPosts)) throw new Error('Local posts response was invalid')

  const posts = rawPosts.map((item) => {
    if (!item || typeof item !== 'object') throw new Error('Local posts response included an invalid post')
    const post = item as Record<string, unknown>
    if (typeof post.name !== 'string') {
      throw new Error('Local posts response included an unexpected resource name')
    }
    try {
      docIdFromResourceName(post.name)
    } catch {
      throw new Error('Local posts response included an unexpected resource name')
    }
    const createTime = typeof post.createTime === 'string' ? normalizeTimestamp(post.createTime) : null
    const updateTime = typeof post.updateTime === 'string' ? normalizeTimestamp(post.updateTime) : null
    if (!createTime || !updateTime) throw new Error('Local posts response included an invalid timestamp')
    return {
      resourceName: post.name,
      createTime,
      updateTime,
      summary: typeof post.summary === 'string' ? post.summary.slice(0, 2000) : '',
      topicType: typeof post.topicType === 'string' ? post.topicType.slice(0, 64) : '',
      state: typeof post.state === 'string' ? post.state.slice(0, 64) : '',
      photo: photoFromMedia(post.media),
    } satisfies RemoteLocalPost
  })

  return { posts, nextPageToken: readPageToken(record.nextPageToken) }
}
