/**
 * Sofia Spotify OAuth Initiation Page
 *
 * This page initiates the Spotify OAuth 2.0 Authorization Code flow.
 *
 * URL Parameters:
 * - extensionId: Chrome extension ID for sending token back
 */

import { useEffect, useState } from 'react';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';
import styles from '../auth.module.css';

// ============= CONFIGURATION =============
const SPOTIFY_CLIENT_ID = 'a60a4664664f44cc94ef402b3253cbc9';
const SPOTIFY_REDIRECT_URI = 'https://sofia.intuition.box/auth/spotify/callback';
const SPOTIFY_SCOPES = ['user-read-private', 'user-follow-read', 'user-top-read'];

// ============= HELPER FUNCTIONS =============

// Generate random string for state (CSRF protection)
const generateRandomString = (length: number): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

// ============= SPOTIFY AUTH CONTENT COMPONENT =============

const SpotifyAuthContent = () => {
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
        localStorage.setItem('spotify_oauth_state', JSON.stringify({
          state,
          extensionId,
          timestamp: Date.now()
        }));

        // Build Spotify OAuth URL
        const params = new URLSearchParams({
          client_id: SPOTIFY_CLIENT_ID,
          redirect_uri: SPOTIFY_REDIRECT_URI,
          scope: SPOTIFY_SCOPES.join(' '),
          state: state,
          response_type: 'code'
        });

        const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

        setStatus('redirecting');

        // Small delay to show redirecting message
        setTimeout(() => {
          window.location.href = authUrl;
        }, 500);

      } catch (error) {
        console.error('[Sofia Spotify Auth] Error initiating OAuth:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Failed to initiate Spotify authentication');
      }
    };

    initiateOAuth();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img src="/img/logoBrut.png" alt="Sofia" className={styles.logo} />
        <p className={styles.subtitle}>Spotify Authentication</p>

        {status === 'loading' && (
          <>
            <div className={styles.spinner} />
            <p className={styles.text}>Preparing authentication...</p>
          </>
        )}

        {status === 'redirecting' && (
          <>
            <div className={styles.spinner} />
            <p className={styles.text}>Redirecting to Spotify...</p>
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
      <p className={styles.subtitle}>Spotify Authentication</p>
      <div className={styles.spinner} />
      <p className={styles.text}>Loading...</p>
    </div>
  </div>
);

// ============= MAIN PAGE COMPONENT =============

export default function SpotifyAuthPage() {
  return (
    <Layout
      title="Spotify Authentication"
      description="Connect your Spotify account to Sofia"
      noFooter
    >
      <BrowserOnly fallback={<LoadingPlaceholder />}>
        {() => <SpotifyAuthContent />}
      </BrowserOnly>
    </Layout>
  );
}
