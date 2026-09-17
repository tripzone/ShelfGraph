import { useEffect, useState } from 'react'
import { reorderBooks, subscribeToBooksByStatus, updateUserBook } from '../firebase/firestore'
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

  async function reorder(orderedVolumeIds: string[]) {
    if (!uid) return
    // Optimistic local reorder so drag feels instant; onSnapshot reconciles after.
    setBooks((prev) => {
      const byId = new Map(prev.map((b) => [b.googleVolumeId, b]))
      return orderedVolumeIds.map((id, index) => ({ ...byId.get(id)!, order: index }))
    })
    await reorderBooks(uid, orderedVolumeIds)
  }

  return { books, loading, rateBook, reorder }
}
