import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { searchGoogleBooks } from './googleBooks.js'
import { stubScoreProvider } from './scoring/stubProvider.js'
import type { RatedBook } from './scoring/types.js'

initializeApp()
const db = getFirestore()

const googleBooksApiKey = defineSecret('GOOGLE_BOOKS_API_KEY')

/** Scores a single book already in the caller's queue against their rating history. */
export const scoreBook = onCall<{ googleVolumeId: string }>(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.')

  const { googleVolumeId } = request.data
  if (!googleVolumeId) throw new HttpsError('invalid-argument', 'googleVolumeId is required.')

  const bookRef = db.doc(`users/${uid}/books/${googleVolumeId}`)
  const bookSnap = await bookRef.get()
  if (!bookSnap.exists) throw new HttpsError('not-found', 'Book not found in your library.')

  const ratedBooks = await getRatedBooks(uid)
  const candidate = bookSnap.data()!
  const result = await stubScoreProvider.scoreBook(
    {
      googleVolumeId,
      title: candidate.title,
      authors: candidate.authors ?? [],
      categories: candidate.categories ?? [],
      pageCount: candidate.pageCount ?? null,
      description: candidate.description ?? '',
    },
    ratedBooks,
  )

  await bookRef.update({ propensityScore: result.score, propensityRationale: result.rationale })
  return result
})

/** Rebuilds the Recommendations tab from the caller's rated books. */
export const generateRecommendations = onCall(
  { secrets: [googleBooksApiKey] },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.')

    const ratedBooks = await getRatedBooks(uid)
    const likedCategories = [
      ...new Set(
        ratedBooks
          .filter((b) => b.rating >= 4)
          .flatMap((b) => b.categories),
      ),
    ]

    if (likedCategories.length === 0) {
      return { count: 0 }
    }

    const existingIds = new Set((await db.collection(`users/${uid}/books`).get()).docs.map((d) => d.id))

    const candidateLists = await Promise.all(
      likedCategories
        .slice(0, 3)
        .map((category) => searchGoogleBooks(`subject:${category}`, googleBooksApiKey.value(), 6)),
    )

    const seen = new Set<string>()
    const candidates = candidateLists
      .flat()
      .filter((c) => !existingIds.has(c.googleVolumeId) && !seen.has(c.googleVolumeId) && seen.add(c.googleVolumeId))
      .slice(0, 10)

    const batch = db.batch()
    for (const candidate of candidates) {
      const { score, rationale } = await stubScoreProvider.scoreBook(candidate, ratedBooks)
      const ref = db.doc(`users/${uid}/recommendations/${candidate.googleVolumeId}`)
      batch.set(ref, { ...candidate, score, rationale, generatedAt: FieldValue.serverTimestamp() })
    }
    await batch.commit()

    return { count: candidates.length }
  },
)

async function getRatedBooks(uid: string): Promise<RatedBook[]> {
  const snapshot = await db
    .collection(`users/${uid}/books`)
    .where('status', '==', 'read')
    .where('rating', '>', 0)
    .get()

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      googleVolumeId: doc.id,
      title: data.title,
      authors: data.authors ?? [],
      categories: data.categories ?? [],
      pageCount: data.pageCount ?? null,
      description: data.description ?? '',
      rating: data.rating,
    }
  })
}
