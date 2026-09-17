import { useRef, useState } from 'react'
import { useLibraryActions } from '../../hooks/useLibraryActions'
import { useLibraryIndex } from '../../hooks/useLibraryIndex'
import { useUiStore } from '../../store/uiStore'

const DRAG_EXPAND_THRESHOLD = 60
const DRAG_COLLAPSE_THRESHOLD = 80
const DRAG_CLOSE_THRESHOLD = 120

export function BottomSheet({ uid }: { uid: string | undefined }) {
  const sheetStage = useUiStore((s) => s.sheetStage)
  const sheetBook = useUiStore((s) => s.sheetBook)
  const expandSheet = useUiStore((s) => s.expandSheet)
  const collapseSheet = useUiStore((s) => s.collapseSheet)
  const closeSheet = useUiStore((s) => s.closeSheet)
  const pushToast = useUiStore((s) => s.pushToast)

  const { byId } = useLibraryIndex(uid)
  const { addToQueue, markAsRead, removeBook } = useLibraryActions(uid)

  const [dragY, setDragY] = useState(0)
  const dragState = useRef<{ startY: number; dragging: boolean }>({ startY: 0, dragging: false })

  if (sheetStage === 'closed' || !sheetBook) return null

  const existing = byId.get(sheetBook.googleVolumeId)

  function onPointerDown(e: React.PointerEvent) {
    dragState.current = { startY: e.clientY, dragging: true }
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragState.current.dragging) return
    setDragY(e.clientY - dragState.current.startY)
  }

  function onPointerUp() {
    dragState.current.dragging = false
    if (sheetStage === 'peek') {
      if (dragY < -DRAG_EXPAND_THRESHOLD) expandSheet()
      else if (dragY > DRAG_CLOSE_THRESHOLD) closeSheet()
    } else if (sheetStage === 'full') {
      if (dragY > DRAG_COLLAPSE_THRESHOLD) collapseSheet()
    }
    setDragY(0)
  }

  async function handleAddToQueue() {
    await addToQueue(sheetBook!)
    closeSheet()
    pushToast('Added to Queue')
  }

  async function handleMarkAsRead() {
    await markAsRead(sheetBook!)
    closeSheet()
    pushToast('Marked as Read')
  }

  async function handleRemove() {
    await removeBook(sheetBook!.googleVolumeId)
    closeSheet()
    pushToast('Removed from Library')
  }

  const synopsis = sheetBook.description || 'No synopsis available.'

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        aria-label="Close"
        onClick={closeSheet}
        className="absolute inset-0 bg-black/40"
      />

      <div
        className={`relative flex flex-col overflow-hidden rounded-t-2xl bg-surface shadow-2xl transition-[height] duration-300 ease-out ${
          sheetStage === 'full' ? 'h-[94vh]' : 'h-[55vh]'
        }`}
        style={{ transform: dragY ? `translateY(${Math.max(dragY, 0)}px)` : undefined }}
      >
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="flex shrink-0 cursor-grab touch-none justify-center py-2.5 active:cursor-grabbing"
        >
          <span className="h-1 w-10 rounded-full bg-hairline" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-3">
          <div className="flex gap-4">
            <div className="h-28 w-20 shrink-0 overflow-hidden rounded-md bg-hairline shadow-sm">
              {sheetBook.coverUrl && (
                <img src={sheetBook.coverUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold leading-tight text-ink">{sheetBook.title}</h2>
              <p className="mt-0.5 truncate text-sm text-muted">
                {sheetBook.authors.join(', ') || 'Unknown author'}
              </p>
              {existing?.propensityScore != null && (
                <span className="mt-2 inline-block rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
                  ⭐ {existing.propensityScore}% Match
                </span>
              )}
            </div>
          </div>

          <p className="mt-4 text-sm text-muted">
            {sheetBook.pageCount ? `📖 ${sheetBook.pageCount} pages` : '📖 Unknown length'}
            {sheetBook.categories[0] && `  |  🏷️ ${sheetBook.categories[0]}`}
          </p>

          {sheetStage === 'peek' ? (
            <div className="mt-3">
              <p className="text-sm leading-relaxed text-ink/80 line-clamp-3">{synopsis}</p>
              <button
                type="button"
                onClick={expandSheet}
                className="mt-1 text-sm font-medium text-ink underline underline-offset-2"
              >
                Read More
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-4 pb-4">
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink/80">{synopsis}</p>

              <dl className="grid grid-cols-2 gap-3 rounded-lg border border-hairline p-3 text-sm">
                <div>
                  <dt className="text-xs text-muted">Publisher</dt>
                  <dd className="text-ink">{sheetBook.publisher ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Release Date</dt>
                  <dd className="text-ink">{sheetBook.publishedDate ?? '—'}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-muted">ISBN</dt>
                  <dd className="text-ink">{sheetBook.isbn ?? '—'}</dd>
                </div>
              </dl>

              <div className="rounded-lg border border-hairline bg-canvas p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Score Breakdown
                </p>
                <p className="mt-1 text-sm text-ink/80">
                  {existing?.propensityRationale ??
                    'Propensity scoring is coming soon — once enabled, this will explain the match based on your ratings.'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-hairline bg-surface p-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]">
          {existing ? (
            <button
              type="button"
              onClick={handleRemove}
              className="w-full rounded-full border border-hairline py-3 text-sm font-semibold text-ink"
            >
              {existing.status === 'to-read' ? 'Already in Queue — Tap to Remove' : 'Already Read — Tap to Remove'}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddToQueue}
                className="flex-1 rounded-full border border-hairline py-3 text-sm font-semibold text-ink"
              >
                + Add to Queue
              </button>
              <button
                type="button"
                onClick={handleMarkAsRead}
                className="flex-1 rounded-full bg-ink py-3 text-sm font-semibold text-ink-inverse"
              >
                ✓ Mark as Read
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
