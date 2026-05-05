import { useState } from 'react';
import { useScrollAnim } from '../hooks/useScrollAnim';
import { useVoteStats } from '../hooks/useVoteStats';
import { useVoting } from '../hooks/useVoting';
import { VALUES_DATA } from '../lib/config/constants';
import { URLS } from '../lib/config/urls';
import styles from './Values.module.css';

export function Values() {
  const headerRef = useScrollAnim();

  return (
    <section className={styles.section} id="values">
      <div className="container">
        <div ref={headerRef} className={`${styles.header} anim`}>
          <h2 className="section-title">What we stand for.</h2>
          <p className="section-subtitle">These values define who we are. Stake your position on Intuition.</p>
        </div>

        <div className={styles.grid}>
          {VALUES_DATA.map((v, i) => (
            <ValueCard key={v.id} value={v} delay={i} />
          ))}
        </div>

        <div className="anim">
          <a href={URLS.external.values} target="_blank" rel="noopener noreferrer">
            <button className="btn-ghost" style={{ fontSize: '0.88rem' }}>Vote for our values &rarr;</button>
          </a>
        </div>
      </div>
    </section>
  );
}

function ValueCard({ value, delay }: { value: typeof VALUES_DATA[number]; delay: number }) {
  const ref = useScrollAnim();
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

  return (
    <div ref={ref} className={`${styles.card} anim ${delay > 0 ? `anim-d${delay}` : ''}`}>
      <div className={styles.trust}>
        {isLoading ? '...' : `${forDisplay} TRUST`} staked
      </div>
      <div className={styles.num}>VALUE {String(value.id).padStart(2, '0')}</div>
      <h3 className={styles.name}>{value.name}</h3>
      <p className={styles.desc}>{value.description}</p>
      <button
        className="btn-ghost"
        style={{ fontSize: '0.75rem' }}
        onClick={handleVote}
        disabled={voting}
      >
        {voting ? 'Signing...' : isConnected ? 'Support \u2191' : 'Connect to vote'}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
