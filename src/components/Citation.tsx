import { useState } from 'react';
import { useScrollAnim } from '../hooks/useScrollAnim';
import { useVoteStats } from '../hooks/useVoteStats';
import { useVoting } from '../hooks/useVoting';
import styles from './Citation.module.css';

interface CitationProps {
  quote: string;
  name: string;
  role: string;
  bio: string;
  photo: string;
  tripleId?: `0x${string}`;
  blogLink: string;
  blogLabel: string;
  reversed?: boolean;
}

export function Citation({
  quote, name, role, bio, photo, tripleId, blogLink, blogLabel, reversed = false,
}: CitationProps) {
  const textRef = useScrollAnim();
  const photoRef = useScrollAnim();

  return (
    <section className={`${styles.cite} ${reversed ? styles.reversed : ''}`}>
      {reversed && (
        <div ref={photoRef} className={`${styles.photo} anim`}>
          <img src={photo} alt={name} />
        </div>
      )}

      <div ref={textRef} className={`anim ${reversed ? '' : 'anim-d2'}`}>
        <blockquote className={styles.quote}>"{quote}"</blockquote>
        <p className={styles.name}>{name}</p>
        <p className={styles.role}>{role}</p>
        {bio && <p className={styles.bio}>{bio}</p>}
        {tripleId ? (
          <VoteButton tripleId={tripleId} />
        ) : (
          <div className={styles.voteRow}>
            <button className="btn-ghost" disabled>Support &uarr;</button>
          </div>
        )}
        <a href={blogLink} target="_blank" rel="noopener noreferrer" className={styles.link}>
          {blogLabel} &rarr;
        </a>
      </div>

      {!reversed && (
        <div ref={photoRef} className={`${styles.photo} anim anim-d2`}>
          <img src={photo} alt={name} />
        </div>
      )}
    </section>
  );
}

function VoteButton({ tripleId }: { tripleId: `0x${string}` }) {
  const { forDisplay, isLoading } = useVoteStats(tripleId);
  const { depositFor, isConnected } = useVoting();
  const [voting, setVoting] = useState(false);

  const handleVote = async () => {
    setVoting(true);
    try {
      await depositFor(tripleId);
    } catch {
      // error handled silently for now
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className={styles.voteRow}>
      <button className="btn-ghost" onClick={handleVote} disabled={voting}>
        {voting ? 'Signing...' : isConnected ? 'Support \u2191' : 'Connect to vote'}
      </button>
      <span className={styles.voteCount}>
        {isLoading ? '...' : `${forDisplay} TRUST`}
      </span>
    </div>
  );
}
