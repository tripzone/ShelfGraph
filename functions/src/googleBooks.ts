import type { CandidateBook } from './scoring/types.js'

interface GoogleVolume {
  id: string
  volumeInfo: {
    title?: string
    authors?: string[]
    description?: string
    pageCount?: number
    categories?: string[]
    imageLinks?: { thumbnail?: string }
    publisher?: string
    publishedDate?: string
    industryIdentifiers?: { type: string; identifier: string }[]
  }
}

export interface CandidateBookFull extends CandidateBook {
  coverUrl: string | null
  publisher: string | null
  publishedDate: string | null
  isbn: string | null
}

/**
 * Google's `thumbnail` link is a low-res ~128px-wide image with a page-curl
 * overlay. `zoom=3` (~575px wide) covers every cover the app renders at 2x retina
 * density without pulling `zoom=0`'s full-res scan, which can be 5x the bytes for
 * no visible gain. Dropping `edge=curl` removes the page-curl shadow overlay.
 */
function upgradeCoverUrl(url: string): string {
  return url
    .replace('http://', 'https://')
    .replace(/([?&])zoom=\d+/, '$1zoom=3')
    .replace(/[?&]edge=curl/, '')
}

export async function searchGoogleBooks(
  queryText: string,
  apiKey: string | undefined,
  maxResults = 8,
): Promise<CandidateBookFull[]> {
  const params = new URLSearchParams({ q: queryText, maxResults: String(maxResults) })
  if (apiKey) params.set('key', apiKey)

  const response = await fetch(`https://www.googleapis.com/books/v1/volumes?${params}`)
  if (!response.ok) return []

  const json = (await response.json()) as { items?: GoogleVolume[] }
  return (json.items ?? []).map((volume) => {
    const info = volume.volumeInfo
    const isbn = info.industryIdentifiers?.find((id) => id.type === 'ISBN_13')
    return {
      googleVolumeId: volume.id,
      title: info.title ?? 'Untitled',
      authors: info.authors ?? [],
      categories: info.categories ?? [],
      pageCount: info.pageCount ?? null,
      description: info.description ?? '',
      coverUrl: info.imageLinks?.thumbnail ? upgradeCoverUrl(info.imageLinks.thumbnail) : null,
      publisher: info.publisher ?? null,
      publishedDate: info.publishedDate ?? null,
      isbn: isbn?.identifier ?? null,
    }
  })
}
