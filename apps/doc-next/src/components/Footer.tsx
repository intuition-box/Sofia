import { BrandMark } from './BrandMark'

/**
 * Footer — ported from the design `Footer`. Three columns + a mono
 * status line. Links mirror the real Docusaurus footer config
 * (sofia.intuition.box / Chronicles / GitHub / X / Discord).
 */
export function Footer() {
  return (
    <footer className="dft">
      <div className="dft-col dft-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrandMark size={26} />
          <span className="dnv-name" style={{ fontSize: 16 }}>
            Sofia
          </span>
        </div>
        <p className="dft-tagline">
          A browser extension that turns web browsing into private,
          user-owned, on-chain knowledge. Built on the Intuition protocol.
        </p>
      </div>
      <div className="dft-col">
        <div className="dft-col-title">Sofia</div>
        <a href="https://sofia.intuition.box">sofia.intuition.box</a>
        <a href="https://sofia.intuition.box">Install the extension</a>
        <a href="https://blog.sofia.intuition.box">Chronicles ↗</a>
        <a href="https://sofia-proxy.intuition.box/">Proxy Dashboard</a>
      </div>
      <div className="dft-col">
        <div className="dft-col-title">Community</div>
        <a href="https://github.com/intuition-box">GitHub</a>
        <a href="https://x.com/0xsofia3">X · @0xsofia3</a>
        <a href="https://discord.gg/sofia3">Discord</a>
        <a href="/privacy">Privacy &amp; Terms</a>
      </div>
      <div className="dft-bottom">
        <span>© 2024 — {new Date().getFullYear()} · Sofia, built on Intuition</span>
      </div>
    </footer>
  )
}
