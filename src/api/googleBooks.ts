import { metadataFromVolume, type BookMetadata, type GoogleVolume } from '../types/book'

const API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY as string | undefined
const BASE_URL = 'https://www.googleapis.com/books/v1/volumes'

/** Direct client-side call to Google Books, for search latency (never proxied). */
export async function searchBooks(
  queryText: string,
  signal?: AbortSignal,
  maxResults = 8,
): Promise<BookMetadata[]> {
  const trimmed = queryText.trim()
  if (!trimmed) return []

  const params = new URLSearchParams({
    q: trimmed,
    maxResults: String(maxResults),
    printType: 'books',
  })
  if (API_KEY) params.set('key', API_KEY)

  const response = await fetch(`${BASE_URL}?${params.toString()}`, { signal })
  if (!response.ok) throw new Error(`Google Books search failed: ${response.status}`)

  const json = (await response.json()) as { items?: GoogleVolume[] }
  return (json.items ?? []).map(metadataFromVolume)
}

export async function getVolume(volumeId: string): Promise<BookMetadata> {
  const params = new URLSearchParams()
  if (API_KEY) params.set('key', API_KEY)
  const response = await fetch(`${BASE_URL}/${volumeId}?${params.toString()}`)
  if (!response.ok) throw new Error(`Google Books lookup failed: ${response.status}`)
  const volume = (await response.json()) as GoogleVolume
  return metadataFromVolume(volume)
}
