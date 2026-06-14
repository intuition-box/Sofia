/**
 * HomeProfileHeader — compact identity banner at the top of the Explore
 * home. Surfaces the signed-in user (avatar + name) and links straight to
 * their profile. Hidden for anonymous visitors. Resolution mirrors the
 * NavSidebar hierarchy: Google → ENS → email → shortened address.
 */
import { usePrivy } from '@privy-io/react-auth'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { Address } from 'viem'
import { Avatar } from '@0xsofia/design-system'
import { useEnsNames } from '@/hooks/useEnsNames'

export default function HomeProfileHeader() {
  const navigate = useNavigate()
  const { authenticated, user } = usePrivy()
  const address = user?.wallet?.address
  const addresses: Address[] = address ? [address as Address] : []
  const { getDisplay, getAvatar } = useEnsNames(addresses)

  if (!authenticated) return null

  const ensName = address ? getDisplay(address as Address) : ''
  const ensAvatar = address ? getAvatar(address as Address) : ''
  const google = user?.google as
    | { name?: string; profilePictureUrl?: string; email?: string }
    | undefined
  const shortAddr = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : ''
  const avatarUrl = google?.profilePictureUrl || ensAvatar || ''
  const name =
    google?.name ||
    ensName ||
    google?.email ||
    user?.email?.address ||
    shortAddr ||
    'User'

  return (
    <button
      type="button"
      className="hm-profile"
      onClick={() => navigate('/profile')}
      aria-label="Open your profile"
    >
      <Avatar label={name} imageUrl={avatarUrl} size={52} />
      <span className="hm-profile-text">
        <span className="hm-profile-greeting">Welcome back</span>
        <span className="hm-profile-name">{name}</span>
      </span>
      <span className="hm-profile-cta">
        View profile
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </button>
  )
}
