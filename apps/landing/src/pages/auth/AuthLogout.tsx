import { useEffect, useState, useRef } from 'react';
import { useWalletConnection } from '../../lib/web3/PrivyContext';
import { sendToExtension, DEFAULT_EXTENSION_ID } from './oauthConfig';
import styles from './auth.module.css';

export function AuthLogout() {
  const { isConnected, disconnect } = useWalletConnection();
  const [status, setStatus] = useState<'loading' | 'success'>('loading');
  const attempted = useRef(false);

  const extensionId = new URLSearchParams(window.location.search).get('extensionId') || undefined;

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    const performLogout = async () => {
      try {
        if (isConnected) await disconnect();
      } catch { /* continue anyway */ }

      sendToExtension({ type: 'WALLET_DISCONNECTED' }, extensionId === undefined ? DEFAULT_EXTENSION_ID : extensionId);

      try {
        localStorage.removeItem('sofia_wallet_address');
        localStorage.removeItem('sofia_wallet_type');
        localStorage.removeItem('sofia_wallet_timestamp');
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('privy') || key.includes('Privy'))) keys.push(key);
        }
        keys.forEach((k) => localStorage.removeItem(k));
        sessionStorage.clear();
      } catch { /* */ }

      setStatus('success');
    };

    setTimeout(performLogout, 100);
  }, [isConnected, disconnect, extensionId]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img src="/img/sofiaLogo.png" alt="Sofia" className={`${styles.logo} logo-invert`} />

        {status === 'loading' && (
          <>
            <div className={styles.spinner} />
            <p className={styles.text}>Logging out...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className={styles.checkmark}>✓</div>
            <p className={styles.text}>Logged Out</p>
            <p className={styles.subtext}>Your wallet has been disconnected from Sofia.</p>
            <button className={styles.closeBtn} onClick={() => window.close()}>Close</button>
          </>
        )}
      </div>
    </div>
  );
}
