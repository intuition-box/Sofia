/**
 * Left rail — the REAL explorer nav. Navigation items route to real surfaces;
 * the Teams section lists the workspace's departments (click → detail), like the
 * old mock but backed by real data. Identity comes from NavAuthChip (Privy).
 */
import { useState } from 'react'
import {
  NavSidebar as DsNavSidebar,
  NavSection,
  NavItem,
} from '@0xsofia/design-system'
import { Sparkles, Bookmark, Users, Activity, Sun, Moon } from 'lucide-react'
import { NavAuthChip } from './NavAuthChip'
import { NavTeams } from './NavTeams'
import { currentTheme, toggleTheme, type Theme } from '../lib/theme'
import type { PublicDepartment } from '../services/circleProApi'
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
  activeDeptId,
  onOpenDepartment,
}: {
  current: NavTarget | null
  onNav: (v: NavTarget) => void
  activeDeptId: string | null
  onOpenDepartment: (dept: PublicDepartment) => void
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

      <NavTeams activeId={activeDeptId} onOpen={onOpenDepartment} />

      <div className="ns-foot">
        <ThemeToggle />
      </div>
    </DsNavSidebar>
  )
}
