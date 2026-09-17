import { useState } from 'react'
import type { BookMetadata } from '../../types/book'

interface AutocompleteProps {
  results: BookMetadata[]
  loading: boolean
  error: string | null
  query: string
  onSelectRow: (book: BookMetadata) => void
  onQuickAdd: (book: BookMetadata) => Promise<void>
}

export function Autocomplete({
  results,
  loading,
  error,
  query,
  onSelectRow,
  onQuickAdd,
}: AutocompleteProps) {
  if (!query.trim()) return null

  return (
    <div className="absolute inset-x-0 top-full z-40 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-hairline bg-surface shadow-lg">
      {loading && results.length === 0 && (
        <p className="px-4 py-6 text-center text-sm text-muted">Searching…</p>
      )}
      {error && <p className="px-4 py-6 text-center text-sm text-muted">{error}</p>}
      {!loading && !error && results.length === 0 && (
        <p className="px-4 py-6 text-center text-sm text-muted">No books found.</p>
      )}
      <ul>
        {results.map((book) => (
          <SearchResultRow
            key={book.googleVolumeId}
            book={book}
            onSelectRow={onSelectRow}
            onQuickAdd={onQuickAdd}
          />
        ))}
      </ul>
    </div>
  )
}

function SearchResultRow({
  book,
  onSelectRow,
  onQuickAdd,
}: {
  book: BookMetadata
  onSelectRow: (book: BookMetadata) => void
  onQuickAdd: (book: BookMetadata) => Promise<void>
}) {
  const [added, setAdded] = useState(false)
  const [adding, setAdding] = useState(false)

  async function handleQuickAdd(e: React.MouseEvent) {
    e.stopPropagation()
    if (added || adding) return
    setAdding(true)
    await onQuickAdd(book)
    setAdding(false)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <li
      onClick={() => onSelectRow(book)}
      className="flex cursor-pointer items-center gap-3 border-b border-hairline px-4 py-2.5 last:border-b-0 hover:bg-canvas"
    >
      <div className="h-12 w-8 shrink-0 overflow-hidden rounded bg-hairline">
        {book.coverUrl && (
          <img src={book.coverUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{book.title}</p>
        <p className="truncate text-xs text-muted">{book.authors.join(', ') || 'Unknown author'}</p>
      </div>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleQuickAdd}
        aria-label={added ? 'Added to queue' : 'Quick add to queue'}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-lg transition-colors ${
          added
            ? 'border-accent bg-accent-soft text-accent'
            : 'border-hairline text-ink hover:border-ink'
        }`}
      >
        {added ? '✓' : '+'}
      </button>
    </li>
  )
}
