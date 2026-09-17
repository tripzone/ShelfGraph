import { useEffect, useRef, useState } from 'react'
import type { BookFormat } from '../../types/book'

export type SortMode = 'custom' | 'title' | 'date' | 'genre'

const SORT_LABELS: Record<SortMode, string> = {
  custom: 'Custom',
  title: 'Title',
  date: 'Date Finished',
  genre: 'Genre',
}

const FORMAT_LABELS: Record<BookFormat, string> = {
  physical: 'Physical',
  ebook: 'Ebook',
  audio: 'Audio',
}

const FORMATS = Object.keys(FORMAT_LABELS) as BookFormat[]
const SORT_MODES = Object.keys(SORT_LABELS) as SortMode[]

interface ReadToolbarProps {
  sortMode: SortMode
  onSortModeChange: (mode: SortMode) => void
  genres: string[]
  genreFilter: Set<string>
  onGenreFilterChange: (next: Set<string>) => void
  formatFilter: Set<BookFormat>
  onFormatFilterChange: (next: Set<BookFormat>) => void
}

export function ReadToolbar({
  sortMode,
  onSortModeChange,
  genres,
  genreFilter,
  onGenreFilterChange,
  formatFilter,
  onFormatFilterChange,
}: ReadToolbarProps) {
  const [openMenu, setOpenMenu] = useState<'sort' | 'filter' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggleGenre(genre: string) {
    const next = new Set(genreFilter)
    if (next.has(genre)) next.delete(genre)
    else next.add(genre)
    onGenreFilterChange(next)
  }

  function toggleFormat(format: BookFormat) {
    const next = new Set(formatFilter)
    if (next.has(format)) next.delete(format)
    else next.add(format)
    onFormatFilterChange(next)
  }

  const filterCount = genreFilter.size + formatFilter.size

  return (
    <div ref={containerRef} className="relative mx-auto flex max-w-3xl items-center gap-2 px-4 py-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenMenu((m) => (m === 'sort' ? null : 'sort'))}
          className="rounded-full border border-hairline px-3 py-1.5 text-xs font-medium text-ink"
        >
          Sort: {SORT_LABELS[sortMode]}
        </button>
        {openMenu === 'sort' && (
          <div className="absolute left-0 top-full z-30 mt-1 w-40 rounded-lg border border-hairline bg-surface py-1 shadow-lg">
            {SORT_MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  onSortModeChange(mode)
                  setOpenMenu(null)
                }}
                className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-canvas ${
                  mode === sortMode ? 'font-semibold text-ink' : 'text-ink/80'
                }`}
              >
                {SORT_LABELS[mode]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenMenu((m) => (m === 'filter' ? null : 'filter'))}
          className="rounded-full border border-hairline px-3 py-1.5 text-xs font-medium text-ink"
        >
          Filter{filterCount > 0 ? ` (${filterCount})` : ''}
        </button>
        {openMenu === 'filter' && (
          <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-lg border border-hairline bg-surface p-3 shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Format</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {FORMATS.map((format) => (
                <button
                  key={format}
                  type="button"
                  onClick={() => toggleFormat(format)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                    formatFilter.has(format)
                      ? 'border-ink bg-ink text-ink-inverse'
                      : 'border-hairline text-ink'
                  }`}
                >
                  {FORMAT_LABELS[format]}
                </button>
              ))}
            </div>

            {genres.length > 0 && (
              <>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Genre
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {genres.map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => toggleGenre(genre)}
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                        genreFilter.has(genre)
                          ? 'border-ink bg-ink text-ink-inverse'
                          : 'border-hairline text-ink'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </>
            )}

            {filterCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  onGenreFilterChange(new Set())
                  onFormatFilterChange(new Set())
                }}
                className="mt-3 text-xs font-medium text-muted underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
