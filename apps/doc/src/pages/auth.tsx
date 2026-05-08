import React, { useEffect } from 'react'
import Layout from '@theme/Layout'

// Doc is a documentation site, not a wallet app. The Privy auth flow
// lives in the Explorer SPA — this page just bounces users there. Doing
// it client-side (window.location.replace) so the Docusaurus SSG pass
// stays free of any @privy-io/react-auth bundling (which trips Rspack).
//
// Query string is preserved so the extension's `extensionId`, `callback`
// and `autoLogin` params reach Explorer's /auth handler unchanged.

const EXPLORER_AUTH_URL = 'https://explorer.sofia.intuition.box/auth'

export default function Auth(): JSX.Element {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const target =
      EXPLORER_AUTH_URL + (window.location.search || '') + (window.location.hash || '')
    window.location.replace(target)
  }, [])

  return (
    <Layout title="Sign in" description="Redirecting to Sofia Explorer">
      <main
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '4rem 1.5rem',
          textAlign: 'center',
        }}
      >
        <h1 style={{ margin: 0 }}>Redirecting to Explorer…</h1>
        <p style={{ opacity: 0.7, maxWidth: '36rem' }}>
          Wallet connection lives in the Sofia Explorer app. You'll be
          forwarded automatically.
        </p>
        <p>
          <a href={EXPLORER_AUTH_URL}>Continue to Explorer</a>
        </p>
      </main>
    </Layout>
  )
}
