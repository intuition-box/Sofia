/**
 * Sofia Pro — app shell. Onboarding veil → a topic-first personal knowledge
 * base. Two surfaces only: My bookmarks (the home) and Overview. Members is a
 * drill-in from the Overview topic map. All data is mocked.
 */
import { useEffect, useState } from 'react'
import { Nav } from './shell/Nav'
import { CircleSwitcher } from './shell/CircleSwitcher'
import { ProfileGate } from './shell/ProfileGate'
import { Toast, toast } from './lib/toast'
import { Bookmarks } from './tabs/Bookmarks'
import { Essential } from './tabs/Essential'
import { TeamView, type TeamMeta } from './tabs/TeamView'
import { Onboarding } from './onboarding/Onboarding'
import { TagGallery } from './components/TagGallery'
import { setImported } from './lib/imported'
import { useAuth } from './hooks/useAuth'
import { join } from './lib/gate'
import { TEAM_MAP } from './data/teams'
import './onboarding/onboarding.css'
import './styles/shell.css'
import './styles/bookmarks.css'
import './styles/essential.css'
import './styles/post.css'
import './styles/team.css'
import './styles/surfaces.css'
import './styles/members-roles.css'
import './styles/activity-memory.css'
import './styles/tags.css'
import './styles/overlays.css'

/** Which top-level surface is showing. */
export type TabId = 'essential' | 'bookmarks' | 'overview' | 'roles' | 'members' | 'team'

/** Dev-only tag design-system sheet: open the app with `?tags` in the URL. */
const SHOW_TAG_GALLERY = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('tags')

export default function App() {
  if (SHOW_TAG_GALLERY) return <TagGallery />

  const [tab, setTab] = useState<TabId>('essential')
  const [team, setTeam] = useState<TeamMeta | null>(null)
  const [onboarding, setOnboarding] = useState(true)

  // Signing in unlocks the member-only surfaces (the mock gate reflects real
  // auth). Guests still browse the public page.
  const { authenticated } = useAuth()
  useEffect(() => {
    if (authenticated) join()
  }, [authenticated])

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

  return (
    <div className="app">
      <Nav
        current={tab === 'bookmarks' ? 'bookmarks' : tab === 'essential' ? 'essential' : null}
        onNav={(v) => goTab(v)}
        onOpenTeam={openTeam}
      />
      <main className="main">
        {onboarding ? (
          <Onboarding
            onComplete={(items) => {
              setImported(items)
              setOnboarding(false)
              goTab('bookmarks')
              toast(`Imported ${items.length} bookmarks into Intuition Core Team`)
            }}
            onSkip={() => setOnboarding(false)}
          />
        ) : (
          <>
            <div className="main-topbar">
              <CircleSwitcher />
            </div>
            {tab === 'essential' ? (
              <Essential />
            ) : tab === 'bookmarks' ? (
              <Bookmarks />
            ) : tab === 'team' && team ? (
              <TeamView key={team.id} team={team} />
            ) : null}
          </>
        )}
      </main>

      <ProfileGate />
      <Toast />
    </div>
  )
}
