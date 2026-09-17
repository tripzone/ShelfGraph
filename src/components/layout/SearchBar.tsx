import { useRef, useState } from 'react'
import { Autocomplete } from '../search/Autocomplete'
import { useBookSearch } from '../../hooks/useBookSearch'
import { useLibraryActions } from '../../hooks/useLibraryActions'
import { useUiStore } from '../../store/uiStore'
import type { BookMetadata } from '../../types/book'

export function SearchBar({ uid }: { uid: string | undefined }) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { results, loading, error } = useBookSearch(query)
  const { addToQueue } = useLibraryActions(uid)
  const openSheet = useUiStore((s) => s.openSheet)
  const pushToast = useUiStore((s) => s.pushToast)

  function handleSelectRow(book: BookMetadata) {
    openSheet(book)
    setFocused(false)
  }

  async function handleQuickAdd(book: BookMetadata) {
    await addToQueue(book)
    pushToast('Added to Queue')
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null
        if (next && containerRef.current?.contains(next)) return
        setTimeout(() => setFocused(false), 150)
      }}
    >
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        type="search"
        inputMode="search"
        placeholder="Search for a book or author…"
        className="w-full rounded-full border border-hairline bg-canvas px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
      />
      {focused && (
        <Autocomplete
          results={results}
          loading={loading}
          error={error}
          query={query}
          onSelectRow={handleSelectRow}
          onQuickAdd={handleQuickAdd}
          onCreateCustom={handleSelectRow}
        />
      )}
    </div>
  )
}
