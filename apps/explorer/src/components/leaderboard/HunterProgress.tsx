/**
 * HunterProgress — "Your month", the large card of /trend-hunters for a
 * signed-in account: a dial of the way to the Top N (full once in it) with
 * the rank at its center, then pages spotted, Influence and the share of the
 * pool. Free Recommends are spent on Trending, so their counter lives there.
 */
import { AnimatedNumber } from '@0xsofia/design-system'
import {
  TREND_HUNTER_BADGE_RANK,
  useTrendHunters,
} from '@/hooks/useTrendHunters'
import '@/components/styles/trend-hunter.css'

const influence = (n: number) => Math.round(n).toLocaleString()

/** Half-circle dial; `value` in [0, 1] */
function Dial({ value, label }: { value: number; label: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <svg
      className="th-dial-arc"
      viewBox="0 0 200 110"
      role="img"
      aria-label={label}
    >
      <path
        d="M 12 100 A 88 88 0 0 1 188 100"
        pathLength={100}
        className="th-dial-track"
      />
      <path
        d="M 12 100 A 88 88 0 0 1 188 100"
        pathLength={100}
        className="th-dial-fill"
        style={{ strokeDashoffset: 100 - pct }}
      />
    </svg>
  )
}

export default function HunterProgress({ wallet }: { wallet: string }) {
  const { entries, pool } = useTrendHunters(50)

  const me = wallet.toLowerCase()
  const mine = entries.find((e) => e.wallet === me)
  const topSize = pool?.size ?? TREND_HUNTER_BADGE_RANK
  const last = entries[topSize - 1]
  const inTop = !!mine && mine.rank <= topSize
  const spotted = mine?.calls ?? 0

  // Share of the way to the Top N: Influence against the last place in it
  const progress = inTop
    ? 1
    : mine && last?.flair
      ? Math.min(0.99, mine.flair / last.flair)
      : 0

  const note = inTop
    ? `In the Top ${topSize}`
    : mine && last
      ? `${influence(last.flair - mine.flair + 1)} Influence to the Top ${topSize}`
      : `Spot a page to enter the ranking`

  return (
    <section className="th-panel th-bento-main" aria-label="Your month">
      <h2 className="th-panel-title">Your month</h2>

      <div className="th-dial">
        <Dial
          value={progress}
          label={`${Math.round(progress * 100)}% of the way to the Top ${topSize}`}
        />
        <div className="th-dial-center">
          <span className="th-dial-rank">
            {mine ? (
              <AnimatedNumber
                value={mine.rank}
                format={(n) => `#${Math.round(n)}`}
              />
            ) : (
              '—'
            )}
          </span>
          <span className="th-desc">{note}</span>
        </div>
      </div>

      <dl className="th-stats">
        <div>
          <dt>Spotted pages</dt>
          <dd>
            <AnimatedNumber value={spotted} />
          </dd>
        </div>
        <div>
          <dt>Influence</dt>
          <dd>
            <AnimatedNumber value={mine?.flair ?? 0} format={influence} flash />
          </dd>
        </div>
        <div>
          <dt>
            {pool ? `Share of ${pool.trust.toLocaleString()} TRUST` : 'Reward'}
          </dt>
          <dd>
            {mine?.reward ? (
              <AnimatedNumber
                value={mine.reward}
                format={(n) => `≈ ${n.toFixed(2)}`}
                flash
              />
            ) : (
              '—'
            )}
          </dd>
        </div>
      </dl>
    </section>
  )
}
