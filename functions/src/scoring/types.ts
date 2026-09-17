export interface CandidateBook {
  googleVolumeId: string
  title: string
  authors: string[]
  categories: string[]
  pageCount: number | null
  description: string
}

export interface RatedBook extends CandidateBook {
  rating: number
}

export interface ScoreResult {
  score: number
  rationale: string
}

export interface ScoreProvider {
  scoreBook(candidate: CandidateBook, ratedBooks: RatedBook[]): Promise<ScoreResult>
}
