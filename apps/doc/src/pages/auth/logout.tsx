import React, { useEffect } from 'react'
import Layout from '@theme/Layout'

// Logout flow lives in the Explorer SPA — this page just redirects.
// See ../auth.tsx for the rationale (keeps Privy out of Doc's bundle).

const EXPLORER_LOGOUT_URL = 'https://explorer.sofia.intuition.box/auth/logout'

export default function Logout(): JSX.Element {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const target =
      EXPLORER_LOGOUT_URL + (window.location.search || '') + (window.location.hash || '')
    window.location.replace(target)
  }, [])

  return (
    <Layout title="Sign out" description="Redirecting to Sofia Explorer">
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
        <h1 style={{ margin: 0 }}>Signing you out…</h1>
        <p style={{ opacity: 0.7, maxWidth: '36rem' }}>
          You're being redirected to the Sofia Explorer to complete the
          logout.
        </p>
        <p>
          <a href={EXPLORER_LOGOUT_URL}>Continue to Explorer</a>
        </p>
      </main>
    </Layout>
  )
}
