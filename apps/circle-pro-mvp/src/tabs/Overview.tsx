/**
 * Overview — the workspace home: the topic map (what the team cares about) and
 * a join band. A topic drills into the people working it. De-cryptoized — no
 * on-chain teaser, no trust language.
 */
import { TopicsTreemap } from '../components/TopicsTreemap'
import { requireJoin } from '../lib/gate'

interface OverviewProps {
  onTopic: (id: string) => void
}

export function Overview({ onTopic }: OverviewProps) {
  return (
    <div className="content">
      <TopicsTreemap domain="all" onPick={onTopic} />

      <div className="join-band">
        <div>
          <h3 className="join-band-t">You're seeing the workspace overview.</h3>
          <p className="join-band-s">
            Join Acme to curate your own bookmarks, add the context only you have, and see who
            validates each resource.
          </p>
        </div>
        <button className="btn btn-accent" onClick={() => requireJoin('join the workspace')}>
          Join Acme
        </button>
      </div>
    </div>
  )
}
