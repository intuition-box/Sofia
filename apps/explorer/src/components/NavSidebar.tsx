import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { usePrivy, useLogin, useLogout, useLinkAccount } from '@privy-io/react-auth'
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
  BarChart3,
  Globe,
  Bell,
  Sun,
  Moon,
  Wallet,
  LogOut,
  ShoppingCart,
  Users,
} from 'lucide-react'
import type { Address } from 'viem'
import { useTrustCircle } from '../hooks/useTrustCircle'
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
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { SEASON_END } from '../config'
import './styles/nav-sidebar-trust-circle.css'
import './styles/nav-sidebar-toolbar.css'

function getTimeLeft() {
  const diff = SEASON_END.getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

interface NavSidebarProps {
  /** Toggles the cart drawer. Receives the new open state so the parent can
   *  mirror it into its own state. */
  onCartClick?: () => void
  /** Collapsed state — flips the chevron + hides labels. */
  collapsed?: boolean
  /** Fires when the user clicks the collapse chevron. */
  onToggleCollapse?: () => void
}

export function NavSidebar({ onCartClick, collapsed, onToggleCollapse }: NavSidebarProps = {}) {
  const location = useLocation()
  const { ready, authenticated, user } = usePrivy()
  const { login } = useLogin()
  const { logout } = useLogout()
  const { linkWallet } = useLinkAccount({ onSuccess: () => window.location.reload() })
  const address = user?.wallet?.address ?? ''
  const { accounts: trustCircle, loading: trustLoading } = useTrustCircle(
    address ? [address] : undefined,
  )
  const cart = useCart()
  const { theme, toggleTheme } = useTheme()
  const [timeLeft, setTimeLeft] = useState(getTimeLeft)

  const addresses: Address[] = address ? [address as Address] : []
  const { getDisplay, getAvatar } = useEnsNames(addresses)
  const ensName = address ? getDisplay(address as Address) : ''
  const ensAvatar = address ? getAvatar(address as Address) : ''
  const displayAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''
  const googleAccount = user?.google as { name?: string; profilePictureUrl?: string; email?: string } | undefined
  const profileAvatar = googleAccount?.profilePictureUrl || ensAvatar || ''
  const profileName = googleAccount?.name || ensName || googleAccount?.email || user?.email?.address || displayAddr || 'User'

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1_000)
    return () => clearInterval(timer)
  }, [])

  const navItems: { to: string; icon: typeof Home; label: string; public: boolean }[] = [
    { to: '/feed', icon: Home, label: 'Home', public: true },
    { to: '/profile', icon: User, label: 'My Profile', public: false },
    { to: '/circles', icon: Users, label: 'Circles', public: false },
  ]

  const quickLinks: { to: string; icon: typeof Home; label: string; public: boolean }[] = [
    { to: '/platforms', icon: Globe, label: 'Platform Market', public: false },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard', public: true },
    { to: '/streaks', icon: Flame, label: 'Streaks', public: false },
    { to: '/vote', icon: Vote, label: 'Vote', public: false },
    { to: '/scores', icon: BarChart3, label: 'My Stats', public: false },
  ]

  const renderItem = (item: { to: string; icon: typeof Home; label: string; public: boolean }) => {
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
          {cart.count > 0 && <span className="ns-tool-badge">{cart.count}</span>}
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
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <NavSection title="Navigation">{navItems.map(renderItem)}</NavSection>

      <NavSection title="Quick Access">{quickLinks.map(renderItem)}</NavSection>

      {authenticated ? (
        <NavSection title="Circles">
          {trustLoading ? (
            <p className="ns-tc-empty">Loading…</p>
          ) : trustCircle.length === 0 ? (
            <p className="ns-tc-empty">No accounts yet.</p>
          ) : (
            <div className="ns-circles-list">
              <Link
                to="/circles/trust"
                className="ns-circle"
                title={`Trust Circle — ${trustCircle.length} member${trustCircle.length === 1 ? '' : 's'}`}
              >
                <div className="ns-circle-head">
                  <span className="ns-circle-dot" style={{ background: 'var(--trusted, #6dd4a0)' }} />
                  <span className="ns-circle-name">Trust Circle</span>
                  <span className="ns-circle-count">{trustCircle.length}</span>
                </div>
                <div className="ns-circle-avatars">
                  {trustCircle.slice(0, 5).map((a) => {
                    const bg = avatarColor(a.termId || a.label)
                    return (
                      <Avatar key={a.termId} className="ns-mav" style={{ background: bg }}>
                        {a.image && <AvatarImage src={a.image} alt={a.label} />}
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
                    <span className="ns-mav ns-mav-more">+{trustCircle.length - 5}</span>
                  )}
                  <span className="ns-mav ns-mav-add" aria-hidden="true">+</span>
                </div>
              </Link>
            </div>
          )}
        </NavSection>
      ) : null}

      {/* Bottom cluster — countdown sits on top, auth (profile/disconnect)
          pinned right below it. margin-top:auto on .ns-bottom pulls the
          whole group to the bottom of the rail. */}
      <div className="ns-bottom">
        <div className="ns-countdown">
          <p className="ns-countdown-time">
            {timeLeft.days}d {pad(timeLeft.hours)}h {pad(timeLeft.minutes)}m {pad(timeLeft.seconds)}s
          </p>
          <p className="ns-countdown-hint">remaining — Alpha Reward Program is live</p>
        </div>

        {ready && !authenticated && (
          <Button size="sm" className="ns-auth-connect" onClick={() => login()}>
            <Wallet className="h-4 w-4 mr-1" />
            Connect
          </Button>
        )}
        {ready && authenticated && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="ns-auth-chip" aria-label="Account menu">
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
                  {displayAddr && <span className="ns-auth-sub">{displayAddr}</span>}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top">
              {!address && (
                <DropdownMenuItem onClick={() => linkWallet()}>
                  <Wallet className="mr-2 h-4 w-4" />
                  Link Wallet
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </DsNavSidebar>
  )
}
