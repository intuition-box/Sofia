/**
 * FreeRecommendsStrip — atop /trending, where free Recommends are spent: how
 * many are left (today / this month), when today's reset, what spotted pages
 * and missions added, and the way to Spotters to earn more. Logged out: what signing
 * in gives.
 */
import { Link } from 'react-router-dom'
import { useLogin, usePrivy } from '@privy-io/react-auth'
import { ArrowRight } from 'lucide-react'
import { AnimatedNumber } from '@0xsofia/design-system'
import { useMinuteClock, nextUtcDay } from '@/hooks/useMinuteClock'
import { useSponsorQuota } from '@/hooks/useSponsoredWrite'
import { countdown } from '@/utils/formatting'
import '@/components/styles/trend-hunter.css'

export default function FreeRecommendsStrip() {
  const { ready, authenticated } = usePrivy()
  const { login } = useLogin()
  const { quota } = useSponsorQuota()
  const now = useMinuteClock()

  const earnMore = (
    <Link to="/spotters" className="th-strip-link">
      Earn more <ArrowRight aria-hidden />
    </Link>
  )

  if (ready && !authenticated) {
    return (
      <div className="th-strip">
        <span className="th-strip-main">
          Sign in and Recommend pages for free, every month.
        </span>
        <button type="button" className="th-strip-cta" onClick={() => login()}>
          Sign in
        </button>
      </div>
    )
  }
  if (!quota?.eligible) return null

  const monthLeft = Math.max(
    0,
    (quota.limits?.monthly ?? 0) - (quota.used?.month ?? 0),
  )
  return (
    <div className="th-strip">
      <span className="th-strip-main">
        <b>
          <AnimatedNumber value={quota.left ?? 0} flash />
        </b>{' '}
        free Recommend{quota.left === 1 ? '' : 's'} left today
      </span>
      <span className="th-strip-meta">
        {monthLeft} this month · resets in {countdown(nextUtcDay(now), now)}
        {quota.credits ? ` · +${quota.credits} earned this month` : ''}
      </span>
      {earnMore}
    </div>
  )
}
