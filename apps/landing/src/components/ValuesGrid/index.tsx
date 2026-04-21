import React from 'react';
import ValueCard from '@site/src/components/ValueCard';
import { useWalletConnection } from '@site/src/hooks/useWalletConnection';
import { VALUES_DATA } from '@site/src/lib/config/constants';
import { formatAddress } from '@site/src/lib/web3/utils';
import styles from './index.module.css';

export default function ValuesGrid(): React.ReactElement {
  const {
    address,
    isConnected,
    connect,
    disconnect,
    isConnecting,
    error,
    clearError,
  } = useWalletConnection();

  return (
    <div className={styles.container}>
      {/* Wallet Connection Banner */}
      <div className={styles.walletBanner}>
        {isConnected && address ? (
          <div className={styles.connectedInfo}>
            <span className={styles.connectedDot} />
            <span className={styles.networkLabel}>Intuition</span>
            <span className={styles.address}>{formatAddress(address)}</span>
            <button className={styles.disconnectBtn} onClick={disconnect}>
              Disconnect
            </button>
          </div>
        ) : (
          <div className={styles.connectSection}>
            <button
              className={styles.connectBtn}
              onClick={connect}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet to Vote'}
            </button>
            <p className={styles.connectHint}>
              Vote with 10 TRUST per position on Intuition
            </p>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className={styles.errorBanner}>
          <p className={styles.errorText}>{error}</p>
          <button className={styles.errorDismiss} onClick={clearError}>
            Dismiss
          </button>
        </div>
      )}

      {/* Values Grid */}
      <div className={styles.grid}>
        {VALUES_DATA.map((value) => (
          <ValueCard
            key={value.id}
            value={value}
            isWalletConnected={isConnected}
            onConnectWallet={connect}
          />
        ))}
      </div>

      {/* Info Footer */}
      <div className={styles.infoFooter}>
        <p className={styles.infoText}>
          Your vote is recorded on-chain via{' '}
          <a
            href="https://intuition.systems"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.infoLink}
          >
            Intuition Protocol
          </a>
          . Each vote stakes 10 TRUST which you can redeem later.
        </p>
      </div>
    </div>
  );
}
