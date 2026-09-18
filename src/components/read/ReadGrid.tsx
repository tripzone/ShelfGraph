import { useMemo, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable'
import { CoverTile } from './CoverTile'
import { SortableCoverTile } from './SortableCoverTile'
import { ReadToolbar, type SortDirection, type SortMode } from './ReadToolbar'
import { DetailModal } from '../shared/DetailModal'
import { useLibrary } from '../../hooks/useLibrary'
import { useLibraryActions } from '../../hooks/useLibraryActions'
import { useCatalogueGenres } from '../../hooks/useCatalogueGenres'
import { useGridSize, type GridSize } from '../../hooks/useGridSize'
import type { BookFormat, UserBook } from '../../types/book'

const GRID_BASE_CLASSES = 'mx-auto grid max-w-3xl gap-1 px-1 pb-24 sm:gap-2 sm:px-4'
const GROUP_GRID_BASE_CLASSES = 'grid gap-1 sm:gap-2'

const GRID_SIZE_CLASSES: Record<GridSize, string> = {
  xs: 'grid-cols-5 sm:grid-cols-7',
  s: 'grid-cols-4 sm:grid-cols-5',
  m: 'grid-cols-3 sm:grid-cols-4',
  l: 'grid-cols-2 sm:grid-cols-3',
}

function dateKey(book: UserBook): number {
  if (!book.finishedYear) return -Infinity
  return book.finishedYear * 12 + (book.finishedMonth ?? 0)
}

export function ReadGrid({
  uid,
  readOnly = false,
}: {
  uid: string | undefined
  /** Viewing someone else's public profile — no edits, no drag, view/sort/filter only. */
  readOnly?: boolean
}) {
  const { books, loading, rateBook, reorder } = useLibrary(uid)
  const { changeCover, resetCover, setFinishedDate, setFormat, removeBook, updateDetails } =
    useLibraryActions(uid)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('custom')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [genreFilter, setGenreFilter] = useState<Set<string>>(new Set())
  const [formatFilter, setFormatFilter] = useState<Set<BookFormat>>(new Set())
  const [reorderMode, setReorderMode] = useState(false)
  const { gridSize, setGridSize } = useGridSize()
  const gridClasses = `${GRID_BASE_CLASSES} ${GRID_SIZE_CLASSES[gridSize]}`
  const groupGridClasses = `${GROUP_GRID_BASE_CLASSES} ${GRID_SIZE_CLASSES[gridSize]}`
  const catalogueGenres = useCatalogueGenres(uid)

  const selected = books.find((b) => b.googleVolumeId === selectedId) ?? null

  const genres = useMemo(
    () => Array.from(new Set(books.flatMap((b) => b.categories))).sort(),
    [books],
  )

  const filtersActive = genreFilter.size > 0 || formatFilter.size > 0

  function handleSortModeChange(mode: SortMode) {
    if (mode === sortMode) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortMode(mode)
    setSortDirection('asc')
  }

  const visibleBooks = useMemo(() => {
    let list = books
    if (genreFilter.size > 0) {
      list = list.filter((b) => b.categories.some((c) => genreFilter.has(c)))
    }
    if (formatFilter.size > 0) {
      list = list.filter((b) => b.format && formatFilter.has(b.format))
    }

    const dir = sortDirection === 'asc' ? 1 : -1
    const sorted = [...list]
    switch (sortMode) {
      case 'title':
        sorted.sort((a, b) => dir * a.title.localeCompare(b.title))
        break
      case 'date':
        sorted.sort((a, b) => dir * (dateKey(a) - dateKey(b)) || a.title.localeCompare(b.title))
        break
      case 'genre':
        sorted.sort(
          (a, b) =>
            dir * (a.categories[0] ?? '').localeCompare(b.categories[0] ?? '') ||
            a.title.localeCompare(b.title),
        )
        break
      case 'custom':
      default:
        // Ties (shared default `order`) fall back to add order until the user drags.
        sorted.sort((a, b) => a.order - b.order || a.addedAt.localeCompare(b.addedAt))
    }
    return sorted
  }, [books, sortMode, sortDirection, genreFilter, formatFilter])

  // Genre headings only make sense once the list is grouped/sorted by genre — grouping
  // by iteration order works because visibleBooks is already sorted (genre, then title).
  const genreGroups = useMemo(() => {
    if (sortMode !== 'genre') return null
    const groups = new Map<string, UserBook[]>()
    for (const book of visibleBooks) {
      const key = book.categories[0] || 'Uncategorized'
      const group = groups.get(key)
      if (group) group.push(book)
      else groups.set(key, [book])
    }
    return Array.from(groups.entries())
  }, [visibleBooks, sortMode])

  const reorderCapable = !readOnly && sortMode === 'custom' && !filtersActive
  const dragEnabled = reorderCapable && reorderMode

  // Entering reorder mode is its own long-press gesture (handled in CoverTile,
  // without ever touching touch-action or preventDefault, so normal scrolling
  // is never at odds with it). Once inside reorder mode, a plain small-distance
  // constraint is enough to tell a drag from a tap that exits the mode.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function handleTileTap(book: UserBook) {
    if (reorderMode) {
      setReorderMode(false)
      return
    }
    setSelectedId(book.googleVolumeId)
  }

  const selectedIndex = selectedId
    ? visibleBooks.findIndex((b) => b.googleVolumeId === selectedId)
    : -1

  function handleNavigate(direction: -1 | 1) {
    if (selectedIndex === -1) return
    const nextBook = visibleBooks[selectedIndex + direction]
    if (nextBook) setSelectedId(nextBook.googleVolumeId)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = visibleBooks.findIndex((b) => b.googleVolumeId === active.id)
    const newIndex = visibleBooks.findIndex((b) => b.googleVolumeId === over.id)
    const reordered = arrayMove(visibleBooks, oldIndex, newIndex)
    reorder(reordered.map((b) => b.googleVolumeId))
  }

  if (loading) {
    return <p className="px-4 py-10 text-center text-sm text-muted">Loading your shelf…</p>
  }

  return (
    <>
      <ReadToolbar
        sortMode={sortMode}
        sortDirection={sortDirection}
        onSortModeChange={handleSortModeChange}
        genres={genres}
        genreFilter={genreFilter}
        onGenreFilterChange={setGenreFilter}
        formatFilter={formatFilter}
        onFormatFilterChange={setFormatFilter}
        gridSize={gridSize}
        onGridSizeChange={setGridSize}
        reorderMode={reorderMode}
        onExitReorderMode={() => setReorderMode(false)}
        uid={readOnly ? undefined : uid}
      />

      {books.length === 0 ? (
        <div className="px-4 py-16 text-center">
          <p className="text-sm text-muted">
            {readOnly
              ? 'Nothing here yet.'
              : 'Nothing finished yet. Search for a book above and mark it as read.'}
          </p>
        </div>
      ) : visibleBooks.length === 0 ? (
        <div className="px-4 py-16 text-center">
          <p className="text-sm text-muted">No books match the current filters.</p>
        </div>
      ) : dragEnabled ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={visibleBooks.map((b) => b.googleVolumeId)}
            strategy={rectSortingStrategy}
          >
            <div className={gridClasses}>
              {visibleBooks.map((book, index) => (
                <SortableCoverTile
                  key={book.googleVolumeId}
                  book={book}
                  onClick={() => handleTileTap(book)}
                  wiggleDelayMs={(index % 4) * 30}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : genreGroups ? (
        <div className="mx-auto max-w-3xl px-1 pb-24 sm:px-4">
          {genreGroups.map(([genre, groupBooks]) => (
            <div key={genre} className="mb-6 last:mb-0">
              <h3 className="mb-1.5 px-1 text-sm font-semibold text-ink sm:px-1">{genre}</h3>
              <div className={groupGridClasses}>
                {groupBooks.map((book) => (
                  <CoverTile
                    key={book.googleVolumeId}
                    book={book}
                    onClick={() => handleTileTap(book)}
                    showRating={readOnly}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={gridClasses}>
          {visibleBooks.map((book) => (
            <CoverTile
              key={book.googleVolumeId}
              book={book}
              onClick={() => handleTileTap(book)}
              onLongPress={reorderCapable ? () => setReorderMode(true) : undefined}
              showRating={readOnly}
            />
          ))}
        </div>
      )}

      {selected && (
        <DetailModal
          book={selected}
          onClose={() => setSelectedId(null)}
          onRate={readOnly ? undefined : (rating) => rateBook(selected.googleVolumeId, rating)}
          onChangeCover={readOnly ? undefined : (file) => changeCover(selected.googleVolumeId, file)}
          onResetCover={
            readOnly ? undefined : () => resetCover(selected.googleVolumeId, selected.defaultCoverUrl)
          }
          onSetFinishedDate={
            readOnly
              ? undefined
              : (year, month) => setFinishedDate(selected.googleVolumeId, year, month)
          }
          onSetFormat={readOnly ? undefined : (format) => setFormat(selected.googleVolumeId, format)}
          onSaveDetails={
            readOnly ? undefined : (details) => updateDetails(selected.googleVolumeId, details)
          }
          genres={catalogueGenres}
          onPrevious={selectedIndex > 0 ? () => handleNavigate(-1) : undefined}
          onNext={
            selectedIndex !== -1 && selectedIndex < visibleBooks.length - 1
              ? () => handleNavigate(1)
              : undefined
          }
          footer={
            readOnly ? undefined : (
              <button
                onClick={async () => {
                  await removeBook(selected.googleVolumeId)
                  setSelectedId(null)
                }}
                aria-label="Remove from Read"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline text-ink"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M3 6h18" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
              </button>
            )
          }
        />
      )}
    </>
  )
}
