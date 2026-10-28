/**
 * HunterProgress — the account's month as a Trend Hunter, at the top of the
 * board: free Recommends first (what it owns, credits from calls included),
 * then what grows them — calls, Flair, rank and the way to the Top 10 — and
 * how to earn, in one line. Logged out: what signing in gives.
 */
import { useEffect, useState } from 'react'
import { useLogin } from '@privy-io/react-auth'
import { AnimatedNumber } from '@0xsofia/design-system'
import { useSponsorQuota } from '@/hooks/useSponsoredWrite'
import {
  CREDITS_PER_CALL,
  TREND_HUNTER_BADGE_RANK,
  useTrendHunters,
} from '@/hooks/useTrendHunters'
import { countdown } from '@/utils/formatting'
import '@/components/styles/trend-hunter.css'

const flair = (n: number) => Math.round(n).toLocaleString()

/** Re-renders every minute for the countdown */
function useMinuteClock(): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])
  return now
}

function HowToEarn({ topSize, pool }: { topSize: number; pool?: number }) {
  return (
    <ol className="th-steps">
      <li>
        <b>1</b> Be among the first 3 on a page
      </li>
      <li>
        <b>2</b> 5 credible accounts follow: a call
      </li>
      <li>
        <b>3</b> +{CREDITS_PER_CALL} free Recommends per call
        {pool ? ` · Top ${topSize} share ${pool.toLocaleString()} TRUST` : ''}
      </li>
    </ol>
  )
}

export default function HunterProgress({ wallet }: { wallet?: string | null }) {
  const { entries, pool } = useTrendHunters(50)
  const { quota } = useSponsorQuota()
  const { login } = useLogin()
  const now = useMinuteClock()

  const me = wallet?.toLowerCase()
  const mine = me ? entries.find((e) => e.wallet === me) : undefined
  const topSize = pool?.size ?? TREND_HUNTER_BADGE_RANK
  const last = entries[topSize - 1]
  const inTop = !!mine && mine.rank <= topSize

  if (!wallet) {
    return (
      <section className="th-section" aria-label="Your progress">
        <div className="th-hero">
          <span className="th-hero-value">Free Recommends</span>
          <span className="th-desc">
            Sign in to get free Recommends every month — and earn more by
            spotting pages early.
          </span>
          <button
            type="button"
            className="pm-dex-invest th-hero-cta"
            style={{ background: 'var(--ds-accent)' }}
            onClick={() => login()}
          >
            Sign in
          </button>
        </div>
        <HowToEarn topSize={topSize} pool={pool?.trust} />
      </section>
    )
  }

  const d = new Date(now)
  const dayEnd = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() + 1,
  )
  const monthly = quota?.limits?.monthly ?? 0
  const usedMonth = quota?.used?.month ?? 0
  const leftMonth = Math.max(0, monthly - usedMonth)
  const leftToday = quota?.left ?? 0
  // Credits are summed over the account's wallets
  const calls = Math.round((quota?.credits ?? 0) / CREDITS_PER_CALL)
  const usedPct = monthly ? Math.round((usedMonth / monthly) * 100) : 0

  const toTop = inTop
    ? mine?.reward
      ? `≈ ${mine.reward.toFixed(2)} TRUST`
      : `In the Top ${topSize}`
    : mine && last
      ? `${flair(last.flair - mine.flair + 1)} Flair to Top ${topSize}`
      : 'Not ranked yet'

  return (
    <section className="th-section" aria-label="Your progress">
      <div className="th-hero">
        {quota?.eligible ? (
          <>
            <span className="th-hero-value">
              <AnimatedNumber value={leftMonth} flash /> free Recommends left
            </span>
            <span className="th-bar th-bar--hero" aria-hidden>
              <span style={{ width: `${usedPct}%` }} />
            </span>
            <span className="th-desc">
              {usedMonth}/{monthly} used this month · {leftToday} left today
              (resets in {countdown(dayEnd, now)})
            </span>
            <span className="th-hero-credits">
              {calls
                ? `+${quota.credits} earned from your ${calls} call${calls === 1 ? '' : 's'}`
                : `Each call earns +${CREDITS_PER_CALL} free Recommends`}
            </span>
          </>
        ) : (
          <>
            <span className="th-hero-value">Free Recommends</span>
            <span className="th-desc">
              {quota?.reason ?? 'Unavailable right now.'}
            </span>
          </>
        )}
      </div>

      <div className="th-tiles">
        <div className="th-tile">
          <span className="th-value">
            <AnimatedNumber value={mine?.calls ?? 0} />
          </span>
          <span className="th-desc">calls</span>
        </div>
        <div className="th-tile">
          <span className="th-value">
            <AnimatedNumber value={mine?.flair ?? 0} format={flair} flash />
          </span>
          <span className="th-desc">Flair</span>
        </div>
        <div className="th-tile">
          <span className="th-value">{mine ? `#${mine.rank}` : '—'}</span>
          <span className="th-desc">{toTop}</span>
        </div>
      </div>

      <HowToEarn topSize={topSize} pool={pool?.trust} />
    </section>
  )
}
