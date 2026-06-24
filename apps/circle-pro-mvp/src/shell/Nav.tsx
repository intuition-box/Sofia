/**
 * Left rail — the REAL explorer nav. Uses the shared
 * `@0xsofia/design-system` primitives (NavSidebar / NavBrand / NavSection /
 * NavItem) + lucide icons, exactly like `apps/explorer`'s NavSidebar. The
 * explorer wires these to Privy/router/on-chain hooks; here they're mocked
 * (items toast, circles + profile are demo data) so the rail looks identical
 * without dragging the explorer's data layer.
 */
import {
  NavSidebar as DsNavSidebar,
  NavBrand,
  NavSection,
  NavItem,
} from '@0xsofia/design-system'
import { Bookmark, ShoppingCart } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { avGrad } from '../data/helpers'
import { toast } from '../lib/toast'
import '@0xsofia/design-system/styles/nav-sidebar.css'
import '../styles/nav-extras.css'

interface NavLink {
  id: string
  Icon: LucideIcon
  label: string
  active?: boolean
}

const NAV_ITEMS: NavLink[] = [{ id: 'mybookmarks', Icon: Bookmark, label: 'My bookmarks', active: true }]

interface CircleEntry {
  name: string
  teamId: string
  color: string
  count: number
  avs: number[]
  more: number
}

const CIRCLES: CircleEntry[] = [
  { name: 'Engineering', teamId: 'eng', color: '#3b82f6', count: 9, avs: [0, 2, 3, 4, 1], more: 4 },
  { name: 'Design', teamId: 'design', color: '#ec4899', count: 5, avs: [5, 1], more: 0 },
  { name: 'Marketing', teamId: 'marketing', color: '#8b5cf6', count: 7, avs: [3, 2], more: 0 },
]

function renderItem({ id, Icon, label, active }: NavLink) {
  return (
    <NavItem
      key={id}
      as="button"
      icon={<Icon size={16} />}
      label={label}
      active={active}
      onClick={() => toast(`Open ${label}`)}
    />
  )
}

export function Nav({ onOpenTeam }: { onOpenTeam: (id: string) => void }) {
  return (
    <DsNavSidebar>
      <NavBrand
        name="Sofia Pro"
        tag="MVP"
        logo={<span className="nav-brand-logo nbl-logo">S</span>}
      />

      <NavSection title="Navigation">{NAV_ITEMS.map(renderItem)}</NavSection>

      <NavSection title="Teams">
        <div className="ns-circles-list">
          {CIRCLES.map((c) => (
            <a
              key={c.name}
              className="ns-circle"
              href="#"
              title={`${c.name} — ${c.count} members`}
              onClick={(e) => {
                e.preventDefault()
                onOpenTeam(c.teamId)
              }}
            >
              <div className="ns-circle-head">
                <span className="ns-circle-dot" style={{ background: c.color }} />
                <span className="ns-circle-name">{c.name}</span>
                <span className="ns-circle-count">{c.count}</span>
              </div>
              <div className="ns-circle-avatars">
                {c.avs.map((g, j) => (
                  <span key={j} className="ns-mav" style={{ background: avGrad(g), zIndex: 9 - j }} />
                ))}
                {c.more > 0 ? (
                  <span className="ns-mav ns-mav-more">+{c.more}</span>
                ) : (
                  <span className="ns-mav ns-mav-add" aria-hidden="true">
                    +
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      </NavSection>

      <div className="ns-bottom">
        <button
          type="button"
          className="ns-cart-btn ns-cart-btn--filled"
          onClick={() => toast('Opening saved')}
          aria-label="Saved"
          title="Saved"
        >
          <ShoppingCart size={16} />
          <span className="ns-cart-label">Saved</span>
          <span className="ns-cart-count">3</span>
        </button>

        <button
          type="button"
          className="ns-auth-chip"
          aria-label="Open your profile"
          onClick={() => toast('Opening your profile')}
        >
          <span className="ns-auth-avatar ns-auth-avatar--fallback" style={{ background: avGrad(0) }}>
            SC
          </span>
          <span className="ns-auth-meta">
            <span className="ns-auth-name">Sam Chauché</span>
            <span className="ns-auth-sub">sam@acme.com</span>
          </span>
        </button>
      </div>
    </DsNavSidebar>
  )
}
