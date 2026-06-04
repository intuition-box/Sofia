import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Address } from 'viem'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Star } from 'lucide-react'
import TrendingPages from './TrendingPages'
import { useRightRailContent } from '@/contexts/RightRailContext'
import { useTrustLeaderboard } from '@/hooks/useTrustLeaderboard'
import { useEnsNames } from '@/hooks/useEnsNames'
import './styles/layout.css'

const TOP_REPUTATIONS_COUNT = 3

export function RightSidebar({ hidden = false }: { hidden?: boolean }) {
  // Every consumer route (full-width pages, profile pages, cart open,
  // non-desktop) currently passes `hidden`. Early-return so the rail's
  // GraphQL hooks (useEnsNames, TrendingPages → useTrending) don't fire
  // on /explore cold-load and pile onto the upstream rate-limit gate.
  if (hidden) return null

  return <RightSidebarContent />
}

function RightSidebarContent() {
  const injected = useRightRailContent()
  const { rankings, loading } = useTrustLeaderboard()

  const top = useMemo(
    () => rankings.slice(0, TOP_REPUTATIONS_COUNT),
    [rankings],
  )
  const topAddresses = useMemo(
    () => top.map((r) => r.address as Address),
    [top],
  )
  const { getDisplay, getAvatar } = useEnsNames(topAddresses)

  return (
    <aside className="fixed right-0 top-0 overflow-y-auto z-40 rs-aside">
      <div className="p-4 space-y-6">
        {injected ?? (
          <>
            {/* Top Reputations — eigentrust top 3 */}
            <Card style={{ gap: 0 }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Top Reputations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading && top.length === 0 ? (
                  <p className="text-xs text-center text-muted-foreground py-4">
                    Loading reputations…
                  </p>
                ) : top.length === 0 ? (
                  <p className="text-xs text-center text-muted-foreground py-4">
                    No reputations yet.
                  </p>
                ) : (
                  <>
                    {top.map((entry) => {
                      const addr = entry.address as Address
                      const display = getDisplay(addr)
                      const avatar = getAvatar(addr)
                      return (
                        <Link
                          key={addr}
                          to={`/profile/${addr}`}
                          className="flex items-center justify-between hover:opacity-80"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={avatar} alt={display} />
                              <AvatarFallback className="text-xs">
                                {addr.slice(2, 4).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{display}</p>
                              <p className="text-xs text-muted-foreground">
                                Score: {entry.score.toFixed(4)}
                              </p>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Trending Pages */}
            <TrendingPages />
          </>
        )}
      </div>
    </aside>
  )
}
