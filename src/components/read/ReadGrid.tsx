import { useState } from 'react'
import { CoverTile } from './CoverTile'
import { DetailModal } from '../shared/DetailModal'
import { useLibrary } from '../../hooks/useLibrary'
import { useLibraryActions } from '../../hooks/useLibraryActions'

export function ReadGrid({ uid }: { uid: string | undefined }) {
  const { books, loading, rateBook } = useLibrary(uid)
  const { changeCover, resetCover } = useLibraryActions(uid)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = books.find((b) => b.googleVolumeId === selectedId) ?? null

  if (loading) {
    return <p className="px-4 py-10 text-center text-sm text-muted">Loading your shelf…</p>
  }

  if (books.length === 0) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-sm text-muted">
          Nothing finished yet. Search for a book above and mark it as read.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="mx-auto grid max-w-3xl grid-cols-3 gap-1 px-1 pb-24 sm:grid-cols-4 sm:gap-2 sm:px-4">
        {books.map((book) => (
          <CoverTile
            key={book.googleVolumeId}
            book={book}
            onClick={() => setSelectedId(book.googleVolumeId)}
          />
        ))}
      </div>

      {selected && (
        <DetailModal
          book={selected}
          onClose={() => setSelectedId(null)}
          onRate={(rating) => rateBook(selected.googleVolumeId, rating)}
          onChangeCover={(file) => changeCover(selected.googleVolumeId, file)}
          onResetCover={() => resetCover(selected.googleVolumeId, selected.defaultCoverUrl)}
        />
      )}
    </>
  )
}
