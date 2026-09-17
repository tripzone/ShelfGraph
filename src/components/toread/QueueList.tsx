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

export function QueueList({ uid }: { uid: string | undefined }) {
  const { books, loading, reorder } = useQueue(uid)
  const { moveToRead, removeBook, changeCover, resetCover } = useLibraryActions(uid)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = books.find((b) => b.googleVolumeId === selectedId) ?? null

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
          footer={
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await removeBook(selected.googleVolumeId)
                  setSelectedId(null)
                }}
                className="flex-1 rounded-full border border-hairline py-3 text-sm font-semibold text-ink"
              >
                Remove
              </button>
              <button
                onClick={async () => {
                  await moveToRead(selected.googleVolumeId)
                  setSelectedId(null)
                }}
                className="flex-1 rounded-full bg-ink py-3 text-sm font-semibold text-ink-inverse"
              >
                ✓ Mark as Read
              </button>
            </div>
          }
        />
      )}
    </>
  )
}
