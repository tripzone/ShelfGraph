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
import { ReadToolbar, type SortMode } from './ReadToolbar'
import { DetailModal } from '../shared/DetailModal'
import { useLibrary } from '../../hooks/useLibrary'
import { useLibraryActions } from '../../hooks/useLibraryActions'
import { useGridSize, type GridSize } from '../../hooks/useGridSize'
import type { BookFormat, UserBook } from '../../types/book'

const GRID_BASE_CLASSES = 'mx-auto grid max-w-3xl gap-1 px-1 pb-24 sm:gap-2 sm:px-4'

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

export function ReadGrid({ uid }: { uid: string | undefined }) {
  const { books, loading, rateBook, reorder } = useLibrary(uid)
  const { changeCover, resetCover, setFinishedDate, setFormat, removeBook } =
    useLibraryActions(uid)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('custom')
  const [genreFilter, setGenreFilter] = useState<Set<string>>(new Set())
  const [formatFilter, setFormatFilter] = useState<Set<BookFormat>>(new Set())
  const { gridSize, setGridSize } = useGridSize()
  const gridClasses = `${GRID_BASE_CLASSES} ${GRID_SIZE_CLASSES[gridSize]}`

  const selected = books.find((b) => b.googleVolumeId === selectedId) ?? null

  const genres = useMemo(
    () => Array.from(new Set(books.flatMap((b) => b.categories))).sort(),
    [books],
  )

  const filtersActive = genreFilter.size > 0 || formatFilter.size > 0

  const visibleBooks = useMemo(() => {
    let list = books
    if (genreFilter.size > 0) {
      list = list.filter((b) => b.categories.some((c) => genreFilter.has(c)))
    }
    if (formatFilter.size > 0) {
      list = list.filter((b) => b.format && formatFilter.has(b.format))
    }

    const sorted = [...list]
    switch (sortMode) {
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'date':
        sorted.sort((a, b) => dateKey(b) - dateKey(a) || a.title.localeCompare(b.title))
        break
      case 'genre':
        sorted.sort(
          (a, b) =>
            (a.categories[0] ?? '').localeCompare(b.categories[0] ?? '') ||
            a.title.localeCompare(b.title),
        )
        break
      case 'custom':
      default:
        // Ties (shared default `order`) fall back to add order until the user drags.
        sorted.sort((a, b) => a.order - b.order || a.addedAt.localeCompare(b.addedAt))
    }
    return sorted
  }, [books, sortMode, genreFilter, formatFilter])

  const dragEnabled = sortMode === 'custom' && !filtersActive

  // Require a brief press-and-hold before a drag starts, so a quick tap or a
  // scroll/refresh gesture that grazes a tile doesn't get mistaken for a reorder.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

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
        onSortModeChange={setSortMode}
        genres={genres}
        genreFilter={genreFilter}
        onGenreFilterChange={setGenreFilter}
        formatFilter={formatFilter}
        onFormatFilterChange={setFormatFilter}
        gridSize={gridSize}
        onGridSizeChange={setGridSize}
      />

      {books.length === 0 ? (
        <div className="px-4 py-16 text-center">
          <p className="text-sm text-muted">
            Nothing finished yet. Search for a book above and mark it as read.
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
              {visibleBooks.map((book) => (
                <SortableCoverTile
                  key={book.googleVolumeId}
                  book={book}
                  onClick={() => setSelectedId(book.googleVolumeId)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className={gridClasses}>
          {visibleBooks.map((book) => (
            <CoverTile
              key={book.googleVolumeId}
              book={book}
              onClick={() => setSelectedId(book.googleVolumeId)}
            />
          ))}
        </div>
      )}

      {selected && (
        <DetailModal
          book={selected}
          onClose={() => setSelectedId(null)}
          onRate={(rating) => rateBook(selected.googleVolumeId, rating)}
          onChangeCover={(file) => changeCover(selected.googleVolumeId, file)}
          onResetCover={() => resetCover(selected.googleVolumeId, selected.defaultCoverUrl)}
          onSetFinishedDate={(year, month) => setFinishedDate(selected.googleVolumeId, year, month)}
          onSetFormat={(format) => setFormat(selected.googleVolumeId, format)}
          footer={
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
          }
        />
      )}
    </>
  )
}
