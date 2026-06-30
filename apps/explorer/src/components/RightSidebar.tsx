import { useRightRailContent } from '@/contexts/RightRailContext'
import './styles/layout.css'

export function RightSidebar({ hidden = false }: { hidden?: boolean }) {
  // Every consumer route (full-width pages, profile pages, cart open,
  // non-desktop) currently passes `hidden`. Early-return so the rail's
  // GraphQL hooks don't fire on /explore cold-load and pile onto the
  // upstream rate-limit gate.
  if (hidden) return null

  return <RightSidebarContent />
}

function RightSidebarContent() {
  // The rail ONLY shows content a page injects via `useProvideRightRail`
  // (e.g. the platforms market rail). The old "Top Reputations" + "Trending
  // Pages" fallback belonged to a previous explorer version and must never
  // render again.
  const injected = useRightRailContent()

  return (
    <aside className="fixed right-0 top-0 overflow-y-auto z-40 rs-aside">
      <div className="p-4 space-y-6">{injected}</div>
    </aside>
  )
}
