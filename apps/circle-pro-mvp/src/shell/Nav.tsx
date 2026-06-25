/**
 * Left rail — the REAL explorer nav. Uses the shared `@0xsofia/design-system`
 * primitives (NavSidebar / NavSection / NavItem) + lucide icons, like
 * `apps/explorer`'s NavSidebar. Every entry routes to a real surface (no mock
 * teams/collections); identity comes from NavAuthChip (Privy).
 */
import { useState } from 'react'
import {
  NavSidebar as DsNavSidebar,
  NavSection,
  NavItem,
} from '@0xsofia/design-system'
import { Sparkles, Bookmark, Users, Activity, Sun, Moon } from 'lucide-react'
import { NavAuthChip } from './NavAuthChip'
import { currentTheme, toggleTheme, type Theme } from '../lib/theme'
import '@0xsofia/design-system/styles/nav-sidebar.css'
import '../styles/nav-extras.css'

export type NavTarget = 'essential' | 'bookmarks' | 'members' | 'activity'

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
}: {
  current: NavTarget | null
  onNav: (v: NavTarget) => void
}) {
  return (
    <DsNavSidebar>
      <NavAuthChip />

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
        <NavItem
          as="button"
          icon={<Users size={16} />}
          label="Members"
          active={current === 'members'}
          onClick={() => onNav('members')}
        />
        <NavItem
          as="button"
          icon={<Activity size={16} />}
          label="Activity"
          active={current === 'activity'}
          onClick={() => onNav('activity')}
        />
      </NavSection>

      <div className="ns-foot">
        <ThemeToggle />
      </div>
    </DsNavSidebar>
  )
}
