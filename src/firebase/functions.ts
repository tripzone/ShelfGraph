import { httpsCallable } from 'firebase/functions'
import { functions } from './config'

interface ScoreBookResponse {
  score: number
  rationale: string
}

interface GenerateRecommendationsResponse {
  count: number
}

/** Scores a single to-read book against the user's rating history. Backed by a stub today. */
export async function scoreBook(googleVolumeId: string): Promise<ScoreBookResponse> {
  const call = httpsCallable<{ googleVolumeId: string }, ScoreBookResponse>(functions, 'scoreBook')
  const { data } = await call({ googleVolumeId })
  return data
}

/** Regenerates the Recommendations tab; results land in users/{uid}/recommendations. */
export async function generateRecommendations(): Promise<GenerateRecommendationsResponse> {
  const call = httpsCallable<void, GenerateRecommendationsResponse>(
    functions,
    'generateRecommendations',
  )
  const { data } = await call()
  return data
}
