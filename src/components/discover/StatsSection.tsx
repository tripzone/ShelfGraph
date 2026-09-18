import { Link } from 'react-router-dom'
import { useLibrary } from '../../hooks/useLibrary'
import { hasReadingActivityData, ReadingActivityChart } from './ReadingActivityChart'

export function StatsSection({ uid }: { uid: string | undefined }) {
  const { books, loading } = useLibrary(uid)

  return (
    <section className="mx-auto max-w-3xl px-3 py-3 sm:px-4">
      <h2 className="px-1 text-sm font-semibold text-ink">Stats</h2>

      {loading ? (
        <p className="mt-2 px-1 text-sm text-muted">Loading…</p>
      ) : (
        <div className="mt-2 flex items-center gap-3">
          <p className="shrink-0 whitespace-nowrap text-sm text-muted">
            <span className="text-lg font-semibold text-ink">{books.length}</span> Books read
          </p>
          {hasReadingActivityData(books) && (
            <>
              <span className="h-8 w-px shrink-0 bg-hairline" />
              <ReadingActivityChart books={books} />
            </>
          )}
          <Link
            to="/discover/stats"
            aria-label="See detailed stats"
            className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink"
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
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        </div>
      )}
    </section>
  )
}
