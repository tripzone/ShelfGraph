import { useState } from 'react'
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
import { useQueue } from '../../hooks/useQueue'
import { useLibraryActions } from '../../hooks/useLibraryActions'
import { useCatalogueGenres } from '../../hooks/useCatalogueGenres'

const GRID_CLASSES = 'mx-auto grid max-w-3xl grid-cols-3 gap-1 px-1 pb-24 sm:grid-cols-4 sm:gap-2 sm:px-4'

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
  const selected = books.find((b) => b.googleVolumeId === selectedId) ?? null
  const selectedIndex = selectedId ? books.findIndex((b) => b.googleVolumeId === selectedId) : -1

  function handleNavigate(direction: -1 | 1) {
    if (selectedIndex === -1) return
    const nextBook = books[selectedIndex + direction]
    if (nextBook) setSelectedId(nextBook.googleVolumeId)
  }

  // Reorder mode mirrors the Read grid: a long-press on a tile (handled in QueueTile,
  // without ever touching touch-action or preventDefault) enters reorder mode, so a
  // 2D drag is never ambiguous with vertical scrolling.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function handleTileTap(book: (typeof books)[number]) {
    if (reorderMode) {
      setReorderMode(false)
      return
    }
    setSelectedId(book.googleVolumeId)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = books.findIndex((b) => b.googleVolumeId === active.id)
    const newIndex = books.findIndex((b) => b.googleVolumeId === over.id)
    const reordered = arrayMove(books, oldIndex, newIndex)
    reorder(reordered.map((b) => b.googleVolumeId))
  }

  if (loading) {
    return <p className="px-4 py-10 text-center text-sm text-muted">Loading your queue…</p>
  }

  if (books.length === 0) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-sm text-muted">
          {readOnly ? 'Nothing here yet.' : 'Your queue is empty. Search for a book above and add it.'}
        </p>
      </div>
    )
  }

  return (
    <>
      {reorderMode && (
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-1">
          <p className="text-xs text-muted">Drag covers to reorder</p>
          <button
            type="button"
            onClick={() => setReorderMode(false)}
            className="rounded-full border border-hairline px-3 py-1 text-xs font-semibold text-ink"
          >
            Done
          </button>
        </div>
      )}

      {readOnly ? (
        <div className={GRID_CLASSES}>
          {books.map((book, index) => (
            <QueueTile
              key={book.googleVolumeId}
              book={book}
              position={index + 1}
              onClick={() => setSelectedId(book.googleVolumeId)}
            />
          ))}
        </div>
      ) : reorderMode ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={books.map((b) => b.googleVolumeId)}
            strategy={rectSortingStrategy}
          >
            <div className={GRID_CLASSES}>
              {books.map((book, index) => (
                <SortableQueueTile
                  key={book.googleVolumeId}
                  book={book}
                  position={index + 1}
                  onClick={() => handleTileTap(book)}
                  wiggleDelayMs={(index % 4) * 30}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className={GRID_CLASSES}>
          {books.map((book, index) => (
            <QueueTile
              key={book.googleVolumeId}
              book={book}
              position={index + 1}
              onClick={() => handleTileTap(book)}
              onLongPress={() => setReorderMode(true)}
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
            selectedIndex !== -1 && selectedIndex < books.length - 1
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
