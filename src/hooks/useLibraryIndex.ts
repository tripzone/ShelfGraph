import { useEffect, useMemo, useState } from 'react'
import { subscribeToAllBooks } from '../firebase/firestore'
import type { UserBook } from '../types/book'

/** Live map of every book the user has (either status), keyed by volume id. */
export function useLibraryIndex(uid: string | undefined) {
  const [books, setBooks] = useState<UserBook[]>([])

  useEffect(() => {
    if (!uid) {
      setBooks([])
      return
    }
    return subscribeToAllBooks(uid, setBooks)
  }, [uid])

  const byId = useMemo(() => new Map(books.map((b) => [b.googleVolumeId, b])), [books])

  return { books, byId }
}
