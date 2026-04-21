import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrivy, useLogin } from '@privy-io/react-auth'
import { useTheme } from '@/hooks/useTheme'
import { Shield, Vote, Flame, Wallet } from 'lucide-react'
import '@/components/styles/landing.css'

export default function LandingPage() {
  const { ready, authenticated } = usePrivy()
  const { login } = useLogin({
    onComplete: () => navigate('/profile'),
  })
  const navigate = useNavigate()
  const { theme } = useTheme()

  // If already authenticated, redirect to profile
  useEffect(() => {
    if (ready && authenticated) {
      navigate('/profile', { replace: true })
    }
  }, [ready, authenticated, navigate])

  if (!ready) return null

  const features = [
    {
      icon: <Shield style={{ width: '1.04vw', height: '1.04vw' }} />,
      color: 'oklch(0.65 0.15 250)',
      title: 'Reputation',
      desc: 'Build verifiable scores from your real activity',
    },
    {
      icon: <Vote style={{ width: '1.04vw', height: '1.04vw' }} />,
      color: 'oklch(0.65 0.15 150)',
      title: 'Vote',
      desc: 'Support or oppose claims on-chain',
    },
    {
      icon: <Flame style={{ width: '1.04vw', height: '1.04vw' }} />,
      color: 'oklch(0.65 0.18 30)',
      title: 'Streaks',
      desc: 'Earn rewards for daily certifications',
    },
  ]

  return (
    <div className="lp-split">
      {/* ── Left: Auth ── */}
      <div className="lp-left">
        {/* Logo background texture */}
        <img src="/logo.png" alt="" className="lp-left-bg-logo" />

        <div className="lp-left-inner">
          {/* Tagline as main heading */}
          <h1 className="lp-tagline">Communities Think Smarter</h1>

          {/* CTA */}
          <div className="lp-cta">
            <button className="lp-btn-connect" onClick={() => login()}>
              <Wallet style={{ width: '0.83vw', height: '0.83vw' }} />
              Connect Wallet
            </button>

            <div className="lp-separator">
              <span className="lp-separator-line" />
              <span className="lp-separator-text">or</span>
              <span className="lp-separator-line" />
            </div>

            <button className="lp-btn-google" onClick={() => login()}>
              <svg className="lp-google-icon" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <button className="lp-btn-explore" onClick={() => navigate('/feed')}>
              Explore
            </button>
          </div>

          <p className="lp-privy-mention">
            <svg className="lp-privy-icon" viewBox="0 0 28 28" fill="none">
              <path d="M14 2L3 8v12l11 6 11-6V8L14 2z" fill="rgba(255,255,255,0.4)" />
              <path d="M14 6l-7 4v8l7 4 7-4v-8l-7-4z" fill="rgba(255,255,255,0.15)" />
            </svg>
            Secured by <a href="https://www.privy.io" target="_blank" rel="noopener noreferrer">Privy</a>
          </p>
        </div>
      </div>

      {/* ── Right: Decorative ── */}
      <div className="lp-right">
        {/* Decorative square (like PageHeader .ph-deco) */}
        <div className="lp-deco" />

        {/* Tagline */}
        <h2 className="lp-right-tagline">
          Connect and explore your footprint
        </h2>
        <p className="lp-right-subtitle">
          Track your browsing intents, connect platforms, certify your interests, and build a verifiable reputation profile powered by the Intuition protocol.
        </p>

        {/* Feature cards */}
        <div className="lp-right-features">
          {features.map((f) => (
            <div key={f.title} className="lp-right-feature">
              <div
                className="lp-right-feature-icon"
                style={{
                  background: `color-mix(in oklab, ${f.color} 20%, transparent)`,
                }}
              >
                {f.icon}
              </div>
              <div className="lp-right-feature-text">
                <span className="lp-right-feature-title">{f.title}</span>
                <span className="lp-right-feature-desc">{f.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
