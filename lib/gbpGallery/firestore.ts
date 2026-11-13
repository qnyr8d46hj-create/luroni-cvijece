import { adminDb } from '@/lib/firebaseAdmin'
import { docIdFromResourceName, firestorePayload, parseStoredPost, selectPublicPhotos, type StoredGalleryPost } from './model'
import { uploadGalleryImage } from './storage'
import type { GalleryStore } from './sync'

// Server-only metadata. Sync never writes visibilityOverride or metadataOverride,
// so a manual Firestore value survives every synchronization.
// visibilityOverride "hide" removes a photo. "show" keeps a photo the filter rejected.
// metadataOverride replaces one generated title, alt, description, or occasion.
export const GBP_GALLERY_COLLECTION = 'gbpGalleryPosts'

export async function listStoredPosts(): Promise<StoredGalleryPost[]> {
  const snapshot = await adminDb.collection(GBP_GALLERY_COLLECTION).get()
  const posts: StoredGalleryPost[] = []
  for (const doc of snapshot.docs) {
    const parsed = parseStoredPost(doc.data())
    if (parsed) posts.push(parsed)
  }
  return posts
}

export async function saveStoredPost(post: StoredGalleryPost): Promise<void> {
  const id = docIdFromResourceName(post.resourceName)
  await adminDb.collection(GBP_GALLERY_COLLECTION).doc(id).set(firestorePayload(post), { merge: true })
}

export function firebaseGalleryStore(): GalleryStore {
  return {
    listPosts: listStoredPosts,
    savePost: saveStoredPost,
    uploadImage: uploadGalleryImage,
  }
}

export async function readVisibleGalleryPhotos(limit: number) {
  const posts = await listStoredPosts()
  return selectPublicPhotos(posts, limit)
}
