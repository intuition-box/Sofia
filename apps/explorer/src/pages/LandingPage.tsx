/**
 * LandingPage — Explorer auth gate.
 *
 * Layout adapted from the Claude Design "explorer-login.html" sketch
 * (50/50 split, topbar, meta-tag, plate diagram, features row), but
 * tokenized through @0xsofia/design-system to match the marketing
 * Hero: peach background, ink type, Fraunces / Geist / JetBrains Mono.
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrivy, useLogin } from '@privy-io/react-auth'
import { TopicsIntentions } from '@/components/TopicsIntentions'
import { HexSplit } from '@/components/HexSplit'
import '@/components/styles/landing.css'

export default function LandingPage() {
  const navigate = useNavigate()
  const { ready, authenticated } = usePrivy()
  const { login } = useLogin({
    onComplete: () => navigate('/profile'),
  })

  useEffect(() => {
    if (ready && authenticated) {
      navigate('/profile', { replace: true })
    }
  }, [ready, authenticated, navigate])

  if (!ready) return null

  return (
    <section className="lp-page">
      {/* ── Top bar ─────────────────────────────────── */}
      <div className="lp-topbar">
        <a className="lp-logo" href="/">
          <img src="/logo.png" alt="Sofia" />
        </a>
        <span className="lp-topbar-right" aria-hidden />
      </div>

      {/* ── Body 50/50 ──────────────────────────────── */}
      <div className="lp-body">
        {/* LEFT — auth */}
        <div className="lp-auth">
          <HexSplit size="560px" color="rgba(245, 243, 255, 0.05)" />
          <div className="lp-meta-tag">
            <span className="lp-meta-left">
              <span className="lp-meta-dot" /> S.01 · ENTER — EXPLORER
            </span>
            <span>v0.9 · BETA</span>
          </div>

          <div className="lp-auth-inner">
            <h1 className="lp-headline">
              Communities <em>think&nbsp;smarter.</em>
            </h1>
            <p className="lp-lede">
              Connect your wallet to track your browsing intents, certify your
              interests, and build a verifiable reputation profile on Intuition.
            </p>

            <div className="lp-auth-actions">
              <button
                type="button"
                className="lp-btn lp-btn-primary"
                onClick={() => login()}
              >
                <span className="lp-icon" aria-hidden>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h16v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7" />
                    <circle cx="17" cy="13" r="1.2" fill="currentColor" />
                  </svg>
                </span>
                Connect wallet
                <span className="lp-arrow">→</span>
              </button>

              <div className="lp-divider">or</div>

              <button
                type="button"
                className="lp-btn lp-btn-ghost"
                onClick={() => login()}
              >
                <span className="lp-icon" aria-hidden>
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                </span>
                Continue with Google
                <span className="lp-arrow">→</span>
              </button>

              <button
                type="button"
                className="lp-btn lp-btn-ghost"
                onClick={() => login()}
              >
                <span className="lp-icon" aria-hidden>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" />
                  </svg>
                </span>
                Continue with email
                <span className="lp-arrow">→</span>
              </button>

              <button
                type="button"
                className="lp-btn lp-btn-quiet"
                onClick={() => navigate('/feed')}
              >
                <span className="lp-icon" aria-hidden>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
                  </svg>
                </span>
                Explore as guest
                <span className="lp-arrow">→</span>
              </button>
            </div>
          </div>

          <div className="lp-auth-footer">
            <span className="lp-secured">
              <img
                className="lp-privy-icon"
                src="/privy-icon.png"
                alt=""
                aria-hidden
              />
              Secured by{' '}
              <a
                href="https://www.privy.io"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privy
              </a>
            </span>
            <span>
              <a
                href="https://sofia.intuition.box/terms"
                target="_blank"
                rel="noreferrer"
              >
                Terms
              </a>{' '}
              ·{' '}
              <a
                href="https://sofia.intuition.box/privacy"
                target="_blank"
                rel="noreferrer"
              >
                Privacy
              </a>
            </span>
          </div>
        </div>

        {/* RIGHT — visual: PLATE.A diagram (mirrors landing Hero) */}
        <div className="lp-visual">
          <div className="lp-visual-meta">
            <span>PLATE.A · TOPICS × INTENTIONS</span>
            <span>v0.9 · LIVE</span>
          </div>

          <div className="lp-visual-stage">
            <TopicsIntentions mode="light" />
          </div>

          <div className="lp-features">
            <div className="lp-feature">
              <span className="lp-feature-num">01 · REPUTATION</span>
              <span className="lp-feature-title">Build score</span>
              <span className="lp-feature-desc">
                Verifiable signals from your real activity.
              </span>
            </div>
            <div className="lp-feature">
              <span className="lp-feature-num">02 · VOTE</span>
              <span className="lp-feature-title">Take a side</span>
              <span className="lp-feature-desc">
                Support or oppose claims, on-chain.
              </span>
            </div>
            <div className="lp-feature">
              <span className="lp-feature-num">03 · STREAKS</span>
              <span className="lp-feature-title">Earn rewards</span>
              <span className="lp-feature-desc">
                Daily certifications compound over time.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
