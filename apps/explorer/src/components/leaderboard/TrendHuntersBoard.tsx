/**
 * TrendHuntersBoard — the body of /spotters (TREND_HUNTER_SPEC §4, §5).
 * Order follows what the visitor needs first:
 *   signed in:  Your month | pages to sort + today's missions, then how it
 *               works → ranking → pages spotted this month
 *   signed out: how it works (+ sign in) → ranking → pages spotted
 * Free Recommends are spent on Trending, so their counter lives there.
 *
 * A spotted page: you were among its first 3, then 5 credible accounts
 * followed. Influence = Σ credibility of the accounts that followed you
 * (API fields: `calls`, `flair`).
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLogin } from '@privy-io/react-auth'
import type { Address } from 'viem'
import {
  AnimatedNumber,
  Avatar,
  ModuleHead,
  StatePill,
} from '@0xsofia/design-system'
import { ArrowUpRight } from 'lucide-react'
import SofiaLoader from '@/components/ui/SofiaLoader'
import EarlySignalsSection from '@/components/trending/EarlySignalsSection'
import MissionsPanel from '@/components/trending/MissionsPanel'
import HunterProgress from './HunterProgress'
import SortQueuePanel from './SortQueuePanel'
import { useEnsNames } from '@/hooks/useEnsNames'
import { CHROME_STORE_URL } from '@/utils/sofiaDetect'
import {
  CREDITS_PER_CALL,
  formatMonth,
  TREND_HUNTER_BADGE_RANK,
  useTrendHunters,
  type TrendHunterPool,
} from '@/hooks/useTrendHunters'
import '@0xsofia/design-system/styles/module-head.css'
import '@0xsofia/design-system/styles/state-pill.css'
import '@/components/styles/trend-hunter.css'

const influence = (n: number) => Math.round(n).toLocaleString()

function HowItWorks({
  pool,
  onSignIn,
}: {
  pool: TrendHunterPool | null
  onSignIn?: () => void
}) {
  const topSize = pool?.size ?? TREND_HUNTER_BADGE_RANK
  const steps = [
    {
      title: 'Be early',
      text: 'Recommend a page while it is still unknown: be among its first 3. The Sofia extension does it in one click from any page.',
      link: { href: CHROME_STORE_URL, label: 'Install Sofia' },
    },
    {
      title: 'Get followed',
      text: `When 5 credible accounts recommend it after you, it becomes a spotted page: +${CREDITS_PER_CALL} free Recommends. Each follower also adds to your Influence, and each mission you complete earns free Recommends too.`,
    },
    {
      title: `Make the Top ${topSize}`,
      text: pool
        ? `The Top ${topSize} by Influence share ${pool.trust.toLocaleString()} TRUST at the end of each month.`
        : `The Top ${topSize} by Influence earn the badge on their profile.`,
    },
  ]
  return (
    <section className="th-section" aria-label="How it works">
      <ModuleHead title="How it works" />
      <ol className="th-cards" style={{ listStyle: 'none', padding: 0 }}>
        {steps.map((step) => (
          <li key={step.title} className="th-card">
            <span className="th-card-title">{step.title}</span>
            <span className="th-desc">{step.text}</span>
            {'link' in step && step.link && (
              <a
                href={step.link.href}
                target="_blank"
                rel="noreferrer"
                className="th-strip-link th-card-link"
              >
                {step.link.label}
                <ArrowUpRight aria-hidden />
              </a>
            )}
          </li>
        ))}
      </ol>
      {onSignIn && (
        <button
          type="button"
          className="pm-dex-invest th-hero-cta"
          style={{ background: 'var(--ds-accent)', marginTop: 14 }}
          onClick={onSignIn}
        >
          Sign in to start spotting
        </button>
      )}
    </section>
  )
}

export default function TrendHuntersBoard({
  connectedAddress,
}: {
  connectedAddress?: string | null
}) {
  const { entries, month, pool, loading, error } = useTrendHunters(50)
  const { login } = useLogin()
  const wallets = useMemo(
    () => entries.map((e) => e.wallet as Address),
    [entries],
  )
  const { getDisplay, getAvatar } = useEnsNames(wallets)
  const me = connectedAddress?.toLowerCase()
  const monthLabel = month ? formatMonth(month) : ''
  const topSize = pool?.size ?? TREND_HUNTER_BADGE_RANK

  return (
    <div>
      {connectedAddress ? (
        <>
          <div className="th-bento">
            <HunterProgress wallet={connectedAddress} />
            <div className="th-bento-side">
              <SortQueuePanel walletAddress={connectedAddress} />
              <MissionsPanel walletAddress={connectedAddress} />
            </div>
          </div>
          <HowItWorks pool={pool} />
        </>
      ) : (
        <HowItWorks pool={pool} onSignIn={() => login()} />
      )}

      <section className="th-section" aria-label="Ranking">
        <ModuleHead
          title={`Ranking${monthLabel ? ` · ${monthLabel}` : ''}`}
          desc={
            pool
              ? `The Top ${topSize} share ${pool.trust.toLocaleString()} TRUST by Influence when the month ends.`
              : undefined
          }
        />
        {loading ? (
          <div className="pm-loader">
            <SofiaLoader size={48} />
          </div>
        ) : error ? (
          <p className="th-desc">The ranking is unavailable right now.</p>
        ) : entries.length === 0 ? (
          <p className="th-desc">
            Nobody is ranked yet this month: the first spotted page of{' '}
            {monthLabel} is still open.
          </p>
        ) : (
          <div className="th-table" role="table">
            <div className="th-row th-row--head" role="row">
              <span role="columnheader">#</span>
              <span role="columnheader">Spotter</span>
              <span role="columnheader">Spotted</span>
              <span role="columnheader" className="th-num">
                Influence
              </span>
              <span role="columnheader" className="th-num">
                Reward
              </span>
            </div>
            {entries.map((e) => {
              const addr = e.wallet as Address
              return (
                <Link
                  key={e.wallet}
                  to={`/profile/${e.wallet}`}
                  className={`th-row${e.wallet === me ? ' is-me' : ''}`}
                  role="row"
                >
                  <span className="th-rank">{e.rank}</span>
                  <span className="th-who">
                    <Avatar
                      label={getDisplay(addr)}
                      imageUrl={getAvatar(addr)}
                      size={28}
                    />
                    <span>{getDisplay(addr)}</span>
                    {e.rank <= topSize && (
                      <StatePill state="aligned" label={`Top ${topSize}`} />
                    )}
                  </span>
                  <span className="th-rank">{e.calls || '—'}</span>
                  <span className="th-num">
                    <AnimatedNumber value={e.flair} format={influence} />
                  </span>
                  <span className="th-num">
                    {e.reward ? (
                      <AnimatedNumber
                        value={e.reward}
                        format={(n) => `${n.toFixed(2)} TRUST`}
                      />
                    ) : (
                      '—'
                    )}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <EarlySignalsSection linkToBoard={false} />
    </div>
  )
}
