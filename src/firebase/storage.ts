import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from './config'

const MAX_DIMENSION = 640
const JPEG_QUALITY = 0.85

/** Downscales to MAX_DIMENSION and re-encodes as JPEG so covers stay small and uniform. */
async function resizeToJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(bitmap, 0, 0, width, height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode image'))),
      'image/jpeg',
      JPEG_QUALITY,
    )
  })
}

/** Uploads a user-chosen cover image and returns its public download URL. */
export async function uploadCustomCover(
  uid: string,
  volumeId: string,
  file: File,
): Promise<string> {
  const blob = await resizeToJpeg(file)
  const coverRef = ref(storage, `users/${uid}/covers/${volumeId}`)
  await uploadBytes(coverRef, blob, { contentType: 'image/jpeg' })
  return getDownloadURL(coverRef)
}
