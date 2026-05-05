import { useEffect, useState } from 'react';
import { OAUTH_CONFIG, getApiTokenUrl, sendToExtension, type OAuthPlatform } from './oauthConfig';
import styles from './auth.module.css';

export function OAuthCallback({ platform }: { platform: OAuthPlatform }) {
  const [status, setStatus] = useState<'loading' | 'exchanging' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const config = OAUTH_CONFIG[platform];

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (error) throw new Error(errorDescription || error);
        if (!code || !state) throw new Error('Missing authorization code or state');

        const storedJson = localStorage.getItem(`${platform}_oauth_state`);
        if (!storedJson) throw new Error('OAuth state not found. Please try again.');

        const stored = JSON.parse(storedJson);
        if (stored.state !== state) throw new Error('Invalid state parameter.');
        if (Date.now() - stored.timestamp > 15 * 60 * 1000) throw new Error('OAuth session expired.');

        setStatus('exchanging');

        const response = await fetch(getApiTokenUrl(platform), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            redirect_uri: config.redirectUri,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `Token exchange failed: ${response.status}`);
        }

        const tokenData = await response.json();
        localStorage.removeItem(`${platform}_oauth_state`);

        sendToExtension({
          type: 'OAUTH_TOKEN_SUCCESS',
          platform,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in,
        }, stored.extensionId);

        try {
          localStorage.setItem(`sofia_${platform}_auth`, JSON.stringify({
            type: 'OAUTH_TOKEN_SUCCESS',
            platform,
            accessToken: tokenData.access_token,
            timestamp: Date.now(),
          }));
        } catch { /* */ }

        setStatus('success');
        setTimeout(() => window.close(), 3000);
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Authentication failed');
        localStorage.removeItem(`${platform}_oauth_state`);
      }
    };

    handleCallback();
  }, [platform, config]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img src="/img/sofiaLogo.png" alt="Sofia" className={`${styles.logo} logo-invert`} />
        <p className={styles.subtitle}>{config.label} Authentication</p>

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
            <p className={styles.text}>{config.label} Connected!</p>
            <p className={styles.subtext}>Your {config.label} account is now linked to Sofia.</p>
            <p className={styles.subtext}>This window will close automatically...</p>
            <button className={styles.closeBtn} onClick={() => window.close()}>Close</button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className={styles.errorIcon}>✕</div>
            <p className={styles.text}>Authentication Failed</p>
            <p className={styles.subtext}>{errorMessage}</p>
            <button className={styles.btn} onClick={() => { window.location.href = `/auth/${platform}`; }}>Try Again</button>
          </>
        )}
      </div>
    </div>
  );
}
