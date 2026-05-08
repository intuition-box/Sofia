/**
 * GroupDetailPage — `/circles/group/:termId`. Renders one membership
 * group: the object atom's metadata + the full list of claimed
 * members + the per-member voucher counts.
 *
 * Source of truth: `useGroupDetail(termId)` which paginates every
 * `is_member_of` triple pointing to this object atom.
 */

import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, UserPlus, Check } from 'lucide-react'
import { usePrivy } from '@privy-io/react-auth'
import { PageHero, SectionTitle } from '@0xsofia/design-system'
import { useGroupDetail } from '@/hooks/useGroups'
import { useUserAccountAtom } from '@/hooks/useUserAccountAtom'
import { useCart } from '@/hooks/useCart'
import { PREDICATE_IDS } from '@/config'
import { extractDomain } from '@/utils/formatting'
import { Button } from '@/components/ui/button'
import '@/components/styles/pages.css'
import '@/components/styles/circles.css'
import '@/components/styles/feed-card.css'

export default function GroupDetailPage() {
  const navigate = useNavigate()
  const { termId } = useParams<{ termId: string }>()
  const { group, isLoading } = useGroupDetail(termId)
  const { user, authenticated } = usePrivy()
  const userWallet = user?.wallet?.address
  const {
    termId: userAccountAtom,
    exists: accountAtomExists,
    isLoading: accountAtomLoading,
  } = useUserAccountAtom(userWallet)
  const cart = useCart()

  const isAlreadyMember = Boolean(
    group &&
      userAccountAtom &&
      group.memberships.some((m) => m.member.termId === userAccountAtom),
  )

  const cartId = termId ? `join-${termId}` : ''
  const isInCart = cart.items.some((i) => i.id === cartId)

  const blockedReason: 'no-wallet' | 'no-account-atom' | 'loading' | null =
    !authenticated
      ? 'no-wallet'
      : accountAtomLoading
        ? 'loading'
        : !accountAtomExists
          ? 'no-account-atom'
          : null

  const handleAddToCart = () => {
    if (!termId || !userAccountAtom || !group) return
    cart.addItem({
      id: cartId,
      kind: 'create-triple',
      side: 'support',
      // Placeholder termId for cart dedupe — the real triple_id is
      // computed inside the SofiaFeeProxy.calculateTripleId call when
      // the cart submits. We use a deterministic prefix so the cart's
      // own dedupe (`(termId, side)` pair) matches per-group.
      termId: `triple-${termId}`,
      subjectId: userAccountAtom,
      predicateId: PREDICATE_IDS.MEMBER_OF,
      objectId: termId,
      intention: 'Join group',
      title: group.label,
      favicon: group.image ?? '',
      intentionColor: '#a78bdb',
    })
  }

  if (!termId) {
    return (
      <div className="pf-view crd-detail">
        <BackRow onBack={() => navigate('/circles')} />
        <p className="text-sm text-muted-foreground">Unknown group.</p>
      </div>
    )
  }

  if (isLoading && !group) {
    return (
      <div className="pf-view crd-detail">
        <BackRow onBack={() => navigate('/circles')} />
        <p className="text-sm text-muted-foreground">Loading group…</p>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="pf-view crd-detail">
        <BackRow onBack={() => navigate('/circles')} />
        <p className="text-sm text-muted-foreground">
          No `is member of` claim found for this atom.
        </p>
      </div>
    )
  }

  const memberships = [...group.memberships].sort((a, b) => {
    if (a.totalShares !== b.totalShares)
      return Number(b.totalShares - a.totalShares)
    return Date.parse(b.createdAt) - Date.parse(a.createdAt)
  })

  return (
    <div className="pf-view crd-detail">
      <BackRow onBack={() => navigate('/circles')} />

      <PageHero
        title={group.label}
        description={
          group.description ||
          `${group.memberCount} claimed member${group.memberCount === 1 ? '' : 's'} · ${group.voucherCount} voucher${group.voucherCount === 1 ? '' : 's'}.`
        }
      >
        <JoinButton
          isAlreadyMember={isAlreadyMember}
          isInCart={isInCart}
          blockedReason={blockedReason}
          onJoin={handleAddToCart}
        />
      </PageHero>

      {(group.url || group.image) && (
        <div className="grp-meta-row">
          {group.image && (
            <img
              className="grp-meta-image"
              src={group.image}
              alt={group.label}
            />
          )}
          {group.url && (
            <a
              className="grp-meta-link"
              href={group.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {extractDomain(group.url)}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}

      <section className="pp-section">
        <SectionTitle>Members</SectionTitle>
        {memberships.length === 0 ? (
          <p className="text-sm text-muted-foreground">No member yet.</p>
        ) : (
          <div className="grp-member-list">
            {memberships.map((m) => (
              <div key={m.tripleTermId} className="grp-member-row">
                {m.member.image ? (
                  <img
                    className="grp-member-avatar"
                    src={m.member.image}
                    alt={m.member.label}
                    loading="lazy"
                  />
                ) : (
                  <span className="grp-member-avatar fallback">
                    {(m.member.label || '?').slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="grp-member-text">
                  <div className="grp-member-name">{m.member.label}</div>
                  {m.member.description && (
                    <div className="grp-member-desc">
                      {m.member.description}
                    </div>
                  )}
                </div>
                <div className="grp-member-stats">
                  <span className="grp-member-stat-num">
                    {m.voucherWallets.length}
                  </span>
                  <span className="grp-member-stat-label">
                    voucher{m.voucherWallets.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function BackRow({ onBack }: { onBack: () => void }) {
  return (
    <div className="pf-ts-back-row">
      <button type="button" className="pf-btn" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Back to circles
      </button>
    </div>
  )
}

interface JoinButtonProps {
  isAlreadyMember: boolean
  isInCart: boolean
  blockedReason: 'no-wallet' | 'no-account-atom' | 'loading' | null
  onJoin: () => void
}

function JoinButton({
  isAlreadyMember,
  isInCart,
  blockedReason,
  onJoin,
}: JoinButtonProps) {
  if (isAlreadyMember) {
    return (
      <div className="grp-join-row">
        <span className="grp-join-status grp-join-status--member">
          ✓ You&apos;re a member
        </span>
      </div>
    )
  }

  if (isInCart) {
    return (
      <div className="grp-join-row">
        <span className="grp-join-status grp-join-status--member">
          <Check className="h-3.5 w-3.5" /> Added to cart — confirm in the
          drawer
        </span>
      </div>
    )
  }

  const blockedHint =
    blockedReason === 'no-wallet'
      ? 'Connect your wallet to join'
      : blockedReason === 'no-account-atom'
        ? 'Make any cert first to register your account on Intuition'
        : blockedReason === 'loading'
          ? 'Resolving your identity…'
          : null

  return (
    <div className="grp-join-row">
      <Button
        type="button"
        size="sm"
        disabled={blockedReason !== null}
        onClick={onJoin}
      >
        <UserPlus className="h-4 w-4 mr-2" />
        Join group
      </Button>
      {blockedHint && <span className="grp-join-hint">{blockedHint}</span>}
    </div>
  )
}
