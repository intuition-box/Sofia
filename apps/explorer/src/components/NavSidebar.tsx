import { Link, useLocation, useNavigate } from 'react-router-dom'
import { usePrivy, useLogin } from '@privy-io/react-auth'
import {
  NavSidebar as DsNavSidebar,
  NavSection,
  NavItem,
} from '@0xsofia/design-system'
import {
  Home,
  Bell,
  Globe,
  Wallet,
  ShoppingCart,
  Users,
  Layers,
  Trophy,
  LineChart,
  Sun,
  Moon,
} from 'lucide-react'
import type { Address } from 'viem'
import { useMemo, useState } from 'react'
import { useTrustCircle } from '../hooks/useTrustCircle'
import { useLinkedWallets } from '../hooks/useLinkedWallets'
import { useGroups } from '../hooks/useGroups'
import { avatarColor } from '../utils/avatarColor'
import { useCart } from '../hooks/useCart'
import { useEnsNames } from '../hooks/useEnsNames'
import { useTheme } from '../hooks/useTheme'
import { useNotificationsRealtime } from '../hooks/useGroupNotifications'
import { getAvatarUrl } from '../services/ensService'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import './styles/nav-sidebar-trust-circle.css'
import './styles/nav-sidebar-toolbar.css'

interface NavSidebarProps {
  /** Toggles the cart drawer. Receives the new open state so the parent can
   *  mirror it into its own state. */
  onCartClick?: () => void
  /** Collapsed state — flips the chevron + hides labels. */
  collapsed?: boolean
  /** Fires when the user clicks the collapse chevron. */
  onToggleCollapse?: () => void
}

export function NavSidebar({
  onCartClick,
  collapsed,
  onToggleCollapse,
}: NavSidebarProps = {}) {
  const location = useLocation()
  const navigate = useNavigate()
  const { ready, authenticated, user } = usePrivy()
  const { login } = useLogin()
  const { addresses: linkedAddresses, primary: primaryWallet } =
    useLinkedWallets()
  // Identity wallet for the nav: prefer the linked "primary" (= addresses[0],
  // the public identity the profile and feed resolve against) so the nav
  // avatar + name match what's shown elsewhere. Privy's active wallet
  // (user.wallet.address) can be an embedded/undefined wallet, which left the
  // nav avatar blank even though the same user resolved fine on their profile.
  const address = primaryWallet ?? user?.wallet?.address ?? ''
  const { accounts: trustCircle, loading: trustLoading } = useTrustCircle(
    address ? [address] : undefined,
  )
  // Joined on-chain groups — the user is the subject of an
  // `is_member_of` claim. We piggyback on the shared useGroups cache
  // (also consumed by /circles) so there's no extra fetch from the rail.
  const { groups: allGroups } = useGroups()
  const joinedGroups = useMemo(() => {
    if (!authenticated || linkedAddresses.length === 0) return []
    const userWallets = new Set(linkedAddresses.map((a) => a.toLowerCase()))
    return allGroups.filter((g) =>
      g.memberships.some((m) => {
        const w = m.member.walletAddress?.toLowerCase()
        return w !== undefined && userWallets.has(w)
      }),
    )
  }, [authenticated, linkedAddresses, allGroups])
  const cart = useCart()
  const { theme, toggleTheme } = useTheme()
  // Mount the Ably subscription ONCE here (always-mounted rail): a realtime push
  // to notif:{wallet} refreshes the notifications / applications / membership
  // caches so the bell + admin panel + join gate update live instead of waiting
  // on the 30s REST poll.
  useNotificationsRealtime()

  const addresses: Address[] = address ? [address as Address] : []
  const { getDisplay, getAvatar } = useEnsNames(addresses)
  const ensName = address ? getDisplay(address as Address) : ''
  const ensAvatar = address ? getAvatar(address as Address) : ''
  const displayAddr = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : ''
  const googleAccount = user?.google as
    | { name?: string; profilePictureUrl?: string; email?: string }
    | undefined
  const profileAvatar = googleAccount?.profilePictureUrl || ensAvatar || ''
  // Graceful fallback for unloadable avatars (Google pics that 403, on-chain
  // `ipfs://` images the browser can't fetch, dead ENS URLs). Mirrors
  // MemberAvatar's onError pattern so the chip never shows a broken-image
  // icon — it drops to the coloured initials instead. Keyed on the src so a
  // newly-resolved avatar re-shows automatically without an effect.
  const [failedAvatarSrc, setFailedAvatarSrc] = useState<string | null>(null)
  const showAvatar = !!profileAvatar && profileAvatar !== failedAvatarSrc
  const profileName =
    googleAccount?.name ||
    ensName ||
    googleAccount?.email ||
    user?.email?.address ||
    displayAddr ||
    'User'

  const navItems: {
    to: string
    icon: typeof Home
    label: string
    public: boolean
    /** Onboarding-tour anchor (spotlight target). */
    tour?: string
  }[] = [
    {
      to: '/explore',
      icon: Globe,
      label: 'Explore',
      public: true,
      tour: 'nav-explore',
    },
    {
      to: '/circles',
      icon: Users,
      label: 'Circles',
      public: false,
      tour: 'nav-circles',
    },
    {
      to: '/compose',
      icon: Layers,
      label: 'Compose',
      public: false,
      tour: 'nav-compose',
    },
    { to: '/notifications', icon: Bell, label: 'Notifications', public: false },
  ]

  const quickLinks: {
    to: string
    icon: typeof Home
    label: string
    public: boolean
  }[] = [
    { to: '/platforms', icon: LineChart, label: 'Markets', public: false },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard', public: false },
    // Vote tab hidden for now (kept for a future update). To restore: re-add
    // `Vote` to the lucide import above and uncomment the line below.
    // { to: '/vote', icon: Vote, label: 'Vote', public: false },
  ]

  const renderItem = (item: {
    to: string
    icon: typeof Home
    label: string
    public: boolean
    tour?: string
  }) => {
    const locked = !item.public && !authenticated
    const active = location.pathname === item.to
    const Icon = item.icon
    if (locked) {
      return (
        <NavItem
          key={item.to}
          as="button"
          icon={<Icon className="h-4 w-4" />}
          label={item.label}
          locked
        />
      )
    }
    return (
      <Link
        key={item.to}
        to={item.to}
        style={{ display: 'block' }}
        data-tour={item.tour}
      >
        <NavItem
          as="button"
          icon={<Icon className="h-4 w-4" />}
          label={item.label}
          active={active}
        />
      </Link>
    )
  }

  return (
    <DsNavSidebar>
      {/* Top cluster — replaces the brand row. User profile sits on top,
          then a control row (theme toggle + collapse), then the cart. */}
      <div className="ns-top">
        <div className="ns-top-row">
          {ready && !authenticated && (
            <Button
              size="sm"
              className="ns-auth-connect"
              onClick={() => login()}
            >
              <Wallet className="h-5 w-5" />
              Connect
            </Button>
          )}
          {ready && authenticated && (
            <button
              type="button"
              className="ns-auth-chip"
              aria-label="Open your profile"
              onClick={() => navigate('/profile')}
            >
              {showAvatar ? (
                <img
                  src={profileAvatar}
                  alt={profileName}
                  referrerPolicy="no-referrer"
                  className="ns-auth-avatar"
                  onError={() => setFailedAvatarSrc(profileAvatar)}
                />
              ) : (
                <span className="ns-auth-avatar ns-auth-avatar--fallback">
                  {profileName.slice(0, 2).toUpperCase()}
                </span>
              )}
              <span className="ns-auth-meta">
                <span className="ns-auth-name">{profileName}</span>
                {displayAddr && (
                  <span className="ns-auth-sub">{displayAddr}</span>
                )}
              </span>
            </button>
          )}
        </div>

        {/* Controls — theme toggle + collapse, sit below the profile. */}
        <div className="ns-top-controls">
          <button
            type="button"
            className="nav-toggle ns-theme-toggle"
            onClick={toggleTheme}
            aria-label={
              theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
            }
            title={
              theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
            }
          >
            {theme === 'dark' ? (
              <Sun className="h-3 w-3" />
            ) : (
              <Moon className="h-3 w-3" />
            )}
          </button>
          {onToggleCollapse && (
            <button
              type="button"
              className="nav-toggle"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              ‹
            </button>
          )}
        </div>

        {/* Cart — sits directly below the profile chip. */}
        <button
          type="button"
          className={`ns-cart-btn${cart.count > 0 ? ' ns-cart-btn--filled' : ''}`}
          onClick={onCartClick}
          aria-label="Cart"
          title="Cart"
        >
          <ShoppingCart className="h-4 w-4" />
          <span className="ns-cart-label">Cart</span>
          {cart.count > 0 && (
            <span className="ns-cart-count">{cart.count}</span>
          )}
        </button>
      </div>

      <NavSection title="Navigation">{navItems.map(renderItem)}</NavSection>

      <NavSection title="Quick Access">{quickLinks.map(renderItem)}</NavSection>

      {authenticated ? (
        <NavSection title="Circles">
          {trustLoading ? (
            <p className="ns-tc-empty">Loading…</p>
          ) : (
            <div className="ns-circles-list">
              {trustCircle.length > 0 && (
                <Link
                  to="/circles/trust"
                  className="ns-circle"
                  title={`Trust Circle — ${trustCircle.length} member${trustCircle.length === 1 ? '' : 's'}`}
                >
                  <div className="ns-circle-head">
                    <span
                      className="ns-circle-dot"
                      style={{ background: 'var(--trusted, #6dd4a0)' }}
                    />
                    <span className="ns-circle-name">Trust Circle</span>
                    <span className="ns-circle-count">
                      {trustCircle.length}
                    </span>
                  </div>
                  <div className="ns-circle-avatars">
                    {trustCircle.slice(0, 5).map((a) => {
                      const bg = avatarColor(a.termId || a.label)
                      // Same universal fallback the feed/member lists use, so a
                      // wallet with no on-chain image still shows its generated
                      // avatar here instead of bare initials.
                      const img =
                        a.image ||
                        (a.walletAddress ? getAvatarUrl(a.walletAddress) : '')
                      return (
                        <Avatar
                          key={a.termId}
                          className="ns-mav"
                          style={{ background: bg }}
                        >
                          {img && <AvatarImage src={img} alt={a.label} />}
                          <AvatarFallback
                            className="text-[9px]"
                            style={{ background: bg, color: '#02000e' }}
                          >
                            {a.label.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )
                    })}
                    {trustCircle.length > 5 && (
                      <span className="ns-mav ns-mav-more">
                        +{trustCircle.length - 5}
                      </span>
                    )}
                    <span className="ns-mav ns-mav-add" aria-hidden="true">
                      +
                    </span>
                  </div>
                </Link>
              )}

              {/* Joined on-chain groups — rendered like Trust Circle so
                  the rail reads as a single uniform list of "circles
                  this user belongs to". */}
              {joinedGroups.map((group) => {
                const dotColor = avatarColor(group.termId || group.label)
                const previewMembers = group.memberships.slice(0, 5)
                const extra = Math.max(
                  0,
                  group.memberCount - previewMembers.length,
                )
                return (
                  <Link
                    key={group.termId}
                    to={`/circles/${group.termId}`}
                    className="ns-circle"
                    title={`${group.label} — ${group.memberCount} member${group.memberCount === 1 ? '' : 's'}`}
                  >
                    <div className="ns-circle-head">
                      <span
                        className="ns-circle-dot"
                        style={{ background: dotColor }}
                      />
                      <span className="ns-circle-name">{group.label}</span>
                      <span className="ns-circle-count">
                        {group.memberCount}
                      </span>
                    </div>
                    <div className="ns-circle-avatars">
                      {previewMembers.map((m) => {
                        const bg = avatarColor(
                          m.member.termId || m.member.label,
                        )
                        const img =
                          m.member.image ||
                          (m.member.walletAddress
                            ? getAvatarUrl(m.member.walletAddress)
                            : '')
                        return (
                          <Avatar
                            key={m.member.termId}
                            className="ns-mav"
                            style={{ background: bg }}
                          >
                            {img && (
                              <AvatarImage src={img} alt={m.member.label} />
                            )}
                            <AvatarFallback
                              className="text-[9px]"
                              style={{ background: bg, color: '#02000e' }}
                            >
                              {m.member.label.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )
                      })}
                      {extra > 0 && (
                        <span className="ns-mav ns-mav-more">+{extra}</span>
                      )}
                    </div>
                  </Link>
                )
              })}

              {trustCircle.length === 0 && joinedGroups.length === 0 && (
                <p className="ns-tc-empty">No circles yet.</p>
              )}
            </div>
          )}
        </NavSection>
      ) : null}
    </DsNavSidebar>
  )
}
