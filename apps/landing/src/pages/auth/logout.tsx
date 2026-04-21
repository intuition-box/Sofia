/**
 * Sofia Logout Page
 *
 * Dedicated page for logging out from Privy and clearing all session data.
 * Uses the existing WalletProvider context - no duplicate PrivyProvider.
 */

import { useEffect, useState, useRef } from 'react';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useWalletConnection } from '@site/src/lib/web3/PrivyContext';
import styles from '../auth.module.css';

// Chrome extension API type declaration
declare const chrome: {
  runtime?: {
    sendMessage?: (
      extensionId: string,
      message: any,
      callback?: (response: any) => void
    ) => void;
  };
} | undefined;

// Notify extension that wallet is disconnected
const notifyExtensionDisconnected = (extensionId?: string) => {
  // Method 1: chrome.runtime.sendMessage
  if (extensionId && typeof chrome !== 'undefined' && chrome?.runtime?.sendMessage) {
    try {
      chrome.runtime.sendMessage(extensionId, {
        type: 'WALLET_DISCONNECTED'
      }, (response) => {
        console.log('[Sofia Logout] Extension notified:', response);
      });
    } catch (e) {
      console.log('[Sofia Logout] Failed to notify extension:', e);
    }
  }

  // Method 2: postMessage to opener
  if (window.opener) {
    window.opener.postMessage({ type: 'SOFIA_WALLET_DISCONNECTED' }, '*');
  }

  // Method 3: Clear localStorage
  try {
    // Clear Sofia-specific storage
    localStorage.removeItem('sofia_wallet_address');
    localStorage.removeItem('sofia_wallet_timestamp');

    // Clear all Privy-related storage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('privy') || key.includes('Privy'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log('[Sofia Logout] Removed:', key);
      } catch (e) {}
    });

    // Clear session storage
    sessionStorage.clear();

    console.log('[Sofia Logout] Storage cleared');
  } catch (e) {
    console.log('[Sofia Logout] Failed to clear storage:', e);
  }
};

const LogoutContent = () => {
  const { isConnected, disconnect } = useWalletConnection();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const logoutAttempted = useRef(false);

  // Get extension ID from URL params
  const extensionId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('extensionId') || undefined
    : undefined;

  useEffect(() => {
    if (logoutAttempted.current) return;
    logoutAttempted.current = true;

    const performLogout = async () => {
      console.log('[Sofia Logout] Starting logout, isConnected:', isConnected);

      try {
        // Call disconnect from wallet context (which calls Privy logout)
        if (isConnected) {
          await disconnect();
          console.log('[Sofia Logout] Wallet disconnected');
        }

        // Clear all storage and notify extension
        notifyExtensionDisconnected(extensionId);

        setStatus('success');
        console.log('[Sofia Logout] Logout complete');
      } catch (error) {
        console.error('[Sofia Logout] Error:', error);
        // Still clear storage even if disconnect fails
        notifyExtensionDisconnected(extensionId);
        setStatus('success'); // Show success anyway since we cleared storage
      }
    };

    // Small delay to ensure context is ready
    setTimeout(performLogout, 100);
  }, [isConnected, disconnect, extensionId]);

  const handleClose = () => {
    window.close();
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img src="/img/logoBrut.png" alt="Sofia" className={styles.logo} />

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
            <button className={styles.closeBtn} onClick={handleClose}>
              Close
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className={styles.errorIcon}>✕</div>
            <p className={styles.text}>Logout Failed</p>
            <p className={styles.subtext}>Please try again.</p>
            <button className={styles.btn} onClick={() => window.location.reload()}>
              Retry
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// Loading placeholder
const LoadingPlaceholder = () => (
  <div className={styles.container}>
    <div className={styles.card}>
      <img src="/img/logoBrut.png" alt="Sofia" className={styles.logo} />
      <div className={styles.spinner} />
      <p className={styles.text}>Loading...</p>
    </div>
  </div>
);

export default function LogoutPage() {
  return (
    <Layout
      title="Logout"
      description="Disconnect your wallet from Sofia"
      noFooter
    >
      <BrowserOnly fallback={<LoadingPlaceholder />}>
        {() => <LogoutContent />}
      </BrowserOnly>
    </Layout>
  );
}
