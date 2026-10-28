/**
 * TrendHuntersPage — `/spotters` (Trend Hunters in the code and the API). Public: a newcomer (often from a
 * shared link) reads how it works first; a signed-in hunter sees their month.
 */
import { PageHero } from '@0xsofia/design-system'
import type { Address } from 'viem'
import TrendHuntersBoard from '@/components/leaderboard/TrendHuntersBoard'
import { PAGE_COLORS } from '@/config/pageColors'
import { useAccountWallet } from '@/hooks/useAccountWallet'
import '@/components/styles/pages.css'
import '@/components/styles/platform-market.css'

export default function TrendHuntersPage() {
  const address = useAccountWallet().address as Address | undefined
  const pc = PAGE_COLORS['/spotters']

  return (
    <div className="page-content page-enter">
      <PageHero
        background={pc.color}
        title={pc.title}
        description={pc.subtitle}
      />
      <TrendHuntersBoard connectedAddress={address ?? null} />
    </div>
  )
}
