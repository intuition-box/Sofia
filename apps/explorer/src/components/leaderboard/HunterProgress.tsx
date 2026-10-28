/**
 * HunterProgress — "Your month", first on /trend-hunters for a signed-in
 * account: pages spotted, Influence and rank, the way to the Top N and the
 * share of the pool, and what the spotted pages already earned (free
 * Recommends are spent on Trending, so the counter itself lives there).
 */
import { Link } from 'react-router-dom'
import { AnimatedNumber, ModuleHead } from '@0xsofia/design-system'
import { useSponsorQuota } from '@/hooks/useSponsoredWrite'
import {
  CREDITS_PER_CALL,
  TREND_HUNTER_BADGE_RANK,
  useTrendHunters,
} from '@/hooks/useTrendHunters'
import '@0xsofia/design-system/styles/module-head.css'
import '@/components/styles/trend-hunter.css'

const influence = (n: number) => Math.round(n).toLocaleString()

export default function HunterProgress({ wallet }: { wallet: string }) {
  const { entries, pool } = useTrendHunters(50)
  const { quota } = useSponsorQuota()

  const me = wallet.toLowerCase()
  const mine = entries.find((e) => e.wallet === me)
  const topSize = pool?.size ?? TREND_HUNTER_BADGE_RANK
  const last = entries[topSize - 1]
  const inTop = !!mine && mine.rank <= topSize
  const spotted = mine?.calls ?? 0

  const rankNote = inTop
    ? mine?.reward
      ? `≈ ${mine.reward.toFixed(2)} TRUST if the month ended now`
      : `In the Top ${topSize}`
    : mine && last
      ? `${influence(last.flair - mine.flair + 1)} Influence to the Top ${topSize}`
      : 'Not ranked yet'

  return (
    <section className="th-section" aria-label="Your month">
      <ModuleHead title="Your month" />
      <div className="th-tiles">
        <div className="th-tile">
          <span className="th-value">
            <AnimatedNumber value={spotted} />
          </span>
          <span className="th-desc">
            spotted page{spotted === 1 ? '' : 's'}
          </span>
        </div>
        <div className="th-tile">
          <span className="th-value">
            <AnimatedNumber value={mine?.flair ?? 0} format={influence} flash />
          </span>
          <span className="th-desc">Influence</span>
        </div>
        <div className="th-tile">
          <span className="th-value">{mine ? `#${mine.rank}` : '—'}</span>
          <span className="th-desc">{rankNote}</span>
        </div>
      </div>
      <p className="th-earned">
        {quota?.credits ? (
          <>
            Earned this month: <b>+{quota.credits} free Recommends</b>
            {quota.creditsFrom &&
              ` (${quota.creditsFrom.spotted} from spotted pages, ${quota.creditsFrom.missions} from missions)`}
            .{' '}
          </>
        ) : (
          <>
            Each spotted page earns <b>+{CREDITS_PER_CALL} free Recommends</b>,
            each mission done earns more.{' '}
          </>
        )}
        <Link to="/trending" className="th-strip-link th-earned-link">
          Find pages on Trending
        </Link>
      </p>
    </section>
  )
}
