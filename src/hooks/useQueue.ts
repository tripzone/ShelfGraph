import { useEffect, useState } from 'react'
import { reorderQueue, subscribeToBooksByStatus } from '../firebase/firestore'
import type { UserBook } from '../types/book'

/** Books with status='to-read', ordered by manual priority — the Tab 2 queue. */
export function useQueue(uid: string | undefined) {
  const [books, setBooks] = useState<UserBook[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setBooks([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = subscribeToBooksByStatus(uid, 'to-read', (next) => {
      setBooks(next)
      setLoading(false)
    })
    return unsubscribe
  }, [uid])

  async function reorder(orderedVolumeIds: string[]) {
    if (!uid) return
    // Optimistic local reorder so drag feels instant; onSnapshot reconciles after.
    setBooks((prev) => {
      const byId = new Map(prev.map((b) => [b.googleVolumeId, b]))
      return orderedVolumeIds.map((id, index) => ({ ...byId.get(id)!, order: index }))
    })
    await reorderQueue(uid, orderedVolumeIds)
  }

  return { books, loading, reorder }
}
