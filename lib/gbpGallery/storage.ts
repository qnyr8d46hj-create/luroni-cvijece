import { adminDb } from '@/lib/firebaseAdmin'
import { getStorage } from 'firebase-admin/storage'
import { firebaseDownloadUrl } from './model'
import type { GalleryImageUpload } from './sync'

// Uploads are Admin SDK writes. Do not grant public Storage write access.
// The download token lets the website render one object without opening the bucket.
export async function uploadGalleryImage(input: GalleryImageUpload): Promise<string> {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET?.trim()
  if (!bucketName) throw new Error('FIREBASE_STORAGE_BUCKET is not set')
  if (!adminDb) throw new Error('Firebase Admin is not initialised')

  const file = getStorage().bucket(bucketName).file(input.path)
  await file.save(Buffer.from(input.bytes), {
    resumable: false,
    metadata: {
      contentType: input.contentType,
      cacheControl: 'public, max-age=86400',
      metadata: {
        firebaseStorageDownloadTokens: input.token,
      },
    },
  })
  return firebaseDownloadUrl(bucketName, input.path, input.token)
}
