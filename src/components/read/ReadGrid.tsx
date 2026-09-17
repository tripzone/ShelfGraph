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
import type { BookFormat, UserBook } from '../../types/book'

const GRID_CLASSES =
  'mx-auto grid max-w-3xl grid-cols-3 gap-1 px-1 pb-24 sm:grid-cols-4 sm:gap-2 sm:px-4'

function dateKey(book: UserBook): number {
  if (!book.finishedYear) return -Infinity
  return book.finishedYear * 12 + (book.finishedMonth ?? 0)
}

export function ReadGrid({ uid }: { uid: string | undefined }) {
  const { books, loading, rateBook, reorder } = useLibrary(uid)
  const { changeCover, resetCover, setFinishedDate, setFormat } = useLibraryActions(uid)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('custom')
  const [genreFilter, setGenreFilter] = useState<Set<string>>(new Set())
  const [formatFilter, setFormatFilter] = useState<Set<BookFormat>>(new Set())

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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

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
      {books.length > 0 && (
        <ReadToolbar
          sortMode={sortMode}
          onSortModeChange={setSortMode}
          genres={genres}
          genreFilter={genreFilter}
          onGenreFilterChange={setGenreFilter}
          formatFilter={formatFilter}
          onFormatFilterChange={setFormatFilter}
        />
      )}

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
            <div className={GRID_CLASSES}>
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
        <div className={GRID_CLASSES}>
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
        />
      )}
    </>
  )
}
