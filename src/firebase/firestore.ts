import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from './config'
import type { BookMetadata, BookStatus, RecommendedBook, UserBook } from '../types/book'

function toIso(value: unknown): string | null {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  return null
}

function booksCol(uid: string) {
  return collection(db, 'users', uid, 'books')
}

function recommendationsCol(uid: string) {
  return collection(db, 'users', uid, 'recommendations')
}

function fromDoc(id: string, data: Record<string, unknown>): UserBook {
  return {
    googleVolumeId: id,
    title: data.title as string,
    authors: (data.authors as string[]) ?? [],
    coverUrl: (data.coverUrl as string | null) ?? null,
    // Older docs predate this field — fall back to whatever cover they were saved with.
    defaultCoverUrl: (data.defaultCoverUrl as string | null) ?? (data.coverUrl as string | null) ?? null,
    pageCount: (data.pageCount as number | null) ?? null,
    categories: (data.categories as string[]) ?? [],
    description: (data.description as string) ?? '',
    publisher: (data.publisher as string | null) ?? null,
    publishedDate: (data.publishedDate as string | null) ?? null,
    isbn: (data.isbn as string | null) ?? null,
    status: data.status as BookStatus,
    rating: (data.rating as number | null) ?? null,
    dateFinished: (data.dateFinished as string | null) ?? toIso(data.dateFinished),
    order: (data.order as number) ?? 0,
    propensityScore: (data.propensityScore as number | null) ?? null,
    propensityRationale: (data.propensityRationale as string | null) ?? null,
    addedAt: (data.addedAt as string) ?? toIso(data.addedAt) ?? new Date().toISOString(),
  }
}

export function subscribeToBooksByStatus(
  uid: string,
  status: BookStatus,
  callback: (books: UserBook[]) => void,
) {
  const q =
    status === 'to-read'
      ? query(booksCol(uid), where('status', '==', status), orderBy('order', 'asc'))
      : query(booksCol(uid), where('status', '==', status))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => fromDoc(d.id, d.data())))
  })
}

/** All of a user's books (both statuses) — used for "already in library" checks. */
export function subscribeToAllBooks(uid: string, callback: (books: UserBook[]) => void) {
  return onSnapshot(booksCol(uid), (snapshot) => {
    callback(snapshot.docs.map((d) => fromDoc(d.id, d.data())))
  })
}

export function subscribeToRecommendations(
  uid: string,
  callback: (books: RecommendedBook[]) => void,
) {
  return onSnapshot(recommendationsCol(uid), (snapshot) => {
    callback(
      snapshot.docs.map((d) => {
        const data = d.data()
        return {
          googleVolumeId: d.id,
          title: data.title,
          authors: data.authors ?? [],
          coverUrl: data.coverUrl ?? null,
          defaultCoverUrl: data.coverUrl ?? null,
          pageCount: data.pageCount ?? null,
          categories: data.categories ?? [],
          description: data.description ?? '',
          publisher: data.publisher ?? null,
          publishedDate: data.publishedDate ?? null,
          isbn: data.isbn ?? null,
          score: data.score ?? 0,
          rationale: data.rationale ?? '',
          generatedAt: toIso(data.generatedAt) ?? new Date().toISOString(),
        } satisfies RecommendedBook
      }),
    )
  })
}

export async function getUserBook(uid: string, volumeId: string): Promise<UserBook | null> {
  const snap = await getDoc(doc(booksCol(uid), volumeId))
  return snap.exists() ? fromDoc(snap.id, snap.data()) : null
}

export async function addBookToLibrary(
  uid: string,
  metadata: BookMetadata,
  status: BookStatus,
  order = 0,
) {
  await setDoc(doc(booksCol(uid), metadata.googleVolumeId), {
    ...metadata,
    status,
    rating: null,
    dateFinished: status === 'read' ? serverTimestamp() : null,
    order,
    propensityScore: null,
    propensityRationale: null,
    addedAt: serverTimestamp(),
  })
}

export async function updateUserBook(
  uid: string,
  volumeId: string,
  patch: Partial<Pick<UserBook, 'rating' | 'status' | 'order' | 'dateFinished' | 'coverUrl'>>,
) {
  await updateDoc(doc(booksCol(uid), volumeId), { ...patch })
}

export async function removeUserBook(uid: string, volumeId: string) {
  await deleteDoc(doc(booksCol(uid), volumeId))
}

export async function reorderQueue(uid: string, orderedVolumeIds: string[]) {
  const batch = writeBatch(db)
  orderedVolumeIds.forEach((id, index) => {
    batch.update(doc(booksCol(uid), id), { order: index })
  })
  await batch.commit()
}
