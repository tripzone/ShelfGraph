import type { CandidateBook, RatedBook, ScoreProvider } from './types.js'

/**
 * Placeholder scorer so the app is fully wired end-to-end before real LLM-based
 * scoring is designed. TODO: replace with an actual LLM call (see plan doc).
 *
 * Heuristic: score rises with how many categories the candidate shares with the
 * user's highly-rated (4-5 star) books. Deterministic, no network calls, no cost.
 */
export const stubScoreProvider: ScoreProvider = {
  async scoreBook(candidate: CandidateBook, ratedBooks: RatedBook[]) {
    const likedCategories = new Set(
      ratedBooks
        .filter((book) => book.rating >= 4)
        .flatMap((book) => book.categories.map((c) => c.toLowerCase())),
    )

    const overlap = candidate.categories.filter((c) =>
      likedCategories.has(c.toLowerCase()),
    ).length

    const score = Math.min(97, 55 + overlap * 15)

    const rationale = overlap
      ? `Placeholder score — shares ${overlap} genre${overlap > 1 ? 's' : ''} (${candidate.categories
          .slice(0, overlap)
          .join(', ')}) with books you've rated highly. Real scoring is coming soon.`
      : "Placeholder score — not much genre overlap with your rated books yet. Real scoring is coming soon."

    return { score, rationale }
  },
}
