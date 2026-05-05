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
import { logger } from '@site/src/lib/logger';

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

// Send FIRST_CLAIM message to extension to trigger onboarding
const sendFirstClaim = (extensionId: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (extensionId === DEFAULT_EXTENSION_ID ||
        typeof chrome === 'undefined' || !chrome?.runtime?.sendMessage) {
      logger.log('[Sofia Auth] Cannot send FIRST_CLAIM: no valid extension ID or chrome API');
      resolve(false);
      return;
    }

    try {
      chrome.runtime.sendMessage(extensionId, {
        type: 'FIRST_CLAIM',
        data: {
          url: 'https://sofia.intuition.box'
        }
      }, (response) => {
        logger.log('[Sofia Auth] FIRST_CLAIM response:', response);
        resolve(response?.success === true);
      });
    } catch (e) {
      logger.log('[Sofia Auth] Failed to send FIRST_CLAIM:', e);
      resolve(false);
    }
  });
};

// Send wallet address and type to extension via multiple methods (does NOT auto-close)
const sendToExtension = (address: string, walletType: string | null, extensionId?: string) => {
  logger.log('[Sofia Auth] Sending to extension:', { address, walletType });

  // Method 1: chrome.runtime.sendMessage (if extension ID is known)
  if (extensionId && extensionId !== DEFAULT_EXTENSION_ID &&
      typeof chrome !== 'undefined' && chrome?.runtime?.sendMessage) {
    try {
      chrome.runtime.sendMessage(extensionId, {
        type: 'WALLET_CONNECTED',
        walletAddress: address,
        walletType: walletType || 'unknown'
      }, (response) => {
        logger.log('[Sofia Auth] Extension response:', response);
        // Don't auto-close - let user see the success state
      });
    } catch (e) {
      logger.log('[Sofia Auth] Failed to send to extension:', e);
    }
  }

  // Method 2: postMessage to opener window
  if (window.opener) {
    window.opener.postMessage({
      type: 'SOFIA_WALLET_CONNECTED',
      address: address,
      walletType: walletType || 'unknown'
    }, '*');
    logger.log('[Sofia Auth] Sent postMessage to opener');
  }

  // Method 3: Store in localStorage for polling
  try {
    localStorage.setItem('sofia_wallet_address', address);
    localStorage.setItem('sofia_wallet_type', walletType || 'unknown');
    localStorage.setItem('sofia_wallet_timestamp', Date.now().toString());
    logger.log('[Sofia Auth] Stored in localStorage');
  } catch (e) {
    logger.log('[Sofia Auth] LocalStorage not available');
  }

  // Method 4: URL callback redirect (only if explicitly requested)
  const urlParams = new URLSearchParams(window.location.search);
  const callbackUrl = urlParams.get('callback');
  if (callbackUrl) {
    try {
      const redirectUrl = new URL(callbackUrl);
      redirectUrl.searchParams.set('address', address);
      redirectUrl.searchParams.set('walletType', walletType || 'unknown');
      logger.log('[Sofia Auth] Redirecting to callback:', redirectUrl.toString());
      setTimeout(() => {
        window.location.href = redirectUrl.toString();
      }, 1500);
    } catch (e) {
      logger.log('[Sofia Auth] Invalid callback URL');
    }
  }
};

// ============= AUTH CONTENT COMPONENT =============

const AuthContent = () => {
  const { address, walletType, isConnected, isConnecting, error, connect, disconnect, clearError } = useWalletConnection();
  const [hasSentToExtension, setHasSentToExtension] = useState(false);
  const [claimStatus, setClaimStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const autoLoginTriggered = useRef(false);

  // Get extension ID from URL params
  const extensionId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('extensionId') || DEFAULT_EXTENSION_ID
    : DEFAULT_EXTENSION_ID;

  // Send wallet info to extension when connected (FIRST_CLAIM waits for user click)
  useEffect(() => {
    if (isConnected && address && !hasSentToExtension) {
      logger.log('[Sofia Auth] Wallet connected, sending to extension:', { address, walletType });
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

  const handleFirstClaim = useCallback(async () => {
    setClaimStatus('sending');
    await sendFirstClaim(extensionId);
    setClaimStatus('sent');
    setTimeout(() => {
      window.location.href = 'https://sofia.intuition.box';
    }, 1500);
  }, [extensionId]);

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
        <img src="/img/logoWhite.svg" alt="Sofia" className={styles.logo} />
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

            {claimStatus === 'idle' && (
              <>
                <div className={styles.instructions}>
                  <p className={styles.instructionsText}>
                    Your wallet is connected. Create your first claim to get started with Sofia.
                  </p>
                </div>
                <button className={styles.claimBtn} onClick={handleFirstClaim}>
                  Create your first claim
                </button>
              </>
            )}

            {claimStatus === 'sending' && (
              <>
                <div className={styles.spinner} />
                <p className={styles.subtext}>Sending to extension...</p>
              </>
            )}

            {claimStatus === 'sent' && (
              <div className={styles.instructions}>
                <p className={styles.instructionsText}>
                  Your first claim has been sent to the extension. You can close this tab.
                </p>
              </div>
            )}

            {claimStatus === 'error' && (
              <div className={styles.instructions}>
                <p className={styles.instructionsText}>
                  Could not reach the extension. Make sure Sofia is installed and try again.
                </p>
              </div>
            )}

            {(claimStatus === 'error' || claimStatus === 'sent') && (
              <button className={styles.closeBtn} onClick={handleClose}>
                Close
              </button>
            )}

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
      <img src="/img/logoWhite.svg" alt="Sofia" className={styles.logo} />
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
