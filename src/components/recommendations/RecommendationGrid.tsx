import { useState } from 'react'
import { RecCard } from './RecCard'
import { DetailModal } from '../shared/DetailModal'
import { useRecommendations } from '../../hooks/useRecommendations'
import { useLibraryActions } from '../../hooks/useLibraryActions'
import { useUiStore } from '../../store/uiStore'

export function RecommendationGrid({ uid }: { uid: string | undefined }) {
  const { books, loading, refreshing, refresh } = useRecommendations(uid)
  const { addToQueue, markAsRead } = useLibraryActions(uid)
  const pushToast = useUiStore((s) => s.pushToast)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = books.find((b) => b.googleVolumeId === selectedId) ?? null

  return (
    <div className="mx-auto max-w-3xl px-1 pb-24 sm:px-4">
      <div className="flex items-center justify-between px-2 py-3">
        <p className="text-xs text-muted">Based on what you've rated highly</p>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="rounded-full border border-hairline px-3 py-1.5 text-xs font-semibold text-ink disabled:opacity-50"
        >
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <p className="px-4 py-10 text-center text-sm text-muted">Loading recommendations…</p>
      ) : books.length === 0 ? (
        <div className="px-4 py-16 text-center">
          <p className="text-sm text-muted">
            No recommendations yet. Rate a few books you've read, then hit Refresh.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 px-1 sm:grid-cols-4">
          {books.map((book) => (
            <RecCard
              key={book.googleVolumeId}
              book={book}
              onClick={() => setSelectedId(book.googleVolumeId)}
            />
          ))}
        </div>
      )}

      {selected && (
        <DetailModal
          book={{ ...selected, propensityScore: selected.score, propensityRationale: selected.rationale }}
          onClose={() => setSelectedId(null)}
          footer={
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await addToQueue(selected)
                  setSelectedId(null)
                  pushToast('Added to Queue')
                }}
                className="flex-1 rounded-full border border-hairline py-3 text-sm font-semibold text-ink"
              >
                + Add to Queue
              </button>
              <button
                onClick={async () => {
                  await markAsRead(selected)
                  setSelectedId(null)
                  pushToast('Marked as Read')
                }}
                className="flex-1 rounded-full bg-ink py-3 text-sm font-semibold text-ink-inverse"
              >
                ✓ Mark as Read
              </button>
            </div>
          }
        />
      )}
    </div>
  )
}
