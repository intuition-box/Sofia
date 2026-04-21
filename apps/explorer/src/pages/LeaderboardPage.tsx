import { usePrivy } from '@privy-io/react-auth'
import { formatEther } from 'viem'
import type { Address } from 'viem'
import { useAlphaTesters } from '../hooks/useAlphaTesters'
import { useSeasonPool } from '../hooks/useSeasonPool'
import { useUserStats } from '../hooks/useUserStats'
import StatsRibbon from '../components/StatsRibbon'
import PersonalStats from '../components/PersonalStats'
import Leaderboard from '../components/Leaderboard'
import FooterCTA from '../components/FooterCTA'
import PageHeader from '../components/PageHeader'
import { PAGE_COLORS } from '../config/pageColors'
import '@/components/styles/pages.css'

export default function LeaderboardPage() {
  const { authenticated, user } = usePrivy()
  const walletAddress = user?.wallet?.address as Address | undefined
  const displayName = walletAddress
    ? walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4)
    : ''

  const { leaderboard: alphaData, totals, loading: alphaLoading, error: alphaError } = useAlphaTesters()
  const { data: poolData, vaultStats, loading: poolLoading, error: poolError } = useSeasonPool(true)
  const userStats = useUserStats(walletAddress || null, alphaData, poolData)

  const stats = [
    { label: 'Wallets', value: String(totals.wallets) },
    { label: 'Transactions', value: String(totals.tx) },
    { label: 'Intentions', value: String(totals.intentions) },
    { label: 'Pioneers', value: String(totals.pioneers) },
    {
      label: 'Trust Volume',
      value: totals.trustVolume > 0n
        ? `${parseFloat(formatEther(totals.trustVolume)).toFixed(2)} T`
        : '0',
    },
  ]

  const pc = PAGE_COLORS['/leaderboard']

  return (
    <div>
      <PageHeader color={pc.color} glow={pc.glow} title={pc.title} subtitle={pc.subtitle} />
      <div className="space-y-6 page-content page-enter">
      <StatsRibbon stats={alphaLoading ? [] : stats} />

      {authenticated && walletAddress && userStats && (
        <PersonalStats
          userStats={userStats}
          totalAlphaTesters={totals.wallets}
          totalPoolStakers={vaultStats?.totalStakers ?? null}
          walletAddress={walletAddress}
          displayName={displayName}
        />
      )}

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
