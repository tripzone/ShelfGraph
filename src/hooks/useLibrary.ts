import { useEffect, useState } from 'react'
import { subscribeToBooksByStatus, updateUserBook } from '../firebase/firestore'
import type { UserBook } from '../types/book'

/** Books with status='read' — the Tab 1 archive. */
export function useLibrary(uid: string | undefined) {
  const [books, setBooks] = useState<UserBook[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setBooks([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = subscribeToBooksByStatus(uid, 'read', (next) => {
      setBooks(next)
      setLoading(false)
    })
    return unsubscribe
  }, [uid])

  async function rateBook(volumeId: string, rating: number) {
    if (!uid) return
    await updateUserBook(uid, volumeId, { rating })
  }

  return { books, loading, rateBook }
}
