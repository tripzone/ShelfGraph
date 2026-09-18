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
import { QueueTile } from './QueueTile'
import { SortableQueueTile } from './SortableQueueTile'
import { DetailModal } from '../shared/DetailModal'
import { LibraryToolbar, type SortDirection, type SortMode } from '../shared/LibraryToolbar'
import { useQueue } from '../../hooks/useQueue'
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

export function QueueList({
  uid,
  readOnly = false,
}: {
  uid: string | undefined
  /** Viewing someone else's public profile — no edits, no drag, view only. */
  readOnly?: boolean
}) {
  const { books, loading, reorder } = useQueue(uid)
  const { moveToRead, removeBook, changeCover, resetCover, updateDetails } = useLibraryActions(uid)
  const catalogueGenres = useCatalogueGenres(uid)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reorderMode, setReorderMode] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>('custom')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [genreFilter, setGenreFilter] = useState<Set<string>>(new Set())
  const [formatFilter, setFormatFilter] = useState<Set<BookFormat>>(new Set())
  const { gridSize, setGridSize } = useGridSize()
  const gridClasses = `${GRID_BASE_CLASSES} ${GRID_SIZE_CLASSES[gridSize]}`
  const groupGridClasses = `${GROUP_GRID_BASE_CLASSES} ${GRID_SIZE_CLASSES[gridSize]}`

  // Position badges always reflect each book's place in the actual reading queue,
  // even while the grid below is displayed sorted or filtered a different way.
  const queuePositions = useMemo(() => {
    const map = new Map<string, number>()
    books.forEach((b, i) => map.set(b.googleVolumeId, i + 1))
    return map
  }, [books])

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
        sorted.sort((a, b) => dir * a.addedAt.localeCompare(b.addedAt))
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
        sorted.sort((a, b) => a.order - b.order)
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

  const selected = books.find((b) => b.googleVolumeId === selectedId) ?? null
  const selectedIndex = selectedId
    ? visibleBooks.findIndex((b) => b.googleVolumeId === selectedId)
    : -1

  function handleNavigate(direction: -1 | 1) {
    if (selectedIndex === -1) return
    const nextBook = visibleBooks[selectedIndex + direction]
    if (nextBook) setSelectedId(nextBook.googleVolumeId)
  }

  // Reorder mode mirrors the Read grid: a long-press on a tile (handled in QueueTile,
  // without ever touching touch-action or preventDefault) enters reorder mode, so a
  // 2D drag is never ambiguous with vertical scrolling.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function handleTileTap(book: UserBook) {
    if (reorderMode) {
      setReorderMode(false)
      return
    }
    setSelectedId(book.googleVolumeId)
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
    return <p className="px-4 py-10 text-center text-sm text-muted">Loading your queue…</p>
  }

  return (
    <>
      <LibraryToolbar
        sortMode={sortMode}
        sortDirection={sortDirection}
        onSortModeChange={handleSortModeChange}
        dateSortLabel="Date Added"
        customSortLabel="Ranked"
        sortModes={['custom', 'genre', 'title']}
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
            {readOnly ? 'Nothing here yet.' : 'Your queue is empty. Search for a book above and add it.'}
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
                <SortableQueueTile
                  key={book.googleVolumeId}
                  book={book}
                  position={queuePositions.get(book.googleVolumeId) ?? index + 1}
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
                  <QueueTile
                    key={book.googleVolumeId}
                    book={book}
                    position={queuePositions.get(book.googleVolumeId) ?? 0}
                    onClick={() => handleTileTap(book)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={gridClasses}>
          {visibleBooks.map((book, index) => (
            <QueueTile
              key={book.googleVolumeId}
              book={book}
              position={queuePositions.get(book.googleVolumeId) ?? index + 1}
              onClick={() => handleTileTap(book)}
              onLongPress={reorderCapable ? () => setReorderMode(true) : undefined}
            />
          ))}
        </div>
      )}

      {selected && (
        <DetailModal
          book={selected}
          onClose={() => setSelectedId(null)}
          onChangeCover={readOnly ? undefined : (file) => changeCover(selected.googleVolumeId, file)}
          onResetCover={
            readOnly ? undefined : () => resetCover(selected.googleVolumeId, selected.defaultCoverUrl)
          }
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
          primaryAction={
            readOnly ? undefined : (
              <button
                onClick={async () => {
                  await moveToRead(selected.googleVolumeId)
                  setSelectedId(null)
                }}
                className="w-full rounded-full border border-hairline py-3 text-sm font-semibold text-ink"
              >
                ✓ Mark as Read
              </button>
            )
          }
          footer={
            readOnly ? undefined : (
              <button
                onClick={async () => {
                  await removeBook(selected.googleVolumeId)
                  setSelectedId(null)
                }}
                aria-label="Remove from Queue"
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
