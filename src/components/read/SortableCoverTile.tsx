import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CoverTile } from './CoverTile'
import type { UserBook } from '../../types/book'

/**
 * Drag listeners go on the whole tile (no separate grip icon, to keep the grid
 * pure cover art) — dnd-kit's press-and-hold activation constraint is what lets a
 * quick tap still open the detail modal instead of starting a drag. `touch-pan-y`
 * (rather than `touch-none`) keeps native vertical scrolling working while a touch
 * is still pending activation; only once a drag actually starts does dnd-kit take
 * over the gesture and block scrolling.
 */
export function SortableCoverTile({ book, onClick }: { book: UserBook; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: book.googleVolumeId,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={`touch-pan-y ${isDragging ? 'z-10 opacity-80' : ''}`}
    >
      <CoverTile book={book} onClick={onClick} />
    </div>
  )
}
