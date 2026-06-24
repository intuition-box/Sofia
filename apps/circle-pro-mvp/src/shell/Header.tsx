/**
 * Circle header — identity, KPIs, and the tab bar. Ported from
 * `CircleHeaderV2` in `circle-pro2/AppV2.jsx`.
 */
import { CIRCLE } from '../data/mock'

export type TabId = 'essential' | 'bookmarks' | 'overview' | 'roles' | 'members' | 'team'

interface Tab {
  id: TabId
  label: string
}

export const TABS: Tab[] = [
  { id: 'overview', label: 'Topic' },
]

interface HeaderProps {
  tab: TabId
  onTab: (t: TabId) => void
  teamTab?: Tab
}

export function Header({ tab, onTab, teamTab }: HeaderProps) {
  const tabs = teamTab ? [...TABS, teamTab] : TABS
  return (
    <header className="cheader cheader-v2">
      <div className="cheader-top">
        <div className="cheader-id">
          <div>
            <h1 className="cheader-name">{CIRCLE.name}</h1>
            <p className="cheader-desc cheader-desc-wide">{CIRCLE.description}</p>
          </div>
        </div>
      </div>

      <nav className="ctabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`ctab${tab === t.id ? ' active' : ''}`}
            onClick={() => onTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </header>
  )
}
