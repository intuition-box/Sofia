import { usePrivy } from '@privy-io/react-auth'
import type { Address } from 'viem'
import { useAlphaTesters } from '../hooks/useAlphaTesters'
import { useSeasonPool } from '../hooks/useSeasonPool'
import Leaderboard from '../components/Leaderboard'
import FooterCTA from '../components/FooterCTA'
import { PageHero } from '@0xsofia/design-system'
import { PAGE_COLORS } from '../config/pageColors'
import '@/components/styles/pages.css'

export default function LeaderboardPage() {
  const { user } = usePrivy()
  const walletAddress = user?.wallet?.address as Address | undefined

  const {
    leaderboard: alphaData,
    loading: alphaLoading,
    error: alphaError,
  } = useAlphaTesters()
  const {
    data: poolData,
    loading: poolLoading,
    error: poolError,
  } = useSeasonPool(true)

  const pc = PAGE_COLORS['/leaderboard']

  return (
    <div>
      <PageHero
        background={pc.color}
        title={pc.title}
        description={pc.subtitle}
      />
      <div className="space-y-6 page-content page-enter">
        <Leaderboard
          alphaData={alphaData}
          alphaLoading={alphaLoading}
          alphaError={alphaError}
          poolData={poolData}
          poolLoading={poolLoading}
          poolError={poolError}
          connectedAddress={walletAddress ?? null}
        />

        <FooterCTA />
      </div>
    </div>
  )
}
