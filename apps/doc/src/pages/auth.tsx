import React, { useState } from 'react'
import Layout from '@theme/Layout'
import styles from './auth.module.css'

// Static visual preview of the wallet-connection screen.
// The real flow lives in the Explorer SPA (Privy + SIWE handshake) — this
// page is a doc-side mock so we can iterate on the UI without booting
// the full extension/explorer stack.

type AuthState =
  | 'connect'
  | 'loading'
  | 'waiting-signature'
  | 'signature-error'
  | 'connected'
  | 'error'

const STATES: { value: AuthState; label: string }[] = [
  { value: 'connect', label: 'Connect' },
  { value: 'loading', label: 'Loading' },
  { value: 'waiting-signature', label: 'Waiting signature' },
  { value: 'signature-error', label: 'Signature error' },
  { value: 'connected', label: 'Connected' },
  { value: 'error', label: 'Error' },
]

const SAMPLE_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1'

function StateSwitcher({
  current,
  onChange,
}: {
  current: AuthState
  onChange: (s: AuthState) => void
}) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(var(--ifm-navbar-height) + 1rem)',
        right: '1rem',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        padding: '0.85rem',
        background: 'var(--ds-bg-subtle)',
        border: '1px solid var(--ds-border)',
        borderRadius: 8,
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--doc-text-xs)',
      }}
    >
      <div
        style={{
          color: 'var(--ds-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: '0.25rem',
        }}
      >
        Preview state
      </div>
      {STATES.map((s) => (
        <button
          key={s.value}
          onClick={() => onChange(s.value)}
          style={{
            background: current === s.value ? 'var(--ds-ink)' : 'transparent',
            color: current === s.value ? 'var(--ds-bg)' : 'var(--ds-ink)',
            border: '1px solid var(--ds-border)',
            borderRadius: 999,
            padding: '0.35rem 0.85rem',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--doc-text-xs)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}

export default function Auth(): JSX.Element {
  const [state, setState] = useState<AuthState>('connect')

  return (
    <Layout title="Sign in" description="Sofia wallet connection (preview)">
      <StateSwitcher current={state} onChange={setState} />
      <div className={styles.container}>
        <div className={styles.card}>
          <img
            src="/img/logoWhite.svg"
            alt="Sofia"
            className={`${styles.logo} logo-invert`}
          />
          <p className={styles.subtitle}>Secure Wallet Connection</p>

          {state === 'connect' && (
            <>
              <p className={styles.text}>Connect your wallet</p>
              <p className={styles.subtext}>
                Connect with MetaMask or another Web3 wallet
              </p>
              <button className={styles.btn}>Connect Wallet</button>
            </>
          )}

          {state === 'loading' && (
            <>
              <div className={styles.spinner} />
              <p className={styles.text}>Connecting…</p>
              <p className={styles.subtext}>Opening your wallet provider.</p>
            </>
          )}

          {state === 'waiting-signature' && (
            <>
              <div className={styles.spinner} />
              <p className={styles.text}>Waiting for signature…</p>
              <p className={styles.subtext}>
                Sign the message in your wallet to complete the connection.
              </p>
            </>
          )}

          {state === 'signature-error' && (
            <>
              <div className={styles.errorIcon}>✕</div>
              <p className={styles.text}>Signature Required</p>
              <p className={styles.subtext}>
                The extension needs a signed message to verify ownership of
                your wallet. User rejected the request.
              </p>
              <div className={styles.buttonGroup}>
                <button className={styles.btn}>Retry signature</button>
                <button className={styles.disconnectBtn}>Disconnect</button>
              </div>
            </>
          )}

          {state === 'connected' && (
            <>
              <p className={styles.successHeading}>
                <span className={styles.checkmark}>✓</span> Wallet Connected
              </p>
              <div className={styles.walletRow}>
                <div className={styles.walletAddress}>
                  {SAMPLE_ADDRESS.slice(0, 6)}…{SAMPLE_ADDRESS.slice(-4)}
                </div>
                <button className={styles.disconnectBtn}>Disconnect</button>
              </div>
              <div className={styles.instructions}>
                <p className={styles.instructionsText}>
                  Your wallet is connected. Create your first claim to get
                  started with Sofia.
                </p>
              </div>
              <button className={styles.claimBtn}>
                Create your first claim
              </button>
            </>
          )}

          {state === 'error' && (
            <>
              <div className={styles.errorIcon}>✕</div>
              <p className={styles.text}>Connection Failed</p>
              <p className={styles.subtext}>
                Could not reach the wallet provider. Please try again.
              </p>
              <button className={styles.btn}>Try Again</button>
            </>
          )}

          <p className={styles.privyMention}>
            Secured by{' '}
            <a href="https://privy.io" target="_blank" rel="noreferrer">
              Privy
            </a>
          </p>
        </div>
      </div>
    </Layout>
  )
}
