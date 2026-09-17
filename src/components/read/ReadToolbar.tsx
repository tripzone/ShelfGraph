import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../../hooks/useTheme'
import type { GridSize } from '../../hooks/useGridSize'
import type { BookFormat } from '../../types/book'

export type SortMode = 'custom' | 'title' | 'date' | 'genre'
export type SortDirection = 'asc' | 'desc'

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

const GRID_SIZE_LABELS: Record<GridSize, string> = {
  xs: 'XS',
  s: 'S',
  m: 'M',
  l: 'L',
}

const FORMATS = Object.keys(FORMAT_LABELS) as BookFormat[]
const SORT_MODES = Object.keys(SORT_LABELS) as SortMode[]
const GRID_SIZES = Object.keys(GRID_SIZE_LABELS) as GridSize[]

function SortIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4v12M6 4 3 7M6 4l3 3M14 16V4m0 12 3-3m-3 3-3-3" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4.5h14l-5 6.2V16l-4 2v-7.3z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 11.2A7.3 7.3 0 0 1 8.8 2.5a7.3 7.3 0 1 0 8.7 8.7z" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

interface ReadToolbarProps {
  sortMode: SortMode
  sortDirection: SortDirection
  onSortModeChange: (mode: SortMode) => void
  genres: string[]
  genreFilter: Set<string>
  onGenreFilterChange: (next: Set<string>) => void
  formatFilter: Set<BookFormat>
  onFormatFilterChange: (next: Set<BookFormat>) => void
  gridSize: GridSize
  onGridSizeChange: (size: GridSize) => void
  reorderMode: boolean
  onExitReorderMode: () => void
}

export function ReadToolbar({
  sortMode,
  sortDirection,
  onSortModeChange,
  genres,
  genreFilter,
  onGenreFilterChange,
  formatFilter,
  onFormatFilterChange,
  gridSize,
  onGridSizeChange,
  reorderMode,
  onExitReorderMode,
}: ReadToolbarProps) {
  const [openMenu, setOpenMenu] = useState<'sort' | 'filter' | 'settings' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (reorderMode) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-1">
        <p className="text-xs text-muted">Drag covers to reorder</p>
        <button
          type="button"
          onClick={onExitReorderMode}
          className="rounded-full border border-hairline px-3 py-1 text-xs font-semibold text-ink"
        >
          Done
        </button>
      </div>
    )
  }

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
    <div ref={containerRef} className="relative mx-auto flex max-w-3xl items-center gap-1 px-4 py-1">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenMenu((m) => (m === 'sort' ? null : 'sort'))}
          aria-label={`Sort: ${SORT_LABELS[sortMode]}${
            sortMode !== 'custom' ? (sortDirection === 'asc' ? ' ascending' : ' descending') : ''
          }`}
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink"
        >
          <SortIcon />
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
                className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-canvas ${
                  mode === sortMode ? 'font-semibold text-ink' : 'text-ink/80'
                }`}
              >
                {SORT_LABELS[mode]}
                {mode === sortMode && mode !== 'custom' && (
                  <span aria-hidden="true" className="text-xs text-muted">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenMenu((m) => (m === 'filter' ? null : 'filter'))}
          aria-label={`Filter${filterCount > 0 ? ` (${filterCount} active)` : ''}`}
          className="relative flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink"
        >
          <FilterIcon />
          {filterCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-ink text-[9px] font-semibold text-ink-inverse">
              {filterCount}
            </span>
          )}
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

      <div className="relative ml-auto">
        <button
          type="button"
          onClick={() => setOpenMenu((m) => (m === 'settings' ? null : 'settings'))}
          aria-label="Settings"
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink"
        >
          <SettingsIcon />
        </button>
        {openMenu === 'settings' && (
          <div className="absolute right-0 top-full z-30 mt-1 w-48 rounded-lg border border-hairline bg-surface py-1 shadow-lg">
            <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Appearance
            </p>
            <div className="flex gap-1.5 px-3 pb-1.5 pt-0.5">
              {(['light', 'dark'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setTheme(mode)
                    setOpenMenu(null)
                  }}
                  aria-label={mode === 'dark' ? 'Dark mode' : 'Light mode'}
                  className={`flex flex-1 items-center justify-center rounded-full border py-1.5 ${
                    mode === theme
                      ? 'border-ink bg-ink text-ink-inverse'
                      : 'border-hairline text-ink'
                  }`}
                >
                  {mode === 'dark' ? <MoonIcon /> : <SunIcon />}
                </button>
              ))}
            </div>

            <div className="my-1 border-t border-hairline" />

            <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Grid Size
            </p>
            <div className="flex gap-1.5 px-3 pb-1.5 pt-0.5">
              {GRID_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    onGridSizeChange(size)
                    setOpenMenu(null)
                  }}
                  className={`flex-1 rounded-full border py-1 text-xs font-medium ${
                    size === gridSize
                      ? 'border-ink bg-ink text-ink-inverse'
                      : 'border-hairline text-ink'
                  }`}
                >
                  {GRID_SIZE_LABELS[size]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
