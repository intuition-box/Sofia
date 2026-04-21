/**
 * Sofia YouTube OAuth Initiation Page
 *
 * This page initiates the YouTube/Google OAuth 2.0 Authorization Code flow.
 *
 * URL Parameters:
 * - extensionId: Chrome extension ID for sending token back
 */

import { useEffect, useState } from 'react';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';
import styles from '../auth.module.css';

// ============= CONFIGURATION =============
const YOUTUBE_CLIENT_ID = '301365654069-u5qmofalvpte890u4detr99pij8m8da3.apps.googleusercontent.com';
const YOUTUBE_REDIRECT_URI = 'https://sofia.intuition.box/auth/youtube/callback';
const YOUTUBE_SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];

// ============= HELPER FUNCTIONS =============

// Generate random string for state (CSRF protection)
const generateRandomString = (length: number): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

// ============= YOUTUBE AUTH CONTENT COMPONENT =============

const YouTubeAuthContent = () => {
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
        localStorage.setItem('youtube_oauth_state', JSON.stringify({
          state,
          extensionId,
          timestamp: Date.now()
        }));

        // Build YouTube/Google OAuth URL
        const params = new URLSearchParams({
          client_id: YOUTUBE_CLIENT_ID,
          redirect_uri: YOUTUBE_REDIRECT_URI,
          scope: YOUTUBE_SCOPES.join(' '),
          state: state,
          response_type: 'code',
          access_type: 'offline',
          prompt: 'consent'
        });

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

        setStatus('redirecting');

        // Small delay to show redirecting message
        setTimeout(() => {
          window.location.href = authUrl;
        }, 500);

      } catch (error) {
        console.error('[Sofia YouTube Auth] Error initiating OAuth:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Failed to initiate YouTube authentication');
      }
    };

    initiateOAuth();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img src="/img/logoBrut.png" alt="Sofia" className={styles.logo} />
        <p className={styles.subtitle}>YouTube Authentication</p>

        {status === 'loading' && (
          <>
            <div className={styles.spinner} />
            <p className={styles.text}>Preparing authentication...</p>
          </>
        )}

        {status === 'redirecting' && (
          <>
            <div className={styles.spinner} />
            <p className={styles.text}>Redirecting to Google...</p>
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
      <p className={styles.subtitle}>YouTube Authentication</p>
      <div className={styles.spinner} />
      <p className={styles.text}>Loading...</p>
    </div>
  </div>
);

// ============= MAIN PAGE COMPONENT =============

export default function YouTubeAuthPage() {
  return (
    <Layout
      title="YouTube Authentication"
      description="Connect your YouTube account to Sofia"
      noFooter
    >
      <BrowserOnly fallback={<LoadingPlaceholder />}>
        {() => <YouTubeAuthContent />}
      </BrowserOnly>
    </Layout>
  );
}
