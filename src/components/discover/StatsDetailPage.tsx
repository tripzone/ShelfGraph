import { Link } from 'react-router-dom'

/** Placeholder for deeper reading-stats breakdowns — formulas TBD, same as the LLM scoring stub. */
export function StatsDetailPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-lg font-semibold text-ink">Detailed stats</h1>
      <p className="mt-2 text-sm text-muted">
        More detailed stats — reading pace, genre breakdown, favorite authors, and more — are on
        the way.
      </p>
      <Link
        to="/discover"
        className="mt-4 inline-block text-sm font-medium text-ink underline underline-offset-2"
      >
        Back to Discover
      </Link>
    </div>
  )
}
