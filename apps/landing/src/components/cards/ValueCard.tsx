import { useState } from 'react'
import { useVoteStats } from '../../hooks/useVoteStats'
import { useVoting } from '../../hooks/useVoting'
/* Cross-import: the `valuePill` rule lives in App.module.css because
 * its hover effect cascades from `.placeholder a:hover` (the slide
 * wrapper class). Re-importing the same module here yields the same
 * scoped class, so the parent-hover selector keeps working. */
import appStyles from '../../App.module.css'

interface ValueCardProps {
  tag: string
  trust?: string
  title: string
  desc: string
  href?: string
  /** When provided, the card switches to live mode: TRUST count comes
   *  from `useVoteStats(tripleId)` and the bottom CTA becomes a real
   *  stake button wired to `useVoting().depositFor`. */
  tripleId?: `0x${string}`
}

/**
 * ValueCard — compact card used inside reveal-cell zones: eyebrow tag,
 * big mono TRUST figure (community conviction), then h-section title +
 * lede description. When `tripleId` is provided, switches to live mode
 * with on-chain vote stats and a real staking button.
 */
export function ValueCard({
  tag,
  trust,
  title,
  desc,
  href,
  tripleId,
}: ValueCardProps) {
  /* Live voting wiring — mirrors `components/Values.tsx` exactly so the
   * two staking surfaces share one implementation. Hooks run with a
   * placeholder tripleId when none is provided (safe no-op). */
  const liveTripleId =
    tripleId ??
    ('0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`)
  const { forDisplay, isLoading } = useVoteStats(liveTripleId)
  const { depositFor, isConnected } = useVoting()
  const [voting, setVoting] = useState(false)
  const [voteErr, setVoteErr] = useState<string | null>(null)
  const handleVote = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!tripleId) return
    setVoteErr(null)
    setVoting(true)
    try {
      await depositFor(tripleId)
    } catch (err) {
      setVoteErr(err instanceof Error ? err.message : 'Vote failed')
    } finally {
      setVoting(false)
    }
  }
  const liveTrust = tripleId ? (isLoading ? '…' : forDisplay) : trust
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        textAlign: 'left',
        textDecoration: 'none',
        color: 'inherit',
        cursor: href ? 'pointer' : 'default',
      }}>
      <span className="eyebrow">{tag}</span>
      {liveTrust && (
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            marginTop: 2,
            lineHeight: 0.95,
          }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(1.8rem, 1.2rem + 2.2vw, 3rem)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}>
            {liveTrust}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(0.7rem, 0.6rem + 0.25vw, 0.9rem)',
              fontWeight: 500,
              letterSpacing: '0.08em',
              opacity: 0.7,
            }}>
            TRUST
          </span>
        </div>
      )}
      <h3
        className="h-section"
        style={{
          margin: '6px 0 4px',
          fontSize: 'clamp(1rem, 0.85rem + 0.7vw, 1.6rem)',
          lineHeight: 1.1,
        }}>
        {title}
      </h3>
      <p
        className="lede"
        style={{
          margin: 0,
          fontSize: 'clamp(0.75rem, 0.68rem + 0.3vw, 0.95rem)',
          lineHeight: 1.4,
        }}>
        {desc}
      </p>
      {/* Bottom CTA — staking button takes precedence when a tripleId
       *  is wired; otherwise fall back to the "See on Intuition" pill.
       *  The button stops event propagation so clicking it doesn't also
       *  follow the wrapper `<a>` href. */}
      {tripleId ? (
        <button
          type="button"
          onClick={handleVote}
          disabled={voting}
          className={appStyles.valuePill}
          style={{
            marginTop: 10,
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            border: '1px solid currentColor',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-mono)',
            background: 'transparent',
            color: 'inherit',
            cursor: voting ? 'progress' : 'pointer',
            transition:
              'background 160ms ease, color 160ms ease, border-color 160ms ease',
          }}>
          {voting ? 'Signing…' : isConnected ? 'Support' : 'Connect to vote'}
          <span aria-hidden="true">↑</span>
        </button>
      ) : href ? (
        <span
          className={appStyles.valuePill}
          style={{
            marginTop: 10,
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            border: '1px solid currentColor',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-mono)',
            transition:
              'background 160ms ease, color 160ms ease, border-color 160ms ease',
          }}>
          See on Intuition <span aria-hidden="true">↗</span>
        </span>
      ) : null}
      {voteErr && (
        <p
          style={{
            margin: 0,
            fontSize: 11,
            color: '#e87c7c',
            fontFamily: 'var(--font-mono)',
          }}>
          {voteErr}
        </p>
      )}
    </a>
  )
}
