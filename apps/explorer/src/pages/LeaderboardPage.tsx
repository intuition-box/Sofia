import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAccountWallet } from '../hooks/useAccountWallet'
import { Crosshair, Flame } from 'lucide-react'
import type { Address } from 'viem'
import { useAlphaTesters } from '../hooks/useAlphaTesters'
import Leaderboard from '../components/Leaderboard'
import { PageHero } from '@0xsofia/design-system'
import { PAGE_COLORS } from '../config/pageColors'
import '@/components/styles/pages.css'
import '@/components/styles/platform-market.css'
import '@/components/styles/market-pages.css'

export default function LeaderboardPage() {
  const walletAddress = useAccountWallet().address as Address | undefined

  const {
    leaderboard: alphaData,
    loading: alphaLoading,
    error: alphaError,
    refetch,
  } = useAlphaTesters()

  const pc = PAGE_COLORS['/leaderboard']
  const [params] = useSearchParams()
  // Trend Hunters moved to its own page, /spotters
  if (params.get('tab') === 'trend-hunters')
    return <Navigate to="/spotters" replace />

  return (
    <div>
      <PageHero
        background={pc.color}
        title={pc.title}
        description={pc.subtitle}
      />
      <div className="space-y-6 page-content page-enter">
        {/* Season hub (nav "Season") — streaks live on their own page. */}
        <div className="mk-season-links">
          <Link to="/spotters" className="pm-chip mk-season-link">
            <Crosshair className="h-3 w-3" aria-hidden />
            Spotters
          </Link>
          <Link to="/streaks" className="pm-chip mk-season-link">
            <Flame className="h-3 w-3" aria-hidden />
            Streaks
          </Link>
        </div>
        <Leaderboard
          alphaData={alphaData}
          alphaLoading={alphaLoading}
          alphaError={alphaError}
          connectedAddress={walletAddress ?? null}
          onRetry={() => refetch()}
        />
      </div>
    </div>
  )
}
