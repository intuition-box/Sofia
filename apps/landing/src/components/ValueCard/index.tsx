import React, { useState } from 'react';
import { useVoting } from '@site/src/hooks/useVoting';
import { useVoteStats } from '@site/src/hooks/useVoteStats';
import { EXPLORER_URLS } from '@site/src/lib/config/chainConfig';
import styles from './index.module.css';

interface Value {
  id: number;
  name: string;
  description: string;
  tripleId: `0x${string}`;
}

interface ValueCardProps {
  value: Value;
  isWalletConnected: boolean;
  onConnectWallet: () => void;
}

type VoteType = 'vote' | 'downvote';
type TxStatus = 'idle' | 'pending' | 'success' | 'error';

export default function ValueCard({
  value,
  isWalletConnected,
  onConnectWallet,
}: ValueCardProps): React.ReactElement {
  const { depositFor, depositAgainst } = useVoting();
  const { forDisplay, againstDisplay, isLoading: statsLoading, refetch } = useVoteStats(value.tripleId);
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [activeVote, setActiveVote] = useState<VoteType | null>(null);

  const handleVote = async (voteType: VoteType) => {
    console.log('handleVote called:', { voteType, isWalletConnected, tripleId: value.tripleId });

    if (!isWalletConnected) {
      onConnectWallet();
      return;
    }

    setActiveVote(voteType);
    setTxStatus('pending');
    setTxError(null);
    setTxHash(null);

    try {
      console.log('Calling deposit function...');
      const hash = voteType === 'vote'
        ? await depositFor(value.tripleId)
        : await depositAgainst(value.tripleId);

      console.log('Transaction hash:', hash);
      setTxHash(hash);
      setTxStatus('success');
      // Refresh stats after successful vote
      refetch();
    } catch (err) {
      console.error('Vote error:', err);
      setTxError(err instanceof Error ? err.message : 'Transaction failed');
      setTxStatus('error');
    }
  };

  const resetState = () => {
    setTxStatus('idle');
    setTxHash(null);
    setTxError(null);
    setActiveVote(null);
  };

  return (
    <article className={styles.card}>
      <div className={styles.content}>
        <h3 className={styles.name}>{value.name}</h3>
        <p className={styles.description}>{value.description}</p>
      </div>

      <div className={styles.voteSection}>
        {txStatus === 'idle' && (
          <div className={styles.voteButtons}>
            <button
              className={`${styles.voteBtn} ${styles.supportBtn}`}
              onClick={() => handleVote('vote')}
              aria-label={`Vote for ${value.name}`}
            >
              <span className={styles.voteLabel}>Vote</span>
              <span className={styles.voteCount}>
                {statsLoading ? '...' : `${forDisplay} TRUST`}
              </span>
            </button>
            <button
              className={`${styles.voteBtn} ${styles.opposeBtn}`}
              onClick={() => handleVote('downvote')}
              aria-label={`Downvote ${value.name}`}
            >
              <span className={styles.voteLabel}>Downvote</span>
              <span className={styles.voteCount}>
                {statsLoading ? '...' : `${againstDisplay} TRUST`}
              </span>
            </button>
          </div>
        )}

        {txStatus === 'pending' && (
          <div className={styles.txPending}>
            <div className={styles.spinner} />
            <p className={styles.txText}>
              {activeVote === 'vote' ? 'Voting for' : 'Downvoting'} {value.name}...
            </p>
            <p className={styles.txSubtext}>Confirm in MetaMask</p>
          </div>
        )}

        {txStatus === 'success' && txHash && (
          <div className={styles.txSuccess}>
            <span className={styles.checkmark}>&#10003;</span>
            <p className={styles.txText}>Vote recorded!</p>
            <a
              href={`${EXPLORER_URLS.TRANSACTION}${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.txLink}
            >
              View transaction
            </a>
            <button className={styles.resetBtn} onClick={resetState}>
              Vote again
            </button>
          </div>
        )}

        {txStatus === 'error' && (
          <div className={styles.txError}>
            <span className={styles.errorIcon}>&#10005;</span>
            <p className={styles.txText}>{txError}</p>
            <button className={styles.retryBtn} onClick={resetState}>
              Try again
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
