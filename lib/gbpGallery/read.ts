import { GALLERY_PAGE_LIMIT, HOMEPAGE_GALLERY_LIMIT, homepageUsesSyncedGallery, type PublicGalleryPhoto } from './model'

function adminEnvConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  )
}

async function loadVisibleGbpPhotos(limit: number): Promise<PublicGalleryPhoto[]> {
  if (!adminEnvConfigured()) return []
  try {
    const { readVisibleGalleryPhotos } = await import('./firestore')
    return await readVisibleGalleryPhotos(limit)
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
