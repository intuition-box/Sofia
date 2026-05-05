import { useEffect, useState } from 'react';
import { OAUTH_CONFIG, generateRandomString, generateCodeChallenge, type OAuthPlatform } from './oauthConfig';
import styles from './auth.module.css';

export function OAuthInitiate({ platform }: { platform: OAuthPlatform }) {
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const config = OAUTH_CONFIG[platform];

  useEffect(() => {
    const initiate = async () => {
      try {
        const extensionId = new URLSearchParams(window.location.search).get('extensionId') || '';
        const state = generateRandomString(32);

        const stateData: Record<string, unknown> = { state, extensionId, timestamp: Date.now() };

        const params = new URLSearchParams({
          client_id: config.clientId,
          redirect_uri: config.redirectUri,
          scope: config.scopes.join(' '),
          state,
          response_type: 'code',
        });

        if (config.usePKCE) {
          const codeVerifier = generateRandomString(32);
          const codeChallenge = await generateCodeChallenge(codeVerifier);
          stateData.codeVerifier = codeVerifier;
          params.set('code_challenge', codeChallenge);
          params.set('code_challenge_method', 'S256');
        }

        if (platform === 'youtube') {
          params.set('access_type', 'offline');
          params.set('prompt', 'consent');
        }

        localStorage.setItem(`${platform}_oauth_state`, JSON.stringify(stateData));

        setStatus('redirecting');
        setTimeout(() => {
          window.location.href = `${config.authorizeUrl}?${params.toString()}`;
        }, 500);
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Failed to initiate authentication');
      }
    };

    initiate();
  }, [platform, config]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img src="/img/sofiaLogo.png" alt="Sofia" className={`${styles.logo} logo-invert`} />
        <p className={styles.subtitle}>{config.label} Authentication</p>

        {status === 'loading' && (
          <>
            <div className={styles.spinner} />
            <p className={styles.text}>Preparing authentication...</p>
          </>
        )}

        {status === 'redirecting' && (
          <>
            <div className={styles.spinner} />
            <p className={styles.text}>Redirecting to {config.label}...</p>
            <p className={styles.subtext}>You will be asked to authorize Sofia</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className={styles.errorIcon}>✕</div>
            <p className={styles.text}>Authentication Failed</p>
            <p className={styles.subtext}>{errorMessage}</p>
            <button className={styles.btn} onClick={() => window.location.reload()}>Try Again</button>
          </>
        )}
      </div>
    </div>
  );
}
