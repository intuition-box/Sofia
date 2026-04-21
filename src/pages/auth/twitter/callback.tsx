/**
 * Sofia Twitter/X OAuth Callback Page
 *
 * This page handles the Twitter OAuth callback:
 * 1. Receives authorization code from Twitter
 * 2. Exchanges code for access token via Sofia API
 * 3. Sends token back to Chrome extension
 *
 * URL Parameters (from Twitter):
 * - code: Authorization code
 * - state: State parameter for CSRF protection
 */

import { useEffect, useState } from 'react';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';
import styles from '../../auth.module.css';

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

// ============= CONFIGURATION =============
const SOFIA_API_URL = 'https://sofia-api.maxime-moodz.workers.dev';
const TWITTER_REDIRECT_URI = 'https://sofia.intuition.box/auth/twitter/callback';

// ============= HELPER FUNCTIONS =============

interface OAuthState {
  state: string;
  extensionId: string;
  codeVerifier: string;
  timestamp: number;
}

// Exchange authorization code for access token via Sofia API
const exchangeCodeForToken = async (code: string, codeVerifier: string) => {
  const response = await fetch(`${SOFIA_API_URL}/auth/twitter/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code: code,
      redirect_uri: TWITTER_REDIRECT_URI,
      code_verifier: codeVerifier
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[Sofia Twitter Callback] Token exchange failed:', response.status, errorData);
    throw new Error(errorData.error || `Token exchange failed: ${response.status}`);
  }

  return response.json();
};

// Send token to extension via multiple methods
const sendTokenToExtension = (
  tokenData: { access_token: string; refresh_token?: string; expires_in?: number },
  extensionId: string
) => {
  const message = {
    type: 'TWITTER_OAUTH_SUCCESS',
    platform: 'twitter',
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in
  };

  // Method 1: Chrome runtime messaging (if extension ID is known)
  if (extensionId && typeof chrome !== 'undefined' && chrome?.runtime?.sendMessage) {
    try {
      chrome.runtime.sendMessage(extensionId, message, (response) => {
        console.log('[Sofia Twitter Callback] Extension response:', response);
      });
    } catch (e) {
      console.log('[Sofia Twitter Callback] Failed to send to extension:', e);
    }
  }

  // Method 2: postMessage to opener window
  if (window.opener) {
    window.opener.postMessage(message, '*');
    console.log('[Sofia Twitter Callback] Sent postMessage to opener');
  }

  // Method 3: Store in localStorage for polling
  try {
    localStorage.setItem('sofia_twitter_auth', JSON.stringify({
      ...message,
      timestamp: Date.now()
    }));
    console.log('[Sofia Twitter Callback] Stored in localStorage');
  } catch (e) {
    console.log('[Sofia Twitter Callback] LocalStorage not available');
  }
};

// ============= CALLBACK CONTENT COMPONENT =============

const TwitterCallbackContent = () => {
  const [status, setStatus] = useState<'loading' | 'exchanging' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        // Check for Twitter error response
        if (error) {
          throw new Error(errorDescription || error);
        }

        // Validate required parameters
        if (!code || !state) {
          throw new Error('Missing authorization code or state');
        }

        // Retrieve stored OAuth state
        const storedStateJson = localStorage.getItem('twitter_oauth_state');
        if (!storedStateJson) {
          throw new Error('OAuth state not found. Please try again.');
        }

        const storedState: OAuthState = JSON.parse(storedStateJson);

        // Validate state to prevent CSRF
        if (storedState.state !== state) {
          throw new Error('Invalid state parameter. Possible CSRF attack.');
        }

        // Check if state is expired (15 minutes)
        if (Date.now() - storedState.timestamp > 15 * 60 * 1000) {
          throw new Error('OAuth session expired. Please try again.');
        }

        setStatus('exchanging');

        // Exchange code for token via API (with PKCE code_verifier)
        const tokenData = await exchangeCodeForToken(code, storedState.codeVerifier);

        // DEBUG: Log full response from proxy API
        console.log('[Sofia Twitter Callback] FULL TOKEN DATA:', JSON.stringify(tokenData, null, 2));
        console.log('[Sofia Twitter Callback] Token received successfully');

        // Clean up stored state
        localStorage.removeItem('twitter_oauth_state');

        // Send token to extension
        sendTokenToExtension(tokenData, storedState.extensionId);

        setStatus('success');

        // Auto-close after delay
        setTimeout(() => {
          window.close();
        }, 3000);

      } catch (error) {
        console.error('[Sofia Twitter Callback] Error:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');

        // Clean up stored state on error
        localStorage.removeItem('twitter_oauth_state');
      }
    };

    handleCallback();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img src="/img/logoBrut.png" alt="Sofia" className={styles.logo} />
        <p className={styles.subtitle}>Twitter/X Authentication</p>

        {status === 'loading' && (
          <>
            <div className={styles.spinner} />
            <p className={styles.text}>Processing authentication...</p>
          </>
        )}

        {status === 'exchanging' && (
          <>
            <div className={styles.spinner} />
            <p className={styles.text}>Completing authentication...</p>
            <p className={styles.subtext}>Exchanging authorization code</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className={styles.checkmark}>✓</div>
            <p className={styles.text}>Twitter Connected!</p>
            <p className={styles.subtext}>
              Your Twitter account is now linked to Sofia.
            </p>
            <p className={styles.subtext}>
              This window will close automatically...
            </p>
            <button
              className={styles.closeBtn}
              onClick={() => window.close()}
            >
              Close
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className={styles.errorIcon}>✕</div>
            <p className={styles.text}>Authentication Failed</p>
            <p className={styles.subtext}>{errorMessage}</p>
            <button
              className={styles.btn}
              onClick={() => {
                window.location.href = '/auth/twitter';
              }}
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
      <p className={styles.subtitle}>Twitter/X Authentication</p>
      <div className={styles.spinner} />
      <p className={styles.text}>Loading...</p>
    </div>
  </div>
);

// ============= MAIN PAGE COMPONENT =============

export default function TwitterCallbackPage() {
  return (
    <Layout
      title="Twitter Authentication"
      description="Completing Twitter/X authentication for Sofia"
      noFooter
    >
      <BrowserOnly fallback={<LoadingPlaceholder />}>
        {() => <TwitterCallbackContent />}
      </BrowserOnly>
    </Layout>
  );
}
