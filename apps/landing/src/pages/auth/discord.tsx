/**
 * Sofia Discord OAuth Initiation Page
 *
 * This page initiates the Discord OAuth 2.0 Authorization Code flow.
 *
 * URL Parameters:
 * - extensionId: Chrome extension ID for sending token back
 */

import { useEffect, useState } from 'react';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';
import styles from '../auth.module.css';

// ============= CONFIGURATION =============
const DISCORD_CLIENT_ID = '1450535332360753317';
const DISCORD_REDIRECT_URI = 'https://sofia.intuition.box/auth/discord/callback';
const DISCORD_SCOPES = ['identify', 'email', 'guilds'];

// ============= HELPER FUNCTIONS =============

// Generate random string for state (CSRF protection)
const generateRandomString = (length: number): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

// ============= DISCORD AUTH CONTENT COMPONENT =============

const DiscordAuthContent = () => {
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const initiateOAuth = async () => {
      try {
        // Get extension ID from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const extensionId = urlParams.get('extensionId') || '';

        // Generate state for CSRF protection
        const state = generateRandomString(32);

        // Store OAuth state in localStorage for callback page
        localStorage.setItem('discord_oauth_state', JSON.stringify({
          state,
          extensionId,
          timestamp: Date.now()
        }));

        // Build Discord OAuth URL
        const params = new URLSearchParams({
          client_id: DISCORD_CLIENT_ID,
          redirect_uri: DISCORD_REDIRECT_URI,
          scope: DISCORD_SCOPES.join(' '),
          state: state,
          response_type: 'code'
        });

        const authUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;

        setStatus('redirecting');

        // Small delay to show redirecting message
        setTimeout(() => {
          window.location.href = authUrl;
        }, 500);

      } catch (error) {
        console.error('[Sofia Discord Auth] Error initiating OAuth:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Failed to initiate Discord authentication');
      }
    };

    initiateOAuth();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img src="/img/logoBrut.png" alt="Sofia" className={styles.logo} />
        <p className={styles.subtitle}>Discord Authentication</p>

        {status === 'loading' && (
          <>
            <div className={styles.spinner} />
            <p className={styles.text}>Preparing authentication...</p>
          </>
        )}

        {status === 'redirecting' && (
          <>
            <div className={styles.spinner} />
            <p className={styles.text}>Redirecting to Discord...</p>
            <p className={styles.subtext}>You will be asked to authorize Sofia</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className={styles.errorIcon}>✕</div>
            <p className={styles.text}>Authentication Failed</p>
            <p className={styles.subtext}>{errorMessage}</p>
            <button
              className={styles.btn}
              onClick={() => window.location.reload()}
            >
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
      <p className={styles.subtitle}>Discord Authentication</p>
      <div className={styles.spinner} />
      <p className={styles.text}>Loading...</p>
    </div>
  </div>
);

// ============= MAIN PAGE COMPONENT =============

export default function DiscordAuthPage() {
  return (
    <Layout
      title="Discord Authentication"
      description="Connect your Discord account to Sofia"
      noFooter
    >
      <BrowserOnly fallback={<LoadingPlaceholder />}>
        {() => <DiscordAuthContent />}
      </BrowserOnly>
    </Layout>
  );
}
