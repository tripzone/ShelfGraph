import type { RecommendedBook } from '../../types/book'

export function RecCard({ book, onClick }: { book: RecommendedBook; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left">
      <div className="aspect-[2/3] w-full overflow-hidden rounded-md bg-hairline shadow-sm transition-transform active:scale-[0.98]">
        {book.coverUrl && (
          <img src={book.coverUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        )}
      </div>
      <p className="mt-1.5 truncate text-center text-[11px] text-muted">
        ⭐ {book.score} &nbsp;|&nbsp; 📖 {book.pageCount ?? '—'} &nbsp;|&nbsp; 🏷️{' '}
        {book.categories[0] ?? 'General'}
      </p>
    </button>
  )
}
