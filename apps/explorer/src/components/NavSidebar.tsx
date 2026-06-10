import { Link, useLocation } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import {
  NavSidebar as DsNavSidebar,
  NavBrand,
  NavSection,
  NavItem,
} from '@0xsofia/design-system'
import {
  Home,
  User,
  Flame,
  Vote,
  Globe,
  ShoppingCart,
  Users,
  Layers,
} from 'lucide-react'
import { useMemo } from 'react'
import { useTrustCircle } from '../hooks/useTrustCircle'
import { useLinkedWallets } from '../hooks/useLinkedWallets'
import { useGroups } from '../hooks/useGroups'
import { avatarColor } from '../utils/avatarColor'
import { useCart } from '../hooks/useCart'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
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
  const { authenticated, user } = usePrivy()
  const address = user?.wallet?.address ?? ''
  const { addresses: linkedAddresses } = useLinkedWallets()
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

  const navItems: {
    to: string
    icon: typeof Home
    label: string
    public: boolean
  }[] = [
    { to: '/profile', icon: User, label: 'My Profile', public: false },
    { to: '/explore', icon: Globe, label: 'Explore', public: true },
    { to: '/circles', icon: Users, label: 'Circles', public: false },
    { to: '/compose', icon: Layers, label: 'Compose', public: false },
  ]

  const quickLinks: {
    to: string
    icon: typeof Home
    label: string
    public: boolean
  }[] = [
    { to: '/platforms', icon: Globe, label: 'Platform Market', public: false },
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
        tag="v1.0"
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
        logo={<img src="/logo.png" alt="" className="nav-brand-logo" />}
      />

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

      {/* Bottom cluster — just the cart now (account/notifications moved to the
          top-right TopBar). margin-top:auto on .ns-bottom keeps it pinned low. */}
      <div className="ns-bottom">
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
    </DsNavSidebar>
  )
}
