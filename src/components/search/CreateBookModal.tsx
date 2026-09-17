import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { uploadCustomCover } from '../../firebase/storage'
import { GenreCombobox } from '../shared/GenreCombobox'
import type { BookMetadata } from '../../types/book'

interface CreateBookModalProps {
  initialTitle: string
  uid: string | undefined
  genres: string[]
  onClose: () => void
  onCreate: (book: BookMetadata) => void
}

export function CreateBookModal({
  initialTitle,
  uid,
  genres,
  onClose,
  onCreate,
}: CreateBookModalProps) {
  const [title, setTitle] = useState(initialTitle)
  const [author, setAuthor] = useState('')
  const [genre, setGenre] = useState('')
  const [pageCount, setPageCount] = useState('')
  const [publisher, setPublisher] = useState('')
  const [publishedDate, setPublishedDate] = useState('')
  const [description, setDescription] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [coverError, setCoverError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleCoverFile(file: File | undefined) {
    if (!file) return
    setCoverError(null)
    setCoverFile(file)
    setCoverPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return
    const trimmedPageCount = pageCount.trim()
    const googleVolumeId = `custom-${crypto.randomUUID()}`

    let coverUrl: string | null = null
    if (coverFile && uid) {
      setUploadingCover(true)
      try {
        coverUrl = await uploadCustomCover(uid, googleVolumeId, coverFile)
      } catch {
        setCoverError('Could not upload that image.')
        setUploadingCover(false)
        return
      }
      setUploadingCover(false)
    }

    onCreate({
      googleVolumeId,
      title: trimmedTitle,
      authors: author.trim() ? [author.trim()] : [],
      coverUrl,
      defaultCoverUrl: coverUrl,
      pageCount: trimmedPageCount ? Number(trimmedPageCount) : null,
      categories: genre.trim() ? [genre.trim()] : [],
      description: description.trim(),
      publisher: publisher.trim() || null,
      publishedDate: publishedDate.trim() || null,
      isbn: null,
    })
  }

  return createPortal(
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

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="overflow-y-auto px-6 pb-4 pt-8">
            <div className="flex gap-4">
              <div className="shrink-0">
                <div className="relative h-36 w-24 overflow-hidden rounded-md bg-hairline shadow-sm">
                  {coverPreviewUrl && (
                    <img src={coverPreviewUrl} alt="" className="h-full w-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Choose cover image"
                    className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-[11px] font-semibold text-white"
                  >
                    {coverPreviewUrl ? '✎ Edit' : '+ Cover'}
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    handleCoverFile(e.target.files?.[0])
                    e.target.value = ''
                  }}
                />
                {coverError && (
                  <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{coverError}</p>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title"
                  className="w-full rounded-md border border-hairline bg-canvas px-2.5 py-1.5 text-base font-semibold text-ink placeholder:text-muted placeholder:font-normal focus:border-ink focus:outline-none"
                />
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Author (optional)"
                  className="w-full rounded-md border border-hairline bg-canvas px-2.5 py-1.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
                />
                <div className="flex gap-1.5">
                  <GenreCombobox
                    value={genre}
                    genres={genres}
                    onChange={setGenre}
                    placeholder="Genre"
                    className="w-1/2"
                    inputClassName="w-full rounded-md border border-hairline bg-canvas px-2.5 py-1.5 text-xs text-ink placeholder:text-muted focus:border-ink focus:outline-none"
                  />
                  <input
                    value={pageCount}
                    onChange={(e) => setPageCount(e.target.value.replace(/\D/g, ''))}
                    inputMode="numeric"
                    placeholder="Pages"
                    className="w-1/2 rounded-md border border-hairline bg-canvas px-2.5 py-1.5 text-xs text-ink placeholder:text-muted focus:border-ink focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <input
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="Publisher (optional)"
                className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
              />
              <input
                value={publishedDate}
                onChange={(e) => setPublishedDate(e.target.value)}
                placeholder="Release date (optional)"
                className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={4}
                className="w-full resize-none rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
              />
            </div>
          </div>

          <div className="shrink-0 border-t border-hairline p-3">
            <button
              type="submit"
              disabled={!title.trim() || uploadingCover}
              className="w-full rounded-full bg-ink py-3 text-sm font-semibold text-ink-inverse disabled:opacity-50"
            >
              {uploadingCover ? 'Uploading…' : 'Add Title'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
