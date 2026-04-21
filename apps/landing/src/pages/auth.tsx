/**
 * Sofia External Auth Page for Chrome Extension
 *
 * This page handles Privy wallet authentication and sends the wallet address
 * back to the Chrome extension via multiple communication methods.
 *
 * URL Parameters:
 * - extensionId: Chrome extension ID for direct messaging
 * - callback: URL to redirect with wallet address
 * - autoLogin: Set to "true" to auto-trigger login modal
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useWalletConnection } from '@site/src/lib/web3/PrivyContext';
import styles from './auth.module.css';

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

// Default extension ID - can be overridden via URL param
const DEFAULT_EXTENSION_ID = 'YOUR_EXTENSION_ID_HERE';

// ============= HELPER FUNCTIONS =============

// Send wallet address and type to extension via multiple methods (does NOT auto-close)
const sendToExtension = (address: string, walletType: string | null, extensionId?: string) => {
  console.log('[Sofia Auth] Sending to extension:', { address, walletType });

  // Method 1: chrome.runtime.sendMessage (if extension ID is known)
  if (extensionId && extensionId !== DEFAULT_EXTENSION_ID &&
      typeof chrome !== 'undefined' && chrome?.runtime?.sendMessage) {
    try {
      chrome.runtime.sendMessage(extensionId, {
        type: 'WALLET_CONNECTED',
        walletAddress: address,
        walletType: walletType || 'unknown'
      }, (response) => {
        console.log('[Sofia Auth] Extension response:', response);
        // Don't auto-close - let user see the success state
      });
    } catch (e) {
      console.log('[Sofia Auth] Failed to send to extension:', e);
    }
  }

  // Method 2: postMessage to opener window
  if (window.opener) {
    window.opener.postMessage({
      type: 'SOFIA_WALLET_CONNECTED',
      address: address,
      walletType: walletType || 'unknown'
    }, '*');
    console.log('[Sofia Auth] Sent postMessage to opener');
  }

  // Method 3: Store in localStorage for polling
  try {
    localStorage.setItem('sofia_wallet_address', address);
    localStorage.setItem('sofia_wallet_type', walletType || 'unknown');
    localStorage.setItem('sofia_wallet_timestamp', Date.now().toString());
    console.log('[Sofia Auth] Stored in localStorage');
  } catch (e) {
    console.log('[Sofia Auth] LocalStorage not available');
  }

  // Method 4: URL callback redirect (only if explicitly requested)
  const urlParams = new URLSearchParams(window.location.search);
  const callbackUrl = urlParams.get('callback');
  if (callbackUrl) {
    try {
      const redirectUrl = new URL(callbackUrl);
      redirectUrl.searchParams.set('address', address);
      redirectUrl.searchParams.set('walletType', walletType || 'unknown');
      console.log('[Sofia Auth] Redirecting to callback:', redirectUrl.toString());
      setTimeout(() => {
        window.location.href = redirectUrl.toString();
      }, 1500);
    } catch (e) {
      console.log('[Sofia Auth] Invalid callback URL');
    }
  }
};

// ============= AUTH CONTENT COMPONENT =============

const AuthContent = () => {
  const { address, walletType, isConnected, isConnecting, error, connect, disconnect, clearError } = useWalletConnection();
  const [hasSentToExtension, setHasSentToExtension] = useState(false);
  const autoLoginTriggered = useRef(false);

  // Get extension ID from URL params
  const extensionId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('extensionId') || DEFAULT_EXTENSION_ID
    : DEFAULT_EXTENSION_ID;

  // Send to extension when connected
  useEffect(() => {
    if (isConnected && address && !hasSentToExtension) {
      console.log('[Sofia Auth] Wallet connected, sending to extension:', { address, walletType });
      sendToExtension(address, walletType, extensionId);
      setHasSentToExtension(true);
    }
  }, [isConnected, address, walletType, extensionId, hasSentToExtension]);

  // Auto-trigger login if specified in URL (only once)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (autoLoginTriggered.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const autoLogin = urlParams.get('autoLogin');

    if (autoLogin === 'true' && !isConnected && !isConnecting) {
      autoLoginTriggered.current = true;
      connect();
    }
  }, [isConnected, isConnecting, connect]);

  const handleClose = useCallback(() => {
    window.close();
  }, []);

  const handleRetry = useCallback(() => {
    clearError();
  }, [clearError]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
    setHasSentToExtension(false);
    try {
      localStorage.removeItem('sofia_wallet_address');
      localStorage.removeItem('sofia_wallet_type');
      localStorage.removeItem('sofia_wallet_timestamp');
    } catch (e) {}
  }, [disconnect]);

  // Determine display status
  const getStatus = () => {
    if (error) return 'error';
    if (isConnected && address) return 'success';
    if (isConnecting) return 'loading';
    return 'connect';
  };

  const status = getStatus();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img src="/img/logoBrut.png" alt="Sofia" className={styles.logo} />
        <p className={styles.subtitle}>Secure Wallet Connection</p>

        {/* Loading State */}
        {status === 'loading' && (
          <>
            <div className={styles.spinner} />
            <p className={styles.text}>Connecting...</p>
          </>
        )}

        {/* Connect State */}
        {status === 'connect' && (
          <>
            <p className={styles.text}>Connect your wallet</p>
            <p className={styles.subtext}>Connect with MetaMask or another Web3 wallet</p>
            <button className={styles.btn} onClick={connect}>
              Connect Wallet
            </button>
          </>
        )}

        {/* Success State */}
        {status === 'success' && address && (
          <>
            <div className={styles.checkmark}>✓</div>
            <p className={styles.text}>Wallet Connected!</p>
            <div className={styles.walletAddress}>
              {address.slice(0, 6)}...{address.slice(-4)}
            </div>
            <div className={styles.instructions}>
              <p className={styles.instructionsText}>
                Your wallet is now connected to Sofia. You can close this tab.
              </p>
            </div>
            <button className={styles.closeBtn} onClick={handleClose}>
              Close
            </button>
            <button className={styles.disconnectBtn} onClick={handleDisconnect}>
              Disconnect
            </button>
          </>
        )}

        {/* Error State */}
        {status === 'error' && (
          <>
            <div className={styles.errorIcon}>✕</div>
            <p className={styles.text}>Connection Failed</p>
            <p className={styles.subtext}>{error}</p>
            <button className={styles.btn} onClick={handleRetry}>
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// Loading placeholder for SSR
const LoadingPlaceholder = () => (
  <div className={styles.container}>
    <div className={styles.card}>
      <img src="/img/logoBrut.png" alt="Sofia" className={styles.logo} />
      <p className={styles.subtitle}>Secure Wallet Connection</p>
      <div className={styles.spinner} />
      <p className={styles.text}>Loading...</p>
    </div>
  </div>
);

// ============= MAIN PAGE COMPONENT =============

export default function SofiaAuthPage() {
  return (
    <Layout
      title="Wallet Authentication"
      description="Connect your wallet to Sofia Chrome Extension"
      noFooter
    >
      <BrowserOnly fallback={<LoadingPlaceholder />}>
        {() => <AuthContent />}
      </BrowserOnly>
    </Layout>
  );
}
