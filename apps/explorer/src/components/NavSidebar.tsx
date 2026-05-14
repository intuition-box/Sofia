import { Link, useLocation } from 'react-router-dom'
import {
  usePrivy,
  useLogin,
  useLogout,
  useLinkAccount,
} from '@privy-io/react-auth'
import {
  NavSidebar as DsNavSidebar,
  NavBrand,
  NavSection,
  NavItem,
} from '@0xsofia/design-system'
import {
  Home,
  User,
  Trophy,
  Flame,
  Vote,
  Globe,
  Bell,
  Sun,
  Moon,
  Wallet,
  LogOut,
  ShoppingCart,
  Users,
  Layers,
  Puzzle,
  Check,
} from 'lucide-react'
import type { Address } from 'viem'
import { useMemo } from 'react'
import { useTrustCircle } from '../hooks/useTrustCircle'
import { useLinkedWallets } from '../hooks/useLinkedWallets'
import { useGroups } from '../hooks/useGroups'
import { useExtensionInstalled } from '../hooks/useExtensionInstalled'
import { CHROME_STORE_URL } from '../utils/sofiaDetect'
import { avatarColor } from '../utils/avatarColor'
import { useCart } from '../hooks/useCart'
import { useTheme } from '../hooks/useTheme'
import { useEnsNames } from '../hooks/useEnsNames'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
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
  const { ready, authenticated, user } = usePrivy()
  const { login } = useLogin()
  const { logout } = useLogout()
  const { linkWallet } = useLinkAccount({
    onSuccess: () => window.location.reload(),
  })
  const address = user?.wallet?.address ?? ''
  const { addresses: linkedAddresses, primary: primaryWallet } =
    useLinkedWallets()
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
  const extensionInstalled = useExtensionInstalled()

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
  }[] = [
    { to: '/circles', icon: Users, label: 'Circles', public: false },
    { to: '/feed', icon: Home, label: 'Home', public: true },
    { to: '/compose', icon: Layers, label: 'Compose', public: false },
    { to: '/profile', icon: User, label: 'My Profile', public: false },
  ]

  const quickLinks: {
    to: string
    icon: typeof Home
    label: string
    public: boolean
  }[] = [
    { to: '/platforms', icon: Globe, label: 'Platform Market', public: false },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard', public: true },
    { to: '/streaks', icon: Flame, label: 'Streaks', public: false },
    { to: '/vote', icon: Vote, label: 'Vote', public: false },
  ]

  const renderItem = (item: {
    to: string
    icon: typeof Home
    label: string
    public: boolean
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
      <Link key={item.to} to={item.to} style={{ display: 'block' }}>
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
      <NavBrand
        name="Sofia Explorer"
        tag="v0.4"
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
        logo={
          <img
            src={theme === 'dark' ? '/logo.png' : '/logo_invert.png'}
            alt=""
            className="nav-brand-logo"
          />
        }
      />

      {/* Toolbar — cart / notifications / theme toggle. Home lives as a
          nav-item below (Navigation section). */}
      <div className="ns-toolbar" role="toolbar" aria-label="Quick actions">
        <button
          type="button"
          className={`ns-tool-btn${cart.count > 0 ? ' ns-tool-btn--filled' : ''}`}
          onClick={onCartClick}
          aria-label="Cart"
          title="Cart"
        >
          <ShoppingCart className="h-4 w-4" />
          {cart.count > 0 && (
            <span className="ns-tool-badge">{cart.count}</span>
          )}
        </button>
        <button
          type="button"
          className="ns-tool-btn"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="ns-tool-btn"
          onClick={toggleTheme}
          aria-label={
            theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
          }
          title={
            theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
          }
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
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
                      return (
                        <Avatar
                          key={a.termId}
                          className="ns-mav"
                          style={{ background: bg }}
                        >
                          {a.image && (
                            <AvatarImage src={a.image} alt={a.label} />
                          )}
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
                        return (
                          <Avatar
                            key={m.member.termId}
                            className="ns-mav"
                            style={{ background: bg }}
                          >
                            {m.member.image && (
                              <AvatarImage
                                src={m.member.image}
                                alt={m.member.label}
                              />
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

      {/* Bottom cluster — countdown sits on top, auth (profile/disconnect)
          pinned right below it. margin-top:auto on .ns-bottom pulls the
          whole group to the bottom of the rail. */}
      <div className="ns-bottom">
        {extensionInstalled ? (
          <button
            type="button"
            className="ns-extension-btn ns-extension-btn--installed"
            disabled
            aria-label="Extension installed"
            title="Sofia extension installed"
          >
            <Check className="h-4 w-4" />
            {!collapsed && <span>Extension installed</span>}
          </button>
        ) : (
          <a
            className="ns-extension-btn"
            href={CHROME_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download the Sofia extension"
            title="Download the Sofia extension"
          >
            <Puzzle className="h-4 w-4" />
            {!collapsed && <span>Download the extension</span>}
          </a>
        )}
        {ready && !authenticated && (
          <Button size="sm" className="ns-auth-connect" onClick={() => login()}>
            <Wallet className="h-4 w-4 mr-1" />
            Connect
          </Button>
        )}
        {ready && authenticated && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="ns-auth-chip"
                aria-label="Account menu"
              >
                {profileAvatar ? (
                  <img
                    src={profileAvatar}
                    alt={profileName}
                    referrerPolicy="no-referrer"
                    className="ns-auth-avatar"
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
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              side="top"
              className="ns-auth-menu"
            >
              {/* Header — who's logged in */}
              <div className="ns-auth-menu-head">
                {profileAvatar ? (
                  <img
                    src={profileAvatar}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="ns-auth-menu-avatar"
                  />
                ) : (
                  <span className="ns-auth-menu-avatar ns-auth-menu-avatar--fallback">
                    {profileName.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="ns-auth-menu-ident">
                  <span className="ns-auth-menu-name">{profileName}</span>
                  {displayAddr && (
                    <span className="ns-auth-menu-sub">{displayAddr}</span>
                  )}
                </div>
              </div>

              {linkedAddresses.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="ns-auth-menu-label">
                    Wallets
                  </DropdownMenuLabel>
                  {linkedAddresses.map((addr) => {
                    const isPrimary =
                      primaryWallet?.toLowerCase() === addr.toLowerCase()
                    const short = `${addr.slice(0, 6)}…${addr.slice(-4)}`
                    return (
                      <DropdownMenuItem
                        key={addr}
                        className="ns-auth-menu-wallet"
                        onSelect={(e) => e.preventDefault()}
                        title={addr}
                      >
                        <span
                          className={`ns-auth-menu-dot${isPrimary ? ' is-primary' : ''}`}
                          aria-hidden="true"
                        />
                        <span className="ns-auth-menu-wallet-addr">
                          {short}
                        </span>
                        {isPrimary && (
                          <span className="ns-auth-menu-wallet-tag">
                            primary
                          </span>
                        )}
                      </DropdownMenuItem>
                    )
                  })}
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => linkWallet()}
                className="ns-auth-menu-action"
              >
                <Wallet className="h-4 w-4" />
                Link another wallet
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => logout()}
                className="ns-auth-menu-action ns-auth-menu-action--danger"
              >
                <LogOut className="h-4 w-4" />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </DsNavSidebar>
  )
}
