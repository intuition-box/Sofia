import { useState } from 'react';
import { Arrow } from './Arrow';
import { useScrollAnim } from '../hooks/useScrollAnim';
import { useTextSplit } from '../hooks/useTextSplit';
import { useVoteStats } from '../hooks/useVoteStats';
import { useVoting } from '../hooks/useVoting';
import { VALUES_DATA } from '../lib/config/constants';
import { URLS } from '../lib/config/urls';
import styles from './Values.module.css';

export function Values() {
  const headerRef = useScrollAnim<HTMLDivElement>();
  const titleRef = useTextSplit<HTMLHeadingElement>({ by: 'word' });
  const ctaRef = useScrollAnim<HTMLDivElement>();

  return (
    <section className={styles.section} id="values">
      <div className="container">
        <div ref={headerRef} className={`${styles.header} anim anim-up`}>
          <span className="mono-eyebrow">Manifesto</span>
          <h2 ref={titleRef} className={`section-title anim ${styles.title}`}>
            What we stand for.
          </h2>
          <p className="section-subtitle">
            These values define who we are. Stake your position on Intuition.
          </p>
        </div>

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
      </div>
    </section>
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
