import { useState } from 'react'
import { useVoteStats } from '../../hooks/useVoteStats'
import { useVoting } from '../../hooks/useVoting'
import styles from './Card.module.css'

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
 * with on-chain vote stats and a real staking button. All styling lives
 * in Card.module.css; pill hover handled by CSS :hover so no JS state.
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
      className={styles.valueShell}
      data-linkable={href ? 'true' : 'false'}>
      <span className="eyebrow">{tag}</span>
      {liveTrust && (
        <div className={styles.valueTrustRow}>
          <span className={styles.valueTrustFigure}>{liveTrust}</span>
          <span className={styles.valueTrustUnit}>TRUST</span>
        </div>
      )}
      <h3 className={`h-section ${styles.valueTitle}`}>{title}</h3>
      <p className={`lede ${styles.valueDesc}`}>{desc}</p>
      {/* Bottom CTA — staking button takes precedence when a tripleId
       *  is wired; otherwise fall back to the "See on Intuition" pill.
       *  The button stops event propagation so clicking it doesn't also
       *  follow the wrapper `<a>` href. */}
      {tripleId ? (
        <button
          type="button"
          onClick={handleVote}
          disabled={voting}
          className={styles.pill}
          data-vote-state={voting ? 'signing' : 'idle'}>
          {voting ? 'Signing…' : isConnected ? 'Support' : 'Connect to vote'}
          <span aria-hidden="true">↑</span>
        </button>
      ) : href ? (
        <span className={styles.pill}>
          See on Intuition <span aria-hidden="true">↗</span>
        </span>
      ) : null}
      {voteErr && <p className={styles.valueErr}>{voteErr}</p>}
    </a>
  )
}
