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
  onCreateCustom: (book: BookMetadata) => void
}

export function Autocomplete({
  results,
  loading,
  error,
  query,
  onSelectRow,
  onQuickAdd,
  onQuickMarkRead,
  onCreateCustom,
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
          <CreateCustomRow
            query={query}
            prominent={results.length === 0}
            onCreate={onCreateCustom}
          />
        )}
      </ul>
    </div>
  )
}

function CreateCustomRow({
  query,
  prominent,
  onCreate,
}: {
  query: string
  prominent: boolean
  onCreate: (book: BookMetadata) => void
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [genre, setGenre] = useState('')
  const [pageCount, setPageCount] = useState('')
  const [publisher, setPublisher] = useState('')
  const [publishedDate, setPublishedDate] = useState('')
  const [description, setDescription] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return
    const trimmedPageCount = pageCount.trim()
    onCreate({
      googleVolumeId: `custom-${crypto.randomUUID()}`,
      title: trimmedTitle,
      authors: author.trim() ? [author.trim()] : [],
      coverUrl: null,
      defaultCoverUrl: null,
      pageCount: trimmedPageCount ? Number(trimmedPageCount) : null,
      categories: genre.trim() ? [genre.trim()] : [],
      description: description.trim(),
      publisher: publisher.trim() || null,
      publishedDate: publishedDate.trim() || null,
      isbn: null,
    })
  }

  if (!open) {
    return (
      <li className={`border-t border-hairline px-4 ${prominent ? 'py-4' : 'py-3'}`}>
        <button
          type="button"
          onClick={() => {
            setTitle(query)
            setOpen(true)
          }}
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

  return (
    <li className="border-t border-hairline px-4 py-3">
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
        />
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Author (optional)"
          className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
        />
        <div className="flex gap-2">
          <input
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="Genre (optional)"
            className="w-1/2 rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
          />
          <input
            value={pageCount}
            onChange={(e) => setPageCount(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            placeholder="Pages (optional)"
            className="w-1/2 rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
          />
        </div>
        <input
          value={publisher}
          onChange={(e) => setPublisher(e.target.value)}
          placeholder="Publisher (optional)"
          className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
        />
        <input
          value={publishedDate}
          onChange={(e) => setPublishedDate(e.target.value)}
          placeholder="Release date (optional)"
          className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={3}
          className="w-full resize-none rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!title.trim()}
            className="flex-1 rounded-full bg-ink py-2 text-sm font-semibold text-ink-inverse disabled:opacity-50"
          >
            Add Title
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full border border-hairline px-4 py-2 text-sm text-ink"
          >
            Cancel
          </button>
        </div>
      </form>
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
  const [adding, setAdding] = useState(false)
  const [markedRead, setMarkedRead] = useState(false)
  const [markingRead, setMarkingRead] = useState(false)

  async function handleQuickAdd(e: React.MouseEvent) {
    e.stopPropagation()
    if (added || adding) return
    setAdding(true)
    await onQuickAdd(book)
    setAdding(false)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  async function handleQuickMarkRead(e: React.MouseEvent) {
    e.stopPropagation()
    if (markedRead || markingRead) return
    setMarkingRead(true)
    await onQuickMarkRead(book)
    setMarkingRead(false)
    setMarkedRead(true)
    setTimeout(() => setMarkedRead(false), 1500)
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
          {added ? '✓' : '+'}
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
