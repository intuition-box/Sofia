import { useState } from 'react';
import { Arrow } from './Arrow';
import { useScrollAnim } from '../hooks/useScrollAnim';
import { useTextSplit } from '../hooks/useTextSplit';
import { useVoteStats } from '../hooks/useVoteStats';
import { useVoting } from '../hooks/useVoting';
import styles from './Citation.module.css';

interface CitationProps {
  quote: string;
  name: string;
  role: string;
  bio?: string;
  photo: string;
  tripleId?: `0x${string}`;
  blogLink: string;
  blogLabel: string;
  reversed?: boolean;
}

export function Citation({
  quote,
  name,
  role,
  bio,
  photo,
  tripleId,
  blogLink,
  blogLabel,
  reversed = false,
}: CitationProps) {
  const photoRef = useScrollAnim<HTMLDivElement>();
  const headerRef = useScrollAnim<HTMLDivElement>();
  const quoteRef = useTextSplit<HTMLQuoteElement>({ by: 'word' });
  const meta1Ref = useScrollAnim<HTMLDivElement>();
  const meta2Ref = useScrollAnim<HTMLDivElement>();

  const text = (
    <div className={styles.copy}>
      <div ref={headerRef} className={`${styles.eyebrow} mono-eyebrow anim`}>
        Founder voice
      </div>

      <blockquote ref={quoteRef} className={`${styles.quote} anim`}>
        {quote}
      </blockquote>

      <div ref={meta1Ref} className={`${styles.meta} anim anim-d2`}>
        <p className={styles.name}>{name}</p>
        <p className={styles.role}>{role}</p>
        {bio ? <p className={styles.bio}>{bio}</p> : null}
      </div>

      <div ref={meta2Ref} className={`${styles.actions} anim anim-d3`}>
        {tripleId ? (
          <VoteButton tripleId={tripleId} />
        ) : (
          <button className={styles.vote} disabled>
            Support
            <span aria-hidden="true">↑</span>
          </button>
        )}
        <a
          href={blogLink}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          {blogLabel}
          <Arrow />
        </a>
      </div>
    </div>
  );

  const figure = (
    <div ref={photoRef} className={`${styles.photo} anim ${reversed ? '' : 'anim-d2'}`}>
      <img src={photo} alt={name} />
    </div>
  );

  return (
    <article className={`${styles.cite} ${reversed ? styles.reversed : ''}`}>
      {reversed ? figure : text}
      {reversed ? text : figure}
    </article>
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
      <button className={styles.vote} onClick={handleVote} disabled={voting}>
        {voting ? 'Signing…' : isConnected ? 'Support' : 'Connect to vote'}
        <span aria-hidden="true">↑</span>
      </button>
      <span className={styles.voteCount}>
        {isLoading ? '…' : `${forDisplay} TRUST`}
      </span>
    </div>
  );
}
