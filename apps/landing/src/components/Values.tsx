import { useState } from 'react';
import { Arrow } from './Arrow';
import { useScrollAnim } from '../hooks/useScrollAnim';
import { useVoteStats } from '../hooks/useVoteStats';
import { useVoting } from '../hooks/useVoting';
import { VALUES_DATA } from '../lib/config/constants';
import { URLS } from '../lib/config/urls';
import { Module } from './Module';
import { ModuleHead } from './ModuleHead';
import styles from './Values.module.css';

export function Values() {
  const ctaRef = useScrollAnim<HTMLDivElement>();

  return (
    <Module id="values" code="S.07" label="DOCTRINE" meta={`${VALUES_DATA.length} VALUES · STAKEABLE`}>
      <ModuleHead
        eyebrow="What we stand for"
        title={
          <>
            Five values, on chain. <em>Stake your position.</em>
          </>
        }
        right={
          <p>
            Each value is a live triple on the Intuition Protocol. Support the
            ones you stand for; the protocol weights influence accordingly.
          </p>
        }
      />

      <div className={styles.grid}>
        {VALUES_DATA.map((v, i) => (
          <ValueCard key={v.id} value={v} index={i} />
        ))}
      </div>

      <div ref={ctaRef} className={`${styles.cta} anim`}>
        <a href={URLS.external.values} target="_blank" rel="noopener noreferrer" className={styles.ctaLink}>
          Vote for our values
          <Arrow />
        </a>
      </div>
    </Module>
  );
}

function ValueCard({ value, index }: { value: typeof VALUES_DATA[number]; index: number }) {
  const ref = useScrollAnim<HTMLDivElement>();
  const { forDisplay, isLoading } = useVoteStats(value.tripleId);
  const { depositFor, isConnected } = useVoting();
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async () => {
    setError(null);
    setVoting(true);
    try {
      await depositFor(value.tripleId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vote failed');
    } finally {
      setVoting(false);
    }
  };

  const delay = Math.min(index, 4);

  return (
    <article ref={ref} className={`${styles.card} anim anim-up ${delay > 0 ? `anim-d${delay}` : ''}`}>
      <header className={styles.cardHead}>
        <span className={styles.num}>VALUE {String(value.id).padStart(2, '0')}</span>
        <span className={styles.trust}>
          <span className={styles.trustNum}>{isLoading ? '…' : forDisplay}</span>
          <span className={styles.trustUnit}>TRUST</span>
        </span>
      </header>

      <h3 className={styles.name}>{value.name}</h3>
      <p className={styles.desc}>{value.description}</p>

      <button
        className={styles.vote}
        onClick={handleVote}
        disabled={voting}
      >
        {voting ? 'Signing…' : isConnected ? 'Support' : 'Connect to vote'}
        <span aria-hidden="true">↑</span>
      </button>

      {error && <p className={styles.error}>{error}</p>}
    </article>
  );
}
