import { addBookToLibrary, removeUserBook, updateUserBook } from '../firebase/firestore'
import { scoreBook } from '../firebase/functions'
import { uploadCustomCover } from '../firebase/storage'
import type { BookFormat, BookMetadata } from '../types/book'

export type EditableBookDetails = Pick<
  BookMetadata,
  'title' | 'authors' | 'description' | 'publisher' | 'publishedDate' | 'pageCount' | 'categories'
>

/** Add/remove/mark-read actions shared by the search sheet and detail modal. */
export function useLibraryActions(uid: string | undefined) {
  async function addToQueue(book: BookMetadata, order = 0) {
    if (!uid) return
    await addBookToLibrary(uid, book, 'to-read', order)
    // Fire-and-forget: score once it's in the queue. Backed by a stub for now.
    scoreBook(book.googleVolumeId).catch(() => {})
  }

  async function markAsRead(book: BookMetadata) {
    if (!uid) return
    await addBookToLibrary(uid, book, 'read')
  }

  async function moveToRead(volumeId: string) {
    if (!uid) return
    await updateUserBook(uid, volumeId, { status: 'read' })
  }

  async function removeBook(volumeId: string) {
    if (!uid) return
    await removeUserBook(uid, volumeId)
  }

  async function changeCover(volumeId: string, file: File) {
    if (!uid) return
    const coverUrl = await uploadCustomCover(uid, volumeId, file)
    await updateUserBook(uid, volumeId, { coverUrl })
  }

  async function resetCover(volumeId: string, defaultCoverUrl: string | null) {
    if (!uid) return
    await updateUserBook(uid, volumeId, { coverUrl: defaultCoverUrl })
  }

  async function setFinishedDate(volumeId: string, year: number | null, month: number | null) {
    if (!uid) return
    await updateUserBook(uid, volumeId, { finishedYear: year, finishedMonth: month })
  }

  async function setFormat(volumeId: string, format: BookFormat | null) {
    if (!uid) return
    await updateUserBook(uid, volumeId, { format })
  }

  async function updateDetails(volumeId: string, details: EditableBookDetails) {
    if (!uid) return
    await updateUserBook(uid, volumeId, details)
  }

  return {
    addToQueue,
    markAsRead,
    moveToRead,
    removeBook,
    changeCover,
    resetCover,
    setFinishedDate,
    setFormat,
    updateDetails,
  }
}
