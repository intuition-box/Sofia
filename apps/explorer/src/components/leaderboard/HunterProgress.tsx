/**
 * HunterProgress — the connected account's month as a Trend Hunter, in one
 * place: calls, Flair and rank, the way to the Top 10 and its share of the
 * pool, free Recommends (credits from calls included), and the countdowns to
 * the daily reset and the month's end (when the pool is shared).
 */
import { useEffect, useState } from 'react'
import { AnimatedNumber, ModuleHead } from '@0xsofia/design-system'
import { useSponsorQuota } from '@/hooks/useSponsoredWrite'
import {
  CREDITS_PER_CALL,
  TREND_HUNTER_BADGE_RANK,
  useTrendHunters,
} from '@/hooks/useTrendHunters'
import { countdown } from '@/utils/formatting'
import '@0xsofia/design-system/styles/module-head.css'
import '@/components/styles/market-pages.css'
import '@/components/styles/trend-hunter.css'

const flair = (n: number) => Math.round(n).toLocaleString()

/** Re-renders every minute for the countdowns */
function useMinuteClock(): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])
  return now
}

export default function HunterProgress({ wallet }: { wallet: string }) {
  const { entries, pool } = useTrendHunters(50)
  const { quota } = useSponsorQuota()
  const now = useMinuteClock()

  const me = wallet.toLowerCase()
  const mine = entries.find((e) => e.wallet === me)
  const topSize = pool?.size ?? TREND_HUNTER_BADGE_RANK
  const last = entries[topSize - 1]
  const inTop = !!mine && mine.rank <= topSize

  const d = new Date(now)
  const monthEnd = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)
  const dayEnd = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() + 1,
  )

  // Share of the way to the Top N (full once in it)
  const towardTop = inTop
    ? 100
    : mine && last?.flair
      ? Math.min(99, Math.round((mine.flair / last.flair) * 100))
      : 0

  const standing = inTop
    ? `You're #${mine!.rank} — in the Top ${topSize}.`
    : mine && last
      ? `#${mine.rank}: ${flair(last.flair - mine.flair + 1)} more Flair to enter the Top ${topSize}.`
      : 'Not ranked yet: be among the first 3 on a page others will follow.'

  return (
    <section className="th-section" aria-label="Your progress">
      <ModuleHead
        title="Your progress"
        right={
          <span className="pm-chip">
            Month ends in {countdown(monthEnd, now)}
          </span>
        }
      />
      <div className="mk-summary">
        <div className="mk-summary-stat">
          <span className="mk-summary-value">
            <AnimatedNumber value={mine?.calls ?? 0} />
          </span>
          <span className="mk-summary-label">
            Calls · +{CREDITS_PER_CALL} free Recommends each
          </span>
        </div>
        <div className="mk-summary-stat">
          <span className="mk-summary-value">
            <AnimatedNumber value={mine?.flair ?? 0} format={flair} flash />
          </span>
          <span className="mk-summary-label">
            Flair{mine ? ` · #${mine.rank}` : ''}
          </span>
        </div>
        <div className="mk-summary-stat">
          <span className="mk-summary-value">
            {mine?.reward ? (
              <AnimatedNumber
                value={mine.reward}
                format={(n) => `${n.toFixed(2)} TRUST`}
                flash
              />
            ) : (
              '—'
            )}
          </span>
          <span className="mk-summary-label">
            {pool
              ? `Your share of ${pool.trust.toLocaleString()} TRUST`
              : 'Monthly pool'}
          </span>
        </div>
        <div className="mk-summary-stat">
          <span className="mk-summary-value">
            {quota?.eligible ? <AnimatedNumber value={quota.left ?? 0} /> : '—'}
          </span>
          <span className="mk-summary-label">Free Recommends left today</span>
        </div>
      </div>

      <div className="th-progress">
        <div className="th-progress-line">
          <span className="th-desc">{standing}</span>
          <span className="th-value">{towardTop}%</span>
        </div>
        <span className="th-bar" aria-hidden>
          <span style={{ width: `${towardTop}%` }} />
        </span>
        {pool && (
          <span className="th-desc">
            The Top {pool.size} share {pool.trust.toLocaleString()} TRUST by
            Flair when the month ends, in {countdown(monthEnd, now)}.
          </span>
        )}
        {quota?.eligible && quota.used && quota.limits && (
          <span className="th-desc">
            Free Recommends: {quota.used.month}/{quota.limits.monthly} used this
            month
            {quota.credits ? ` (+${quota.credits} earned from calls)` : ''}.
            Today's resets in {countdown(dayEnd, now)}.
          </span>
        )}
      </div>
    </section>
  )
}
