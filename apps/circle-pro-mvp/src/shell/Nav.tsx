/**
 * Left rail — the REAL explorer nav. Uses the shared
 * `@0xsofia/design-system` primitives (NavSidebar / NavSection / NavItem) +
 * lucide icons, exactly like `apps/explorer`'s NavSidebar. Identity comes from
 * NavAuthChip (Privy); the Teams section lists the workspace's real departments
 * (NavTeams). Collections is decorative for now.
 */
import { useState } from 'react'
import {
  NavSidebar as DsNavSidebar,
  NavSection,
  NavItem,
} from '@0xsofia/design-system'
import { Sparkles, Bookmark, Sun, Moon } from 'lucide-react'
import { NavAuthChip } from './NavAuthChip'
import { NavTeams } from './NavTeams'
import { toast } from '../lib/toast'
import { currentTheme, toggleTheme, type Theme } from '../lib/theme'
import type { PublicDepartment } from '../services/circleProApi'
import '@0xsofia/design-system/styles/nav-sidebar.css'
import '../styles/nav-extras.css'

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
  activeDeptId,
  onOpenDepartment,
}: {
  current: 'bookmarks' | 'essential' | null
  onNav: (v: 'bookmarks' | 'essential') => void
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
      </NavSection>

      <NavTeams activeId={activeDeptId} onOpen={onOpenDepartment} />

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
