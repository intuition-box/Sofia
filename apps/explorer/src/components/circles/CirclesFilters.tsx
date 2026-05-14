/**
 * CirclesFilters — topic dropdown + sort toggle above the /circles
 * grid. Shares the same chrome as the feed filters on /circles/:id so
 * both pages read as one consistent surface. UI-only until the list
 * grid actually filters; interactions update local state for now.
 */
import { useState } from 'react'
import CircleTopicFilterDropdown, {
  type TopicFilterId,
} from './CircleTopicFilterDropdown'
import CirclesSortToggle, { type CirclesSortId } from './CirclesSortToggle'

export default function CirclesFilters() {
  const [topic, setTopic] = useState<TopicFilterId>('all')
  const [sort, setSort] = useState<CirclesSortId>('activity')

  return (
    <div className="crd-feed-filters cr-list-filters">
      <CircleTopicFilterDropdown active={topic} onChange={setTopic} />
      <CirclesSortToggle active={sort} onChange={setSort} />
    </div>
  )
}
