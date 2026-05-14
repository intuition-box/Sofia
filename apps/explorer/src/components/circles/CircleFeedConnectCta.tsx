/**
 * CircleFeedConnectCta — replaces the empty-feed message for non-auth
 * visitors. Two CTAs side-by-side: Connect wallet (triggers Privy
 * login) and Install Sofia (Chrome Web Store link, hidden when the
 * extension is already detected). Sits inside the masonry-grid slot
 * so the layout doesn't jump when the feed eventually loads.
 */
import { useLogin } from '@privy-io/react-auth'
import { Wallet, Puzzle, ShieldCheck } from 'lucide-react'
import { useExtensionInstalled } from '@/hooks/useExtensionInstalled'
import { CHROME_STORE_URL } from '@/utils/sofiaDetect'

export default function CircleFeedConnectCta() {
  const { login } = useLogin()
  const extensionInstalled = useExtensionInstalled()

  return (
    <section className="crd-feed-cta" role="status" aria-live="polite">
      <span className="crd-feed-cta__icon" aria-hidden="true">
        <ShieldCheck className="h-6 w-6" />
      </span>
      <h3 className="crd-feed-cta__title">See what this circle certifies</h3>
      <p className="crd-feed-cta__lede">
        Connect your wallet to browse the curated feed, certify URLs and emit
        trust signals that shape what surfaces here.
      </p>
      <div className="crd-feed-cta__actions">
        <button
          type="button"
          className="crd-feed-cta__btn crd-feed-cta__btn--primary"
          onClick={() => login()}
        >
          <Wallet className="h-4 w-4" aria-hidden="true" />
          <span>Connect wallet</span>
          <span className="crd-feed-cta__arrow">→</span>
        </button>
        {!extensionInstalled && (
          <a
            className="crd-feed-cta__btn crd-feed-cta__btn--ghost"
            href={CHROME_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Puzzle className="h-4 w-4" aria-hidden="true" />
            <span>Install Sofia</span>
            <span className="crd-feed-cta__arrow">→</span>
          </a>
        )}
      </div>
    </section>
  )
}
