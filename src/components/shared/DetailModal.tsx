import { useRef, useState, type ReactNode } from 'react'
import { GenreCombobox } from './GenreCombobox'
import type { EditableBookDetails } from '../../hooks/useLibraryActions'
import type { BookFormat, BookMetadata } from '../../types/book'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const FORMATS: BookFormat[] = ['physical', 'ebook', 'audio']

interface DetailModalBook extends BookMetadata {
  rating?: number | null
  finishedYear?: number | null
  finishedMonth?: number | null
  format?: BookFormat | null
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
  /** When provided, shows the year/month "finished" picker (Read tab only). */
  onSetFinishedDate?: (year: number | null, month: number | null) => Promise<void>
  /** When provided, shows the Physical/Ebook/Audio format selector (Read tab only). */
  onSetFormat?: (format: BookFormat | null) => Promise<void>
  /** When provided, shows a pencil affordance that turns this same view into an editable form. */
  onSaveDetails?: (details: EditableBookDetails) => Promise<void>
  /** Existing genres across the user's catalogue, offered in the genre field while editing. */
  genres?: string[]
  footer?: ReactNode
}

export function DetailModal({
  book,
  onClose,
  onRate,
  onChangeCover,
  onResetCover,
  onSetFinishedDate,
  onSetFormat,
  onSaveDetails,
  genres = [],
  footer,
}: DetailModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [coverBusy, setCoverBusy] = useState(false)
  const [coverError, setCoverError] = useState<string | null>(null)
  const [descExpanded, setDescExpanded] = useState(false)
  const hasCustomCover = book.coverUrl && book.coverUrl !== book.defaultCoverUrl
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 101 }, (_, i) => currentYear - i)

  const [editing, setEditing] = useState(false)
  const [savingDetails, setSavingDetails] = useState(false)
  const [titleInput, setTitleInput] = useState(book.title)
  const [authorsInput, setAuthorsInput] = useState(book.authors.join(', '))
  const [genreInput, setGenreInput] = useState(book.categories[0] ?? '')
  const [pageCountInput, setPageCountInput] = useState(
    book.pageCount != null ? String(book.pageCount) : '',
  )
  const [publisherInput, setPublisherInput] = useState(book.publisher ?? '')
  const [publishedDateInput, setPublishedDateInput] = useState(book.publishedDate ?? '')
  const [descriptionInput, setDescriptionInput] = useState(book.description)

  function startEditing() {
    setTitleInput(book.title)
    setAuthorsInput(book.authors.join(', '))
    setGenreInput(book.categories[0] ?? '')
    setPageCountInput(book.pageCount != null ? String(book.pageCount) : '')
    setPublisherInput(book.publisher ?? '')
    setPublishedDateInput(book.publishedDate ?? '')
    setDescriptionInput(book.description)
    setEditing(true)
  }

  async function handleSaveDetails() {
    if (!onSaveDetails) return
    const trimmedTitle = titleInput.trim()
    if (!trimmedTitle) return
    setSavingDetails(true)
    try {
      await onSaveDetails({
        title: trimmedTitle,
        authors: authorsInput
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
        categories: genreInput.trim() ? [genreInput.trim()] : [],
        pageCount: pageCountInput.trim() ? Number(pageCountInput.trim()) : null,
        publisher: publisherInput.trim() || null,
        publishedDate: publishedDateInput.trim() || null,
        description: descriptionInput.trim(),
      })
      setEditing(false)
    } finally {
      setSavingDetails(false)
    }
  }

  async function handleYearChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!onSetFinishedDate) return
    const year = e.target.value ? Number(e.target.value) : null
    // Clearing the year also clears the month — month can't stand alone.
    await onSetFinishedDate(year, year ? (book.finishedMonth ?? null) : null)
  }

  async function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!onSetFinishedDate) return
    const month = e.target.value ? Number(e.target.value) : null
    await onSetFinishedDate(book.finishedYear ?? null, month)
  }

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
              {coverError && (
                <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{coverError}</p>
              )}
            </div>
            <div className="min-w-0 flex-1">
              {editing ? (
                <div className="space-y-1.5">
                  <input
                    autoFocus
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    placeholder="Title"
                    className="w-full rounded-md border border-hairline bg-canvas px-2 py-1 text-base font-semibold text-ink placeholder:text-muted placeholder:font-normal focus:border-ink focus:outline-none"
                  />
                  <input
                    value={authorsInput}
                    onChange={(e) => setAuthorsInput(e.target.value)}
                    placeholder="Author(s), comma-separated"
                    className="w-full rounded-md border border-hairline bg-canvas px-2 py-1 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
                  />
                  <div className="flex gap-1.5">
                    <input
                      value={pageCountInput}
                      onChange={(e) => setPageCountInput(e.target.value.replace(/\D/g, ''))}
                      inputMode="numeric"
                      placeholder="Pages"
                      className="w-1/2 rounded-md border border-hairline bg-canvas px-2 py-1 text-xs text-ink placeholder:text-muted focus:border-ink focus:outline-none"
                    />
                    <GenreCombobox
                      value={genreInput}
                      genres={genres}
                      onChange={setGenreInput}
                      placeholder="Genre"
                      className="w-1/2"
                      inputClassName="w-full rounded-md border border-hairline bg-canvas px-2 py-1 text-xs text-ink placeholder:text-muted focus:border-ink focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-semibold leading-tight text-ink">{book.title}</h2>
                  <p className="mt-0.5 text-sm text-muted">
                    {book.authors.join(', ') || 'Unknown author'}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {book.pageCount ? `📖 ${book.pageCount} pages` : null}
                    {book.categories[0] ? `  |  🏷️ ${book.categories[0]}` : null}
                  </p>
                </>
              )}

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

              {onSetFinishedDate && (
                <div className="mt-3">
                  <p className="mb-1 text-xs text-muted">Finished</p>
                  <div className="flex gap-1.5">
                    <select
                      value={book.finishedYear ?? ''}
                      onChange={(e) => void handleYearChange(e)}
                      className="rounded-md border border-hairline bg-surface px-1.5 py-1 text-xs text-ink"
                    >
                      <option value="">—</option>
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    <select
                      value={book.finishedMonth ?? ''}
                      onChange={(e) => void handleMonthChange(e)}
                      disabled={!book.finishedYear}
                      className="rounded-md border border-hairline bg-surface px-1.5 py-1 text-xs text-ink disabled:opacity-40"
                    >
                      <option value="">—</option>
                      {MONTH_NAMES.map((name, i) => (
                        <option key={name} value={i + 1}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {onSetFormat && (
                <div className="mt-3">
                  <p className="mb-1 text-xs text-muted">Format</p>
                  <div className="flex gap-1.5">
                    {FORMATS.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => void onSetFormat(book.format === f ? null : f)}
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${
                          book.format === f
                            ? 'border-ink bg-ink text-ink-inverse'
                            : 'border-hairline text-ink'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
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

          {editing ? (
            <textarea
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
              placeholder="Description (optional)"
              rows={5}
              className="mt-4 w-full resize-none rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
            />
          ) : (
            book.description && (
              <div className="mt-4">
                <p
                  className={`whitespace-pre-line text-sm leading-relaxed text-ink/80 ${
                    descExpanded ? '' : 'line-clamp-5'
                  }`}
                >
                  {book.description}
                </p>
                <button
                  type="button"
                  onClick={() => setDescExpanded((v) => !v)}
                  className="mt-1 text-sm font-medium text-ink underline underline-offset-2"
                >
                  {descExpanded ? 'Show less' : 'Read more'}
                </button>
              </div>
            )
          )}

          {editing ? (
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="mb-1 text-xs text-muted">Publisher</p>
                <input
                  value={publisherInput}
                  onChange={(e) => setPublisherInput(e.target.value)}
                  className="w-full rounded-md border border-hairline bg-canvas px-2 py-1 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
              <div>
                <p className="mb-1 text-xs text-muted">Release Date</p>
                <input
                  value={publishedDateInput}
                  onChange={(e) => setPublishedDateInput(e.target.value)}
                  className="w-full rounded-md border border-hairline bg-canvas px-2 py-1 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
            </div>
          ) : (
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
          )}
        </div>

        {editing ? (
          <div className="shrink-0 border-t border-hairline p-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={savingDetails}
                className="flex-1 rounded-full border border-hairline py-3 text-sm font-semibold text-ink disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSaveDetails()}
                disabled={!titleInput.trim() || savingDetails}
                className="flex-1 rounded-full bg-ink py-3 text-sm font-semibold text-ink-inverse disabled:opacity-50"
              >
                {savingDetails ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          (onSaveDetails || footer) && (
            <div className="shrink-0 border-t border-hairline p-3">
              <div className="flex justify-center gap-2">
                {onSaveDetails && (
                  <button
                    type="button"
                    onClick={startEditing}
                    aria-label="Edit details"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline text-ink"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </button>
                )}
                {footer}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
