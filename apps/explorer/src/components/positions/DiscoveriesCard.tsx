/**
 * DiscoveriesCard — on My positions: the pages this wallet recommended first
 * (CREATOR_REWARDS_SPEC §A). Count, followers who came after, and the P&L of
 * those early positions — the reward the page market already pays.
 */
import { AnimatedNumber, ModuleHead } from '@0xsofia/design-system'
import type { Discovery } from '@/services/discoveriesService'
import {
  formatTrustChange,
  formatTrustChangeAmount,
  trustAmount,
} from '@/utils/formatting'
import { getFaviconUrl } from '@/utils/favicon'
import '@0xsofia/design-system/styles/module-head.css'
import '@/components/styles/trend-hunter.css'

/** Rows shown before "+N more" */
const PREVIEW = 5

function leadLabel(d: Discovery): string {
  if (d.leadDays === null) return 'No follower yet'
  if (d.leadDays < 1) return 'Followed the same day'
  return `${d.leadDays} day${d.leadDays === 1 ? '' : 's'} before the next`
}

const changeClass = (raw: string) => {
  const v = BigInt(raw || '0')
  return v > 0n ? 'up' : v < 0n ? 'down' : ''
}

export default function DiscoveriesCard({
  isOwn,
  discoveries,
  followers,
  change,
}: {
  isOwn: boolean
  discoveries: Discovery[]
  followers: number
  change: string
}) {
  if (discoveries.length === 0) return null

  return (
    <section className="th-section" aria-label="Discoveries">
      <ModuleHead
        title={isOwn ? 'Your discoveries' : 'Discoveries'}
        desc={`Pages ${isOwn ? 'you' : 'this wallet'} recommended first. An early position gains as others follow.`}
      />
      <div className="mk-summary">
        <div className="mk-summary-stat">
          <span className="mk-summary-value">
            <AnimatedNumber value={discoveries.length} />
          </span>
          <span className="mk-summary-label">Pages discovered</span>
        </div>
        <div className="mk-summary-stat">
          <span className="mk-summary-value">
            <AnimatedNumber value={followers} flash />
          </span>
          <span className="mk-summary-label">Followers after you</span>
        </div>
        <div className="mk-summary-stat">
          <span className={`mk-summary-value mk-change ${changeClass(change)}`}>
            <AnimatedNumber
              value={trustAmount(change)}
              format={formatTrustChangeAmount}
            />
          </span>
          <span className="mk-summary-label">P&amp;L on discoveries</span>
        </div>
      </div>
      <div className="th-table" role="table" aria-label="Discoveries">
        {discoveries.slice(0, PREVIEW).map((d) => (
          <div key={d.claimTermId} className="th-row" role="row">
            <span className="th-rank">
              {d.domain && (
                <img
                  src={getFaviconUrl(d.domain, 32)}
                  alt=""
                  width={18}
                  height={18}
                  style={{ borderRadius: 4 }}
                />
              )}
            </span>
            <span className="th-who">
              {d.url ? (
                <a href={d.url} target="_blank" rel="noreferrer">
                  {d.title}
                </a>
              ) : (
                <span>{d.title}</span>
              )}
            </span>
            <span className="th-rank">
              {d.followers} follower{d.followers === 1 ? '' : 's'} ·{' '}
              {leadLabel(d)}
            </span>
            <span className={`th-num mk-change ${changeClass(d.change)}`}>
              {formatTrustChange(d.change)}
            </span>
          </div>
        ))}
      </div>
      {discoveries.length > PREVIEW && (
        <p className="th-foot">
          +{discoveries.length - PREVIEW} more in Claims below
        </p>
      )}
    </section>
  )
}
