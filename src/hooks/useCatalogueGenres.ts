import { useMemo } from 'react'
import { useLibraryIndex } from './useLibraryIndex'

/** Every distinct genre already used across the user's whole catalogue (read + to-read). */
export function useCatalogueGenres(uid: string | undefined): string[] {
  const { books } = useLibraryIndex(uid)
  return useMemo(() => Array.from(new Set(books.flatMap((b) => b.categories))).sort(), [books])
}
