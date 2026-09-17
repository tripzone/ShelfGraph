import { useState } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { QueueRow } from './QueueRow'
import { DetailModal } from '../shared/DetailModal'
import { useQueue } from '../../hooks/useQueue'
import { useLibraryActions } from '../../hooks/useLibraryActions'
import { useCatalogueGenres } from '../../hooks/useCatalogueGenres'

export function QueueList({ uid }: { uid: string | undefined }) {
  const { books, loading, reorder } = useQueue(uid)
  const { moveToRead, removeBook, changeCover, resetCover, updateDetails } = useLibraryActions(uid)
  const catalogueGenres = useCatalogueGenres(uid)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = books.find((b) => b.googleVolumeId === selectedId) ?? null
  const selectedIndex = selectedId ? books.findIndex((b) => b.googleVolumeId === selectedId) : -1

  function handleNavigate(direction: -1 | 1) {
    if (selectedIndex === -1) return
    const nextBook = books[selectedIndex + direction]
    if (nextBook) setSelectedId(nextBook.googleVolumeId)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

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
          Your queue is empty. Search for a book above and add it.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="mx-auto max-w-3xl pb-24">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={books.map((b) => b.googleVolumeId)}
            strategy={verticalListSortingStrategy}
          >
            {books.map((book) => (
              <QueueRow
                key={book.googleVolumeId}
                book={book}
                onClick={() => setSelectedId(book.googleVolumeId)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {selected && (
        <DetailModal
          book={selected}
          onClose={() => setSelectedId(null)}
          onChangeCover={(file) => changeCover(selected.googleVolumeId, file)}
          onResetCover={() => resetCover(selected.googleVolumeId, selected.defaultCoverUrl)}
          onSaveDetails={(details) => updateDetails(selected.googleVolumeId, details)}
          genres={catalogueGenres}
          onPrevious={selectedIndex > 0 ? () => handleNavigate(-1) : undefined}
          onNext={
            selectedIndex !== -1 && selectedIndex < books.length - 1
              ? () => handleNavigate(1)
              : undefined
          }
          primaryAction={
            <button
              onClick={async () => {
                await moveToRead(selected.googleVolumeId)
                setSelectedId(null)
              }}
              className="w-full rounded-full border border-hairline py-3 text-sm font-semibold text-ink"
            >
              ✓ Mark as Read
            </button>
          }
          footer={
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
          }
        />
      )}
    </>
  )
}
