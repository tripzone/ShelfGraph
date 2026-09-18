import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useLibrary } from '../../hooks/useLibrary'
import { hasReadingActivityData, ReadingActivityChart } from './ReadingActivityChart'

function BooksIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M3 4h4v16H3zM10 4h4v16h-4z" />
      <path d="M17.3 5.4l3.9.8-3 14.7-3.9-.8z" />
    </svg>
  )
}

function PagesIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M12 6.5c-1.5-1-3.5-1.5-5.5-1.5S3 5.3 3 5.3v13.4s2-.7 3.5-.7 4 .5 5.5 1.5m0-13v13m0-13c1.5-1 3.5-1.5 5.5-1.5S21 5.3 21 5.3v13.4s-2-.7-3.5-.7-4 .5-5.5 1.5" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  )
}

function StatTile({
  icon,
  value,
  label,
}: {
  icon: ReactNode
  value: string | number
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl bg-canvas px-2 py-3 text-center">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-accent">
        {icon}
      </span>
      <span className="text-lg font-bold leading-none text-ink">{value}</span>
      <span className="text-[11px] leading-none text-muted">{label}</span>
    </div>
  )
}

export function StatsSection({ uid }: { uid: string | undefined }) {
  const { books, loading } = useLibrary(uid)
  const currentYear = new Date().getFullYear()
  const totalPages = books.reduce((sum, b) => sum + (b.pageCount ?? 0), 0)
  const readThisYear = books.filter((b) => b.finishedYear === currentYear).length

  return (
    <section className="mx-auto max-w-3xl px-3 py-3 sm:px-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-ink">Stats</h2>
        <Link
          to="/discover/stats"
          className="flex items-center gap-0.5 text-xs font-medium text-muted transition-colors hover:text-ink"
        >
          Details
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
      </div>

      {loading ? (
        <p className="mt-2 px-1 text-sm text-muted">Loading…</p>
      ) : (
        <div className="mt-2 rounded-2xl border border-hairline bg-surface p-4 shadow-sm">
          <div className="grid grid-cols-3 gap-2">
            <StatTile icon={<BooksIcon />} value={books.length} label="Books read" />
            <StatTile icon={<PagesIcon />} value={totalPages.toLocaleString()} label="Pages read" />
            <StatTile icon={<CalendarIcon />} value={readThisYear} label={`In ${currentYear}`} />
          </div>

          {hasReadingActivityData(books) && (
            <div className="mt-4 border-t border-hairline pt-3">
              <ReadingActivityChart books={books} />
            </div>
          )}
        </div>
      )}
    </section>
  )
}
