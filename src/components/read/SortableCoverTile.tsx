import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CoverTile } from './CoverTile'
import type { UserBook } from '../../types/book'

/**
 * Only rendered once the grid is already in reorder mode (entered via a separate
 * long-press gesture on the plain, scrollable CoverTile — see ReadGrid), so it's
 * safe to fully claim the touch gesture here with `touch-none`: dnd-kit's own
 * auto-scroll-near-edges covers panning while an item is actively dragged.
 */
export function SortableCoverTile({
  book,
  onClick,
  wiggleDelayMs,
}: {
  book: UserBook
  onClick: () => void
  wiggleDelayMs: number
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: book.googleVolumeId,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={`touch-none ${isDragging ? 'z-10 opacity-80' : ''}`}
    >
      <CoverTile book={book} onClick={onClick} wiggle={!isDragging} wiggleDelayMs={wiggleDelayMs} />
    </div>
  )
}
