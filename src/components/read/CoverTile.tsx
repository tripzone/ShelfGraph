import type { UserBook } from '../../types/book'

export function CoverTile({ book, onClick }: { book: UserBook; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="aspect-[2/3] w-full overflow-hidden rounded-md bg-hairline shadow-sm transition-transform active:scale-[0.98]"
    >
      {book.coverUrl ? (
        <img
          src={book.coverUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center p-2 text-center text-[11px] text-muted">
          {book.title}
        </div>
      )}
    </button>
  )
}
