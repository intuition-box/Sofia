/**
 * Sofia Pro — app shell. Onboarding veil → the workspace's knowledge base.
 * Top-level surfaces: Essential and My bookmarks; clicking a team in the rail
 * opens its detail (TeamView). Multi-tenant via the CircleSwitcher. Real data.
 */
import { useEffect, useState } from 'react'
import { Nav } from './shell/Nav'
import { CircleSwitcher } from './shell/CircleSwitcher'
import { ProfileGate } from './shell/ProfileGate'
import { Toast, toast } from './lib/toast'
import { Bookmarks } from './tabs/Bookmarks'
import { Essential } from './tabs/Essential'
import { TeamView } from './tabs/TeamView'
import type { PublicDepartment } from './services/circleProApi'
import { Onboarding } from './onboarding/Onboarding'
import { TagGallery } from './components/TagGallery'
import { setImported } from './lib/imported'
import { useAuth } from './hooks/useAuth'
import { join } from './lib/gate'
import './onboarding/onboarding.css'
import './styles/shell.css'
import './styles/bookmarks.css'
import './styles/essential.css'
import './styles/post.css'
import './styles/team.css'
import './styles/surfaces.css'
import './styles/members-roles.css'
import './styles/activity-memory.css'
import './styles/archive.css'
import './styles/skill-view.css'
import './styles/tool-view.css'
import './styles/tags.css'
import './styles/overlays.css'
/* Button system last so its variants win over any leftover per-surface button
   appearance; retained classes keep only layout (margin/position). */
import './styles/buttons.css'

type Tab = 'essential' | 'bookmarks'

/** Dev-only tag design-system sheet: open the app with `?tags` in the URL. */
const SHOW_TAG_GALLERY = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('tags')

export default function App() {
  if (SHOW_TAG_GALLERY) return <TagGallery />

  const [tab, setTab] = useState<Tab>('essential')
  const [dept, setDept] = useState<PublicDepartment | null>(null)
  const [onboarding, setOnboarding] = useState(true)

  // Signing in unlocks the member-only surfaces (the local gate reflects real
  // auth). Guests still browse the public page.
  const { authenticated } = useAuth()
  useEffect(() => {
    if (authenticated) join()
  }, [authenticated])

  const goTab = (t: Tab) => {
    setTab(t)
    setDept(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const openDept = (d: PublicDepartment) => {
    setDept(d)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app">
      <Nav
        current={dept ? null : tab}
        onNav={goTab}
        activeDeptId={dept?.id ?? null}
        onOpenDepartment={openDept}
      />
      <main className="main">
        {onboarding ? (
          <Onboarding
            onComplete={(items) => {
              setImported(items)
              setOnboarding(false)
              goTab('bookmarks')
              toast(`Imported ${items.length} bookmarks`)
            }}
            onSkip={() => setOnboarding(false)}
          />
        ) : (
          <>
            <div className="main-topbar">
              <CircleSwitcher />
            </div>
            {dept ? (
              <TeamView key={dept.id} department={dept} onBack={() => setDept(null)} />
            ) : tab === 'essential' ? (
              <Essential />
            ) : (
              <Bookmarks />
            )}
          </>
        )}
      </main>

      <ProfileGate />
      <Toast />
    </div>
  )
}
