/**
 * Overview — the workspace home: the topic map (what the team cares about) and
 * a join band. A topic drills into the people working it. De-cryptoized — no
 * on-chain teaser, no trust language.
 */
import { TopicsTreemap } from '../components/TopicsTreemap'

interface OverviewProps {
  onTopic: (id: string) => void
}

export function Overview({ onTopic }: OverviewProps) {
  return (
    <div className="content">
      <TopicsTreemap domain="all" onPick={onTopic} />
    </div>
  )
}
