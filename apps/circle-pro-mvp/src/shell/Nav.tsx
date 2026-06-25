/**
 * Left rail — the REAL explorer nav. Uses the shared
 * `@0xsofia/design-system` primitives (NavSidebar / NavBrand / NavSection /
 * NavItem) + lucide icons, exactly like `apps/explorer`'s NavSidebar. The
 * explorer wires these to Privy/router/on-chain hooks; here they're mocked
 * (items toast, circles + profile are demo data) so the rail looks identical
 * without dragging the explorer's data layer.
 */
import { useState } from 'react'
import {
  NavSidebar as DsNavSidebar,
  NavSection,
  NavItem,
} from '@0xsofia/design-system'
import { Sparkles, Bookmark, Sun, Moon } from 'lucide-react'
import { avGrad } from '../data/helpers'
import { toast } from '../lib/toast'
import { currentTheme, toggleTheme, type Theme } from '../lib/theme'
import '@0xsofia/design-system/styles/nav-sidebar.css'
import '../styles/nav-extras.css'

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

// Collections = saved tools + topics, browsable from the rail's bottom section.
const COLL_TOOLS = [
  { label: 'Figma', host: 'figma.com' },
  { label: 'Notion', host: 'notion.so' },
  { label: 'Linear', host: 'linear.app' },
]
const COLL_TOPICS = [
  { label: 'Growth', color: '#22c55e' },
  { label: 'AI tooling', color: '#8b5cf6' },
  { label: 'Design system', color: '#ec4899' },
]

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => currentTheme())
  return (
    <button type="button" className="ns-theme-toggle" onClick={() => setTheme(toggleTheme())} aria-label="Toggle theme">
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
    </button>
  )
}

export function Nav({
  current,
  onNav,
  onOpenTeam,
}: {
  current: 'bookmarks' | 'essential' | null
  onNav: (v: 'bookmarks' | 'essential') => void
  onOpenTeam: (id: string) => void
}) {
  return (
    <DsNavSidebar>
      <button
        type="button"
        className="ns-auth-chip ns-auth-chip--top"
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

      <NavSection title="Navigation">
        <NavItem
          as="button"
          icon={<Sparkles size={16} />}
          label="Essential"
          active={current === 'essential'}
          onClick={() => onNav('essential')}
        />
        <NavItem
          as="button"
          icon={<Bookmark size={16} />}
          label="My bookmarks"
          active={current === 'bookmarks'}
          onClick={() => onNav('bookmarks')}
        />
      </NavSection>

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
          <button className="ns-team-add" onClick={() => toast('Create a new team')}>
            <span className="ns-team-add-ic">＋</span>
            Create new
          </button>
        </div>
      </NavSection>

      <NavSection title="Collections">
        {COLL_TOOLS.map((t) => (
          <NavItem
            as="button"
            key={t.label}
            icon={<img className="ns-coll-fav" src={`https://www.google.com/s2/favicons?domain=${t.host}&sz=64`} alt="" />}
            label={t.label}
            onClick={() => toast(`Opening ${t.label}`)}
          />
        ))}
        {COLL_TOPICS.map((t) => (
          <NavItem
            as="button"
            key={t.label}
            icon={<span className="ns-coll-dot" style={{ background: t.color }} />}
            label={`#${t.label}`}
            onClick={() => toast(`Opening ${t.label}`)}
          />
        ))}
      </NavSection>

      <div className="ns-foot">
        <ThemeToggle />
      </div>
    </DsNavSidebar>
  )
}
