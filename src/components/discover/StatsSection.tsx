import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLibrary } from '../../hooks/useLibrary'

export function StatsSection({ uid }: { uid: string | undefined }) {
  const { books, loading } = useLibrary(uid)

  const { totalBooks, totalPages } = useMemo(
    () => ({
      totalBooks: books.length,
      totalPages: books.reduce((sum, b) => sum + (b.pageCount ?? 0), 0),
    }),
    [books],
  )

  return (
    <section className="mx-auto max-w-3xl px-3 py-3 sm:px-4">
      <h2 className="px-1 text-sm font-semibold text-ink">Stats</h2>

      {loading ? (
        <p className="mt-2 px-1 text-sm text-muted">Loading…</p>
      ) : (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-hairline p-4">
            <p className="text-2xl font-semibold text-ink">{totalBooks}</p>
            <p className="mt-0.5 text-xs text-muted">Books read</p>
          </div>
          <div className="rounded-xl border border-hairline p-4">
            <p className="text-2xl font-semibold text-ink">{totalPages.toLocaleString()}</p>
            <p className="mt-0.5 text-xs text-muted">Pages read</p>
          </div>
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
