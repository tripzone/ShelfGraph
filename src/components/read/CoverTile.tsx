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
}

export function CoverTile({ book, onClick, onLongPress, wiggle, wiggleDelayMs = 0 }: CoverTileProps) {
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
      style={wiggle ? { animationDelay: `${wiggleDelayMs}ms` } : undefined}
      className={`aspect-[2/3] w-full overflow-hidden rounded-md bg-hairline shadow-sm transition-transform active:scale-[0.98] ${
        wiggle ? 'animate-[wiggle_0.25s_ease-in-out_infinite]' : ''
      }`}
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
