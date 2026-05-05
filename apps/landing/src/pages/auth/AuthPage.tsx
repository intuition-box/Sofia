import { useEffect, useState, useCallback, useRef } from 'react';
import { useWalletConnection } from '../../lib/web3/PrivyContext';
import { sendToExtension, DEFAULT_EXTENSION_ID } from './oauthConfig';
import styles from './auth.module.css';

function getExtensionId() {
  return new URLSearchParams(window.location.search).get('extensionId') || DEFAULT_EXTENSION_ID;
}

export function AuthPage() {
  const { address, walletType, isConnected, isConnecting, error, connect, disconnect, clearError } = useWalletConnection();
  const [hasSent, setHasSent] = useState(false);
  const [claimStatus, setClaimStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const autoLoginTriggered = useRef(false);
  const extensionId = getExtensionId();

  useEffect(() => {
    if (isConnected && address && !hasSent) {
      sendToExtension({
        type: 'WALLET_CONNECTED',
        walletAddress: address,
        walletType: walletType || 'unknown',
      }, extensionId);

      try {
        localStorage.setItem('sofia_wallet_address', address);
        localStorage.setItem('sofia_wallet_type', walletType || 'unknown');
        localStorage.setItem('sofia_wallet_timestamp', Date.now().toString());
      } catch { /* not available */ }

      setHasSent(true);
    }
  }, [isConnected, address, walletType, extensionId, hasSent]);

  useEffect(() => {
    if (autoLoginTriggered.current) return;
    const autoLogin = new URLSearchParams(window.location.search).get('autoLogin');
    if (autoLogin === 'true' && !isConnected && !isConnecting) {
      autoLoginTriggered.current = true;
      connect();
    }
  }, [isConnected, isConnecting, connect]);

  const handleFirstClaim = useCallback(async () => {
    setClaimStatus('sending');
    sendToExtension({
      type: 'FIRST_CLAIM',
      data: { url: 'https://sofia.intuition.box' },
    }, extensionId);
    setClaimStatus('sent');
    setTimeout(() => { window.location.href = '/'; }, 1500);
  }, [extensionId]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
    setHasSent(false);
    try {
      localStorage.removeItem('sofia_wallet_address');
      localStorage.removeItem('sofia_wallet_type');
      localStorage.removeItem('sofia_wallet_timestamp');
    } catch { /* */ }
  }, [disconnect]);

  const status = error ? 'error' : (isConnected && address) ? 'success' : isConnecting ? 'loading' : 'connect';

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img src="/img/sofiaLogo.png" alt="Sofia" className={`${styles.logo} logo-invert`} />
        <p className={styles.subtitle}>Secure Wallet Connection</p>

        {status === 'loading' && (
          <>
            <div className={styles.spinner} />
            <p className={styles.text}>Connecting...</p>
          </>
        )}

        {status === 'connect' && (
          <>
            <p className={styles.text}>Connect your wallet</p>
            <p className={styles.subtext}>Connect with MetaMask or another Web3 wallet</p>
            <button className={styles.btn} onClick={connect}>Connect Wallet</button>
          </>
        )}

        {status === 'success' && address && (
          <>
            <div className={styles.checkmark}>✓</div>
            <p className={styles.text}>Wallet Connected!</p>
            <div className={styles.walletAddress}>{address.slice(0, 6)}...{address.slice(-4)}</div>

            {claimStatus === 'idle' && (
              <>
                <div className={styles.instructions}>
                  <p className={styles.instructionsText}>Your wallet is connected. Create your first claim to get started with Sofia.</p>
                </div>
                <button className={styles.claimBtn} onClick={handleFirstClaim}>Create your first claim</button>
              </>
            )}

            {claimStatus === 'sending' && <div className={styles.spinner} />}

            {claimStatus === 'sent' && (
              <div className={styles.instructions}>
                <p className={styles.instructionsText}>Your first claim has been sent to the extension. You can close this tab.</p>
              </div>
            )}

            <button className={styles.disconnectBtn} onClick={handleDisconnect}>Disconnect</button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className={styles.errorIcon}>✕</div>
            <p className={styles.text}>Connection Failed</p>
            <p className={styles.subtext}>{error}</p>
            <button className={styles.btn} onClick={clearError}>Try Again</button>
          </>
        )}
      </div>
    </div>
  );
}
