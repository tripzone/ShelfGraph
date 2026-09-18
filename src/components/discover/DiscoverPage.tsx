import { RecommendationGrid } from '../recommendations/RecommendationGrid'
import { StatsSection } from './StatsSection'
import { FindUsersSection } from './FindUsersSection'

export function DiscoverPage({ uid }: { uid: string | undefined }) {
  return (
    <div className="divide-y divide-hairline pb-24">
      <RecommendationGrid uid={uid} />
      <StatsSection uid={uid} />
      <FindUsersSection uid={uid} />
    </div>
  )
}
