import { useRef } from 'react'
import type { UserBook } from '../../types/book'

const LONG_PRESS_MS = 450
const MOVE_CANCEL_PX = 10

interface CoverTileProps {
  book: UserBook
  onClick: () => void
  /** Held still for LONG_PRESS_MS without exceeding MOVE_CANCEL_PX — enters reorder mode. */
  onLongPress?: () => void
  wiggle?: boolean
  wiggleDelayMs?: number
  /** Shows the owner's star rating as a badge on the cover (someone else's profile). */
  showRating?: boolean
  /** Shows the page-count icon/number plus a thin density line at the bottom. Off by default. */
  showPageCount?: boolean
  /** Shows the AI relevancy-match row (someone else's profile only). Off by default. */
  showRelevancy?: boolean
}

export function CoverTile({
  book,
  onClick,
  onLongPress,
  wiggle,
  wiggleDelayMs = 0,
  showRating,
  showPageCount,
  showRelevancy,
}: CoverTileProps) {
  const timerRef = useRef<number | null>(null)
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const firedRef = useRef(false)

  function clearTimer() {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (!onLongPress) return
    firedRef.current = false
    startRef.current = { x: e.clientX, y: e.clientY }
    timerRef.current = window.setTimeout(() => {
      firedRef.current = true
      onLongPress()
    }, LONG_PRESS_MS)
  }

  function handlePointerMove(e: React.PointerEvent) {
    // Movement past this threshold means the user is scrolling, not holding —
    // bail out without ever touching preventDefault, so native scroll is untouched.
    if (!startRef.current) return
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) clearTimer()
  }

  function handleClick() {
    if (firedRef.current) {
      // The long press already fired — swallow the trailing click so it doesn't
      // also open the detail sheet.
      firedRef.current = false
      return
    }
    onClick()
  }

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={clearTimer}
      onPointerCancel={clearTimer}
      onClick={handleClick}
      onContextMenu={(e) => e.preventDefault()}
      style={wiggle ? { animationDelay: `${wiggleDelayMs}ms` } : undefined}
      className={`relative aspect-[2/3] w-full select-none overflow-hidden rounded-md bg-hairline shadow-sm transition-transform [-webkit-touch-callout:none] active:scale-[0.98] ${
        wiggle ? 'animate-[wiggle_0.25s_ease-in-out_infinite]' : ''
      }`}
    >
      {book.coverUrl ? (
        // pointer-events-none so the touch target is always this button, never the
        // <img> itself — both iOS and Android only show their native long-press
        // "save/copy image" menu when the touch actually lands on an <img>/<a>.
        <img
          src={book.coverUrl}
          alt=""
          loading="lazy"
          draggable={false}
          className="pointer-events-none h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center p-2 text-center text-[11px] text-muted">
          {book.title}
        </div>
      )}
      {(showRating || showPageCount || showRelevancy) && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col">
          {showRating && book.rating != null && (
            <span className="flex items-center justify-center gap-[1px] bg-black/70 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-xs leading-none ${
                    star <= book.rating! ? 'text-white' : 'text-white/30'
                  }`}
                >
                  ★
                </span>
              ))}
            </span>
          )}
          {showPageCount && (
            <span className="flex items-center gap-1.5 bg-black/60 px-1.5 py-1">
              <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold leading-none text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3 w-3 shrink-0"
                >
                  <path d="M12 6.5c-1.5-1-3.5-1.5-5.5-1.5S3 5.3 3 5.3v13.4s2-.7 3.5-.7 4 .5 5.5 1.5m0-13v13m0-13c1.5-1 3.5-1.5 5.5-1.5S21 5.3 21 5.3v13.4s-2-.7-3.5-.7-4 .5-5.5 1.5" />
                </svg>
                {book.pageCount || '—'}
              </span>
              {/* Density bar: full width at 1000 pages, half at 500, and so on. */}
              <span className="h-[2px] flex-1 bg-white/20">
                <span
                  className="block h-full bg-white/90"
                  style={{ width: `${Math.min(100, ((book.pageCount ?? 0) / 1000) * 100)}%` }}
                />
              </span>
            </span>
          )}
          {showRelevancy && book.propensityScore != null && (
            <span className="bg-black/60 px-1.5 py-1 text-[10px] font-semibold leading-none text-white">
              {book.propensityScore}% Match
            </span>
          )}
        </div>
      )}
    </button>
  )
}
