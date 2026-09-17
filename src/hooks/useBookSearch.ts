import { useEffect, useRef, useState } from 'react'
import { searchBooks } from '../api/googleBooks'
import type { BookMetadata } from '../types/book'

const DEBOUNCE_MS = 300

export function useBookSearch(queryText: string) {
  const [results, setResults] = useState<BookMetadata[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const trimmed = queryText.trim()
    abortRef.current?.abort()

    if (!trimmed) {
      setResults([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const books = await searchBooks(trimmed, controller.signal)
        setResults(books)
        setError(null)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('Search failed. Try again.')
        }
      } finally {
        setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [queryText])

  return { results, loading, error }
}
