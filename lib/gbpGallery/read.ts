import { unstable_cache } from 'next/cache'
import {
  GALLERY_PAGE_LIMIT,
  GALLERY_READ_REVALIDATE_SECONDS,
  HOMEPAGE_GALLERY_LIMIT,
  LANDING_GALLERY_LIMIT,
  homepageUsesSyncedGallery,
  landingUsesSyncedGallery,
  type PublicGalleryPhoto,
} from './model'

function adminEnvConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  )
}

// One Firestore read, shared by the homepage, /galerija, and the city pages.
// "Učitaj još" only reveals photos already in this result.
const readCachedVisiblePhotos = unstable_cache(
  async () => {
    const { readVisibleGalleryPhotos } = await import('./firestore')
    return readVisibleGalleryPhotos(GALLERY_PAGE_LIMIT)
  },
  ['gbp-visible-gallery-photos'],
  { revalidate: GALLERY_READ_REVALIDATE_SECONDS },
)

async function loadVisibleGbpPhotos(limit: number): Promise<PublicGalleryPhoto[]> {
  if (!adminEnvConfigured()) return []
  try {
    const photos = await readCachedVisiblePhotos()
    return photos.slice(0, limit)
  } catch {
    console.error('[gbpGallery] Could not read synced photos. The static gallery stays in use.')
    return []
  }
}

export async function loadHomepagePhotos(): Promise<PublicGalleryPhoto[] | null> {
  const photos = await loadVisibleGbpPhotos(HOMEPAGE_GALLERY_LIMIT)
  if (!homepageUsesSyncedGallery(photos.length)) return null
  return photos
}

export async function loadGalleryPagePhotos(): Promise<PublicGalleryPhoto[] | null> {
  const photos = await loadVisibleGbpPhotos(GALLERY_PAGE_LIMIT)
  if (photos.length === 0) return null
  return photos
}

export async function loadLandingPhotos(): Promise<PublicGalleryPhoto[] | null> {
  const photos = await loadVisibleGbpPhotos(LANDING_GALLERY_LIMIT)
  if (!landingUsesSyncedGallery(photos.length)) return null
  return photos
}
