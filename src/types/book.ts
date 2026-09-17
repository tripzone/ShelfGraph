export type BookStatus = 'read' | 'to-read'
export type BookFormat = 'physical' | 'ebook' | 'audio'

/** Metadata we cache once, so we never have to hit Google Books again for the same book. */
export interface BookMetadata {
  googleVolumeId: string
  title: string
  authors: string[]
  coverUrl: string | null
  /** The original Google Books cover, kept so a custom `coverUrl` can be reset. */
  defaultCoverUrl: string | null
  pageCount: number | null
  categories: string[]
  description: string
  publisher: string | null
  publishedDate: string | null
  isbn: string | null
}

/** A book in the signed-in user's library (either archive or queue). */
export interface UserBook extends BookMetadata {
  status: BookStatus
  rating: number | null
  finishedYear: number | null
  finishedMonth: number | null // 1-12; only meaningful when finishedYear is set
  format: BookFormat | null
  order: number
  propensityScore: number | null
  propensityRationale: string | null
  addedAt: string // ISO date
}

/** A candidate surfaced on the Recommendations tab. */
export interface RecommendedBook extends BookMetadata {
  score: number
  rationale: string
  generatedAt: string
}

/** Shape returned by the Google Books volumes API, trimmed to what we use. */
export interface GoogleVolume {
  id: string
  volumeInfo: {
    title: string
    authors?: string[]
    description?: string
    pageCount?: number
    categories?: string[]
    publisher?: string
    publishedDate?: string
    imageLinks?: { thumbnail?: string; smallThumbnail?: string }
    industryIdentifiers?: { type: string; identifier: string }[]
  }
}

/**
 * Google's `thumbnail` link is a low-res ~128px-wide image with a page-curl
 * overlay. `zoom=3` (~575px wide) covers every cover we render at 2x retina density
 * (our biggest is a ~180px grid tile) without pulling `zoom=0`'s full-res scan, which
 * can be 5x the bytes for no visible gain. Dropping `edge=curl` removes the page-curl
 * shadow overlay.
 */
export function upgradeCoverUrl(url: string): string {
  return url
    .replace('http://', 'https://')
    .replace(/([?&])zoom=\d+/, '$1zoom=3')
    .replace(/[?&]edge=curl/, '')
}

export function metadataFromVolume(volume: GoogleVolume): BookMetadata {
  const info = volume.volumeInfo
  const isbn13 = info.industryIdentifiers?.find((id) => id.type === 'ISBN_13')
  const isbn10 = info.industryIdentifiers?.find((id) => id.type === 'ISBN_10')
  const coverUrl = info.imageLinks?.thumbnail ? upgradeCoverUrl(info.imageLinks.thumbnail) : null
  return {
    googleVolumeId: volume.id,
    title: info.title ?? 'Untitled',
    authors: info.authors ?? [],
    coverUrl,
    defaultCoverUrl: coverUrl,
    pageCount: info.pageCount ?? null,
    categories: info.categories ?? [],
    description: info.description ?? '',
    publisher: info.publisher ?? null,
    publishedDate: info.publishedDate ?? null,
    isbn: (isbn13 ?? isbn10)?.identifier ?? null,
  }
}
