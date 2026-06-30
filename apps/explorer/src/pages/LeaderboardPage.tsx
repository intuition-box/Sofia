import { usePrivy } from '@privy-io/react-auth'
import type { Address } from 'viem'
import { useAlphaTesters } from '../hooks/useAlphaTesters'
import Leaderboard from '../components/Leaderboard'
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
    refetch,
  } = useAlphaTesters()

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
          connectedAddress={walletAddress ?? null}
          onRetry={() => refetch()}
        />
      </div>
    </div>
  )
}
