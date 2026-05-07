import { useState } from 'react'
import { useScrollAnim } from '../hooks/useScrollAnim'
import { useVoteStats } from '../hooks/useVoteStats'
import { useVoting } from '../hooks/useVoting'
import { VALUES_DATA } from '../lib/config/constants'
import { Section } from './Section'
import { SectionHead } from './SectionHead'
import styles from './Values.module.css'

export function Values() {
  return (
    <Section
      id="values"
      code="S.05"
      label="DOCTRINE"
      meta={`${VALUES_DATA.length} VALUES · STAKEABLE`}
      variant="peach"
    >
      <SectionHead
        eyebrow="What we stand for"
        title={
          <>
            Vote on the five values <em>that shape Sofia.</em>
          </>
        }
        sub="These are the convictions Sofia operates on. Stake TRUST behind the ones you stand by — your position is signed on-chain and visible in the protocol."
        variant="peach"
      />

      <div className={`${styles.grid} stagger`}>
        {VALUES_DATA.map((v, i) => (
          <ValueCard key={v.id} value={v} index={i} />
        ))}
      </div>
    </Section>
  )
}

function ValueCard({
  value,
  index,
}: {
  value: (typeof VALUES_DATA)[number]
  index: number
}) {
  const ref = useScrollAnim<HTMLElement>()
  const { forDisplay, isLoading } = useVoteStats(value.tripleId)
  const { depositFor, isConnected } = useVoting()
  const [voting, setVoting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleVote = async () => {
    setError(null)
    setVoting(true)
    try {
      await depositFor(value.tripleId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vote failed')
    } finally {
      setVoting(false)
    }
  }

  return (
    <article
      ref={ref}
      className={`${styles.card} anim anim-up`}
      style={{ ['--i' as never]: index }}
    >
      <header className={styles.cardHead}>
        <span className={styles.num}>
          VALUE {String(value.id).padStart(2, '0')}
        </span>
        <span className={styles.trust}>
          <span className={styles.trustNum}>
            {isLoading ? '…' : forDisplay}
          </span>
          <span className={styles.trustUnit}>TRUST</span>
        </span>
      </header>

      <h3 className={styles.name}>{value.name}</h3>
      <p className={styles.desc}>{value.description}</p>

      <button className={styles.vote} onClick={handleVote} disabled={voting}>
        {voting ? 'Signing…' : isConnected ? 'Support' : 'Connect to vote'}
        <span aria-hidden="true">↑</span>
      </button>

      {error && <p className={styles.error}>{error}</p>}
    </article>
  )
}
