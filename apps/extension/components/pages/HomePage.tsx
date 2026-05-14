/**
 * HomePage — extension popup login screen.
 *
 * Layout adapted from Claude Design sketch `ext-login-b3.html` and the
 * explorer's `/` LandingPage. 50/50 vertical split:
 *   - Top half  : peach (--ds-accent) plate with the same animated
 *                 CirclesSequence SVG used on the landing hero. Sofia mark
 *                 + version pinned at the top.
 *   - Bottom half: ink (--ds-ink) panel with eyebrow / headline / lede /
 *                  paper-pill connect button + Privy/Terms/Privacy footer
 *                  (mirrors `.lp-btn-primary` on the explorer login).
 *
 * Tokenized through @0xsofia/design-system. The connect handler reuses
 * the same `openAuthTab` / `useWalletFromStorage` flow as the previous
 * `WalletConnectionButton` so we don't change auth behavior.
 */

import { useWalletFromStorage, openAuthTab, disconnectWallet } from '../../hooks'
import packageJson from '~/package.json'
import sofiaIcon from '../../assets/icon-light-32.png'
import { CirclesSequence } from '../ui/CirclesSequence'
import '../styles/HomePage.css'

export default function HomePage() {
  const { authenticated, ready } = useWalletFromStorage()
  const isLoading = !ready

  const handleConnect = () => {
    if (isLoading) return
    openAuthTab()
  }

  const handleDisconnect = async () => {
    await disconnectWallet()
  }

  return (
    <div className="hp-page">
      {/* ── Top half: peach + identity-graph diagram ─── */}
      <div className="hp-visual">
        <div className="hp-meta-row">
          <span className="hp-brand">
            <img className="hp-brand-mark" src={sofiaIcon} alt="Sofia" />
            <span className="hp-brand-name">SOFIA</span>
          </span>
          <span>v{packageJson.version}</span>
        </div>

        <div className="hp-diagram-stage" aria-hidden="true">
          <CirclesSequence variant="peach" />
        </div>
      </div>

      {/* ── Bottom half: ink + copy ─── */}
      <div className="hp-auth">
        <span className="hp-eyebrow">S.01 · CONNECT</span>

        <h1 className="hp-headline">
          Your web, <em>mapped.</em>
        </h1>

        <p className="hp-lede">
          Sofia turns every URL you visit into a verifiable signal — building
          a graph of who you are, what you do, and what you trust.
        </p>

        {!authenticated ? (
          <button
            type="button"
            className="hp-btn hp-btn-primary"
            onClick={handleConnect}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            <span className="hp-btn-icon" aria-hidden="true">
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
            <span className="hp-btn-label">
              {isLoading ? 'Connecting…' : 'Connect wallet'}
            </span>
            <span className="hp-btn-arrow" aria-hidden="true">→</span>
          </button>
        ) : (
          <button
            type="button"
            className="hp-btn hp-btn-ghost"
            onClick={handleDisconnect}
          >
            <span className="hp-btn-label">Disconnect</span>
            <span className="hp-btn-arrow" aria-hidden="true">→</span>
          </button>
        )}

        <div className="hp-spacer" />

        <p className="hp-footer">
          <span className="hp-secured">
            <span className="hp-secured-dot" aria-hidden="true" />
            Secured by{' '}
            <a
              href="https://www.privy.io"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privy
            </a>
          </span>
          <span className="hp-footer-sep" aria-hidden="true">·</span>
          <a
            href="https://doc.sofia.intuition.box/terms"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms
          </a>
          <span className="hp-footer-sep" aria-hidden="true">·</span>
          <a
            href="https://doc.sofia.intuition.box/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy
          </a>
        </p>
      </div>
    </div>
  )
}
