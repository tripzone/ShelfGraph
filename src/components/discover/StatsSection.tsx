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
        </div>
      )}

      <Link
        to="/discover/stats"
        className="mt-2 inline-block px-1 text-sm font-medium text-ink underline underline-offset-2"
      >
        See detailed stats
      </Link>
    </section>
  )
}
