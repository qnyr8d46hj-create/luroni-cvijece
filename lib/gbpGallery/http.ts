import { assertOutbound, type FetchImpl } from './google'

const MAX_TEXT_BYTES = 2_000_000

// Manual redirects so an image URL cannot leave the Google image hosts.
export function createServerFetch(): FetchImpl {
  return async (call) => {
    assertOutbound(call)
    const response = await fetch(call.url, {
      method: call.method,
      headers: call.headers,
      body: call.body,
      redirect: 'manual',
      cache: 'no-store',
    })

    const headers: Record<string, string> = {}
    const location = response.headers.get('location')
    if (location) headers.location = location
    const contentType = response.headers.get('content-type')
    if (contentType) headers['content-type'] = contentType
    if (response.status >= 300 && response.status < 400) {
      return { status: response.status, headers }
    }

    const hostname = new URL(call.url).hostname
    const binary = hostname !== 'oauth2.googleapis.com' && hostname !== 'mybusiness.googleapis.com'
    if (binary) {
      return { status: response.status, headers, bytes: new Uint8Array(await response.arrayBuffer()) }
    }

    const text = await response.text()
    if (text.length > MAX_TEXT_BYTES) throw new Error('Google response was too large')
    return { status: response.status, headers, text }
  }
}
