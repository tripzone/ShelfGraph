import { useState } from 'react'
import type { BookMetadata } from '../../types/book'

interface AutocompleteProps {
  results: BookMetadata[]
  loading: boolean
  error: string | null
  query: string
  onSelectRow: (book: BookMetadata) => void
  onQuickAdd: (book: BookMetadata) => Promise<void>
  onQuickMarkRead: (book: BookMetadata) => Promise<void>
  onOpenCreateCustom: () => void
}

export function Autocomplete({
  results,
  loading,
  error,
  query,
  onSelectRow,
  onQuickAdd,
  onQuickMarkRead,
  onOpenCreateCustom,
}: AutocompleteProps) {
  if (!query.trim()) return null

  const settled = !loading && !error

  return (
    <div className="absolute inset-x-0 top-full z-40 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-hairline bg-surface shadow-lg">
      {loading && results.length === 0 && (
        <p className="px-4 py-6 text-center text-sm text-muted">Searching…</p>
      )}
      {error && <p className="px-4 py-6 text-center text-sm text-muted">{error}</p>}
      {settled && results.length === 0 && (
        <p className="px-4 pt-6 text-center text-sm text-muted">No books found.</p>
      )}
      <ul>
        {results.map((book) => (
          <SearchResultRow
            key={book.googleVolumeId}
            book={book}
            onSelectRow={onSelectRow}
            onQuickAdd={onQuickAdd}
            onQuickMarkRead={onQuickMarkRead}
          />
        ))}
        {settled && (
          <CreateCustomRow prominent={results.length === 0} onOpen={onOpenCreateCustom} />
        )}
      </ul>
    </div>
  )
}

function CreateCustomRow({ prominent, onOpen }: { prominent: boolean; onOpen: () => void }) {
  return (
    <li className={`border-t border-hairline px-4 ${prominent ? 'py-4' : 'py-3'}`}>
      <button
        type="button"
        onClick={onOpen}
        className={
          prominent
            ? 'w-full rounded-lg bg-ink py-2.5 text-sm font-semibold text-ink-inverse'
            : 'text-sm font-medium text-ink underline underline-offset-2'
        }
      >
        Can't find it? Add your own title
      </button>
    </li>
  )
}

function SearchResultRow({
  book,
  onSelectRow,
  onQuickAdd,
  onQuickMarkRead,
}: {
  book: BookMetadata
  onSelectRow: (book: BookMetadata) => void
  onQuickAdd: (book: BookMetadata) => Promise<void>
  onQuickMarkRead: (book: BookMetadata) => Promise<void>
}) {
  const [added, setAdded] = useState(false)
  const [markedRead, setMarkedRead] = useState(false)

  function handleQuickAdd(e: React.MouseEvent) {
    e.stopPropagation()
    if (added || markedRead) return
    setAdded(true)
    onQuickAdd(book)
  }

  function handleQuickMarkRead(e: React.MouseEvent) {
    e.stopPropagation()
    if (added || markedRead) return
    setMarkedRead(true)
    onQuickMarkRead(book)
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
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleQuickAdd}
          aria-label={added ? 'Added to queue' : 'Quick add to queue'}
          className={`flex h-8 w-8 items-center justify-center rounded-full border text-lg transition-colors ${
            added
              ? 'border-accent bg-accent-soft text-accent'
              : 'border-hairline text-ink hover:border-ink'
          }`}
        >
          +
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleQuickMarkRead}
          aria-label={markedRead ? 'Marked as read' : 'Quick mark as read'}
          className={`flex h-8 w-8 items-center justify-center rounded-full border text-base transition-colors ${
            markedRead
              ? 'border-accent bg-accent-soft text-accent'
              : 'border-hairline text-ink hover:border-ink'
          }`}
        >
          ✓
        </button>
      </div>
    </li>
  )
}
