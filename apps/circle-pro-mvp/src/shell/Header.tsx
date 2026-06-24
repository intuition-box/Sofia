/**
 * Circle header — identity, KPIs, and the tab bar. Ported from
 * `CircleHeaderV2` in `circle-pro2/AppV2.jsx`.
 */
import { Icon } from '../components/Icon'
import { CIRCLE } from '../data/mock'
import { useJoined, requireJoin } from '../lib/gate'
import { toast } from '../lib/toast'

export type TabId = 'bookmarks' | 'overview' | 'members' | 'team'

interface Tab {
  id: TabId
  label: string
}

export const TABS: Tab[] = [
  { id: 'bookmarks', label: 'My bookmarks' },
  { id: 'overview', label: 'Explore' },
]

interface HeaderProps {
  tab: TabId
  onTab: (t: TabId) => void
  teamTab?: Tab
}

export function Header({ tab, onTab, teamTab }: HeaderProps) {
  const tabs = teamTab ? [...TABS, teamTab] : TABS
  const joined = useJoined()
  return (
    <header className="cheader cheader-v2">
      <div className="cheader-top">
        <div className="cheader-id">
          <span className="cheader-logo">S</span>
          <div>
            <h1 className="cheader-name">{CIRCLE.name}</h1>
            <p className="cheader-desc cheader-desc-wide">{CIRCLE.description}</p>
            <div className="cheader-actions cheader-actions-under">
              {joined ? (
                <button className="btn cheader-member" onClick={() => toast("You're a member of this workspace")}>
                  <Icon name="check" /> Member
                </button>
              ) : (
                <button className="btn btn-accent" onClick={() => requireJoin('join the workspace')}>
                  Join workspace
                </button>
              )}
              <button className="btn btn-sm" onClick={() => toast('Share link copied')}>
                <Icon name="send" /> Share
              </button>
            </div>
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
