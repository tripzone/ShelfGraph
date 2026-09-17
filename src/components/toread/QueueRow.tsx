import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { UserBook } from '../../types/book'

export function QueueRow({ book, onClick }: { book: UserBook; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: book.googleVolumeId,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 border-b border-hairline bg-surface px-2 py-2 ${
        isDragging ? 'z-10 opacity-90 shadow-md' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="flex h-8 w-6 shrink-0 touch-none items-center justify-center text-muted"
      >
        ⠿
      </button>

      <button onClick={onClick} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <div className="h-12 w-8 shrink-0 overflow-hidden rounded bg-hairline">
          {book.coverUrl && (
            <img src={book.coverUrl} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{book.title}</span>
        <span className="shrink-0 text-xs text-muted">
          {book.pageCount ? `${book.pageCount}p` : '—'}
        </span>
        {book.propensityScore != null ? (
          <span className="shrink-0 rounded-full bg-accent-soft px-2 py-1 text-xs font-semibold text-accent">
            {book.propensityScore}% Match
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-canvas px-2 py-1 text-xs text-muted">
            Scoring…
          </span>
        )}
      </button>
    </div>
  )
}
