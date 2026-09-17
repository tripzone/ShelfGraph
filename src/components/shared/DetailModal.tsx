import { useRef, useState, type ReactNode } from 'react'
import type { BookMetadata } from '../../types/book'

interface DetailModalBook extends BookMetadata {
  rating?: number | null
  dateFinished?: string | null
  propensityScore?: number | null
  propensityRationale?: string | null
}

interface DetailModalProps {
  book: DetailModalBook
  onClose: () => void
  onRate?: (rating: number) => void
  /** When provided, shows a cover-edit affordance that uploads the chosen image. */
  onChangeCover?: (file: File) => Promise<void>
  /** When provided and the cover differs from `defaultCoverUrl`, shows a "Reset" action. */
  onResetCover?: () => Promise<void>
  footer?: ReactNode
}

export function DetailModal({
  book,
  onClose,
  onRate,
  onChangeCover,
  onResetCover,
  footer,
}: DetailModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [coverBusy, setCoverBusy] = useState(false)
  const [coverError, setCoverError] = useState<string | null>(null)
  const hasCustomCover = book.coverUrl && book.coverUrl !== book.defaultCoverUrl

  async function handleCoverFile(file: File | undefined) {
    if (!file || !onChangeCover) return
    setCoverError(null)
    setCoverBusy(true)
    try {
      await onChangeCover(file)
    } catch {
      setCoverError('Could not upload that image.')
    } finally {
      setCoverBusy(false)
    }
  }

  async function handleResetCover() {
    if (!onResetCover) return
    setCoverError(null)
    setCoverBusy(true)
    try {
      await onResetCover()
    } catch {
      setCoverError('Could not reset the cover.')
    } finally {
      setCoverBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />

      <div className="relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-ink shadow"
        >
          ✕
        </button>

        <div className="overflow-y-auto px-6 pb-4 pt-8">
          <div className="flex gap-4">
            <div className="shrink-0">
              <div className="relative h-36 w-24 overflow-hidden rounded-md bg-hairline shadow-sm">
                {book.coverUrl && (
                  <img src={book.coverUrl} alt="" className="h-full w-full object-cover" />
                )}
                {onChangeCover && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={coverBusy}
                    aria-label="Change cover"
                    className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-[11px] font-semibold text-white disabled:opacity-70"
                  >
                    {coverBusy ? '…' : '✎ Edit'}
                  </button>
                )}
              </div>
              {onChangeCover && (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    void handleCoverFile(e.target.files?.[0])
                    e.target.value = ''
                  }}
                />
              )}
              {onResetCover && hasCustomCover && (
                <button
                  type="button"
                  onClick={() => void handleResetCover()}
                  disabled={coverBusy}
                  className="mt-1 w-full text-center text-[11px] text-muted underline disabled:opacity-50"
                >
                  Reset cover
                </button>
              )}
              {coverError && <p className="mt-1 text-[11px] text-red-600">{coverError}</p>}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold leading-tight text-ink">{book.title}</h2>
              <p className="mt-0.5 text-sm text-muted">
                {book.authors.join(', ') || 'Unknown author'}
              </p>
              <p className="mt-2 text-xs text-muted">
                {book.pageCount ? `📖 ${book.pageCount} pages` : null}
                {book.categories[0] ? `  |  🏷️ ${book.categories[0]}` : null}
              </p>

              {onRate && (
                <div className="mt-3 flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => onRate(star)}
                      aria-label={`Rate ${star} star`}
                      className={`text-xl leading-none ${
                        (book.rating ?? 0) >= star ? 'text-ink' : 'text-hairline'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              )}

              {book.dateFinished && (
                <p className="mt-2 text-xs text-muted">
                  Finished {new Date(book.dateFinished).toLocaleDateString()}
                </p>
              )}

              {book.propensityScore != null && (
                <span className="mt-2 inline-block rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
                  ⭐ {book.propensityScore}% Match
                </span>
              )}
            </div>
          </div>

          {book.propensityRationale && (
            <div className="mt-4 rounded-lg border border-hairline bg-canvas p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Why this match
              </p>
              <p className="mt-1 text-sm text-ink/80">{book.propensityRationale}</p>
            </div>
          )}

          {book.description && (
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink/80">
              {book.description}
            </p>
          )}

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted">Publisher</dt>
              <dd className="text-ink">{book.publisher ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Release Date</dt>
              <dd className="text-ink">{book.publishedDate ?? '—'}</dd>
            </div>
          </dl>
        </div>

        {footer && <div className="shrink-0 border-t border-hairline p-3">{footer}</div>}
      </div>
    </div>
  )
}
