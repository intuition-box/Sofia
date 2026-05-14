/**
 * ProfileTrustButton — large "Trust this account" action rendered in
 * the hero of `/profile/:address`. Resolves the viewed wallet's atom
 * term_id, hides itself when the viewer is on their own profile,
 * and reflects the on-chain state (idle / queued / trusted).
 *
 * Mirrors the TrustMemberButton flow used in AllMembersPanel but
 * surfaces as the page's primary action instead of a row affordance.
 */
import type { MouseEvent } from 'react'
import { ShieldCheck, Check } from 'lucide-react'
import { useLinkedWallets } from '@/hooks/useLinkedWallets'
import { useUserAccountAtom } from '@/hooks/useUserAccountAtom'
import { useTrustMember } from '@/hooks/useTrustMember'
import type { TrustCircleAccount } from '@/services/trustCircleService'

interface ProfileTrustButtonProps {
  /** Resolved wallet address (lowercased EVM string). */
  walletAddress: string | undefined
  /** Display name (ENS or short address). */
  displayName: string
  /** Optional ENS avatar URL. */
  avatarUrl: string
}

export default function ProfileTrustButton({
  walletAddress,
  displayName,
  avatarUrl,
}: ProfileTrustButtonProps) {
  // Need the viewed wallet's atom term_id to build the trust triple.
  const { termId: targetTermId } = useUserAccountAtom(walletAddress)
  // Hide on the viewer's own profile — trusting yourself is meaningless.
  const { addresses: viewerWallets } = useLinkedWallets()
  const isSelf =
    !!walletAddress &&
    viewerWallets.some((w) => w.toLowerCase() === walletAddress.toLowerCase())

  // Build a minimal TrustCircleAccount shape so useTrustMember can
  // reuse the existing cart-item builder without a new code path.
  const member: TrustCircleAccount | null =
    walletAddress && targetTermId
      ? {
          id: targetTermId,
          termId: targetTermId,
          tripleId: '',
          label: displayName,
          image: avatarUrl || null,
          walletAddress,
          trustAmount: 0,
          createdAt: 0,
        }
      : null

  const { trust, inCart, alreadyTrusted, disabledReason, disabledHint } =
    useTrustMember(member)

  // Bail out cleanly when there's nothing actionable on the page.
  if (isSelf || !walletAddress || !targetTermId) return null

  const handleClick = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    trust()
  }

  if (alreadyTrusted) {
    return (
      <button
        type="button"
        className="pp-trust-btn pp-trust-btn--trusted"
        disabled
        aria-label="You trust this account"
        title="You trust this account on-chain"
      >
        <Check className="h-4 w-4" aria-hidden="true" />
        <span>Trusted</span>
      </button>
    )
  }

  const label = inCart ? 'Queued in cart' : 'Trust this account'
  const title = disabledHint ?? (inCart ? 'Submit to emit on-chain' : label)

  return (
    <button
      type="button"
      className={`pp-trust-btn${inCart ? ' pp-trust-btn--queued' : ''}`}
      onClick={handleClick}
      disabled={!!disabledReason}
      aria-label={title}
      title={title}
    >
      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
      <span>{label}</span>
    </button>
  )
}
