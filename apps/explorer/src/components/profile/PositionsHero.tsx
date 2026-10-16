/**
 * PositionsHero — identity banner at the top of `/positions` and
 * `/positions/:address`. Same silhouette as the public profile hero
 * (`.pp-public-hero`: ENS avatar beside the title), plus the short address
 * with copy, a link to the full profile and a "Share" action that copies
 * the public positions link.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Address } from 'viem'
import { Check, Copy, Link2, User } from 'lucide-react'
import { useEnsNames } from '@/hooks/useEnsNames'
import { copyToClipboard } from '@/services/shareProfileService'
import '@/components/styles/profile-sections.css'

interface PositionsHeroProps {
  walletAddress: string
  /** The connected wallet's own positions. */
  isOwn: boolean
  background: string
}

const COPIED_MS = 1500

export default function PositionsHero({
  walletAddress,
  isOwn,
  background,
}: PositionsHeroProps) {
  const addresses = useMemo<Address[]>(
    () => [walletAddress as Address],
    [walletAddress],
  )
  const { getDisplay, getAvatar } = useEnsNames(addresses)
  const [copied, setCopied] = useState<'address' | 'link' | null>(null)

  const displayName = getDisplay(walletAddress as Address)
  const avatar = getAvatar(walletAddress as Address)
  const shortAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
  const initials = (displayName || walletAddress).slice(0, 2).toUpperCase()
  const title = isOwn
    ? 'Your positions'
    : `${displayName || shortAddress}'s positions`

  const copy = (what: 'address' | 'link') => {
    const text =
      what === 'address'
        ? walletAddress
        : `${window.location.origin}/positions/${walletAddress}`
    void copyToClipboard(text).then(() => {
      setCopied(what)
      setTimeout(() => setCopied(null), COPIED_MS)
    })
  }

  return (
    <div className="ph-container pp-public-hero" style={{ background }}>
      <div className="pp-public-hero-row">
        <span className="pp-public-hero-avatar" aria-hidden="true">
          {avatar ? (
            <img src={avatar} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span className="pp-public-hero-initials">{initials}</span>
          )}
        </span>
        <div className="pp-public-hero-text">
          <h1 className="ph-title">{title}</h1>
          <p className="ph-description mk-hero-id">
            {displayName && displayName !== shortAddress && (
              <span>{displayName}</span>
            )}
            <button
              type="button"
              className="mk-hero-addr"
              onClick={() => copy('address')}
              aria-label="Copy address"
            >
              {shortAddress}
              {copied === 'address' ? (
                <Check className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden />
              )}
            </button>
          </p>
        </div>
        <div className="mk-hero-actions">
          <Link
            to={isOwn ? '/profile' : `/profile/${walletAddress}`}
            className="pp-hero-link"
          >
            <User className="h-3.5 w-3.5" aria-hidden />
            View profile
          </Link>
          <button
            type="button"
            className="pp-hero-link"
            onClick={() => copy('link')}
          >
            {copied === 'link' ? (
              <Check className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Link2 className="h-3.5 w-3.5" aria-hidden />
            )}
            {copied === 'link' ? 'Link copied' : 'Share'}
          </button>
        </div>
      </div>
      <div className="ph-deco" aria-hidden="true" />
    </div>
  )
}
