import { useEffect, useState } from 'react'
import { subscribeToRecommendations } from '../firebase/firestore'
import { generateRecommendations } from '../firebase/functions'
import type { RecommendedBook } from '../types/book'

export function useRecommendations(uid: string | undefined) {
  const [books, setBooks] = useState<RecommendedBook[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!uid) {
      setBooks([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = subscribeToRecommendations(uid, (next) => {
      setBooks(next.sort((a, b) => b.score - a.score))
      setLoading(false)
    })
    return unsubscribe
  }, [uid])

  async function refresh() {
    setRefreshing(true)
    try {
      await generateRecommendations()
    } finally {
      setRefreshing(false)
    }
  }

  return { books, loading, refreshing, refresh }
}
