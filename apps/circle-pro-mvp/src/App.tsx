/**
 * Sofia Pro — app shell. Onboarding veil → a topic-first personal knowledge
 * base. Two surfaces only: My bookmarks (the home) and Overview. Members is a
 * drill-in from the Overview topic map. All data is mocked.
 */
import { useState } from 'react'
import { Nav } from './shell/Nav'
import { Header, type TabId } from './shell/Header'
import { JoinModal } from './shell/JoinModal'
import { Toast, toast } from './lib/toast'
import { Bookmarks } from './tabs/Bookmarks'
import { Overview } from './tabs/Overview'
import { Members } from './tabs/Members'
import { TeamView, type TeamMeta } from './tabs/TeamView'
import { Onboarding } from './onboarding/Onboarding'
import { setImported } from './lib/imported'
import { TEAM_MAP } from './data/teams'
import './onboarding/onboarding.css'
import './styles/shell.css'
import './styles/bookmarks.css'
import './styles/post.css'
import './styles/team.css'
import './styles/surfaces.css'
import './styles/members-roles.css'
import './styles/activity-memory.css'
import './styles/overlays.css'

export default function App() {
  const [tab, setTab] = useState<TabId>('bookmarks')
  const [domain, setDomain] = useState('all')
  const [team, setTeam] = useState<TeamMeta | null>(null)
  const [onboarding, setOnboarding] = useState(true)

  const goTab = (t: TabId) => {
    setTab(t)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const openTeam = (id: string) => {
    const t = TEAM_MAP[id]
    if (!t) return
    setTeam({ id, label: t.label, color: t.color })
    setTab('team')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const goTopic = (id: string) => {
    setDomain(id)
    setTab('members')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app">
      <Nav onOpenTeam={openTeam} />
      <main className="main">
        <Header tab={tab} onTab={goTab} teamTab={team ? { id: 'team', label: team.label } : undefined} />
        {tab === 'bookmarks' ? <Bookmarks /> : null}
        {tab === 'overview' ? <Overview onTopic={goTopic} /> : null}
        {tab === 'members' ? <Members domain={domain} setDomain={setDomain} /> : null}
        {tab === 'team' && team ? <TeamView key={team.id} team={team} /> : null}

        <footer className="foot">
          <span>Sofia Pro</span>
          <span className="sep">/</span>
          <span>Acme workspace</span>
          <span className="sep">/</span>
          <span>Internal knowledge base · mocked demo</span>
          <div className="right">
            <a href="#" onClick={(e) => e.preventDefault()}>
              Docs
            </a>
            <a href="#" onClick={(e) => e.preventDefault()}>
              Methodology
            </a>
            <span>v0.1 · mvp</span>
          </div>
        </footer>
      </main>

      <JoinModal />
      <Toast />

      {onboarding ? (
        <Onboarding
          onComplete={(items) => {
            setImported(items)
            setOnboarding(false)
            goTab('bookmarks')
            toast(`Imported ${items.length} bookmarks into Acme`)
          }}
          onSkip={() => setOnboarding(false)}
        />
      ) : null}
    </div>
  )
}
