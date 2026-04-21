import { useState } from 'react'
import { formatEther } from 'viem'
import type { Address } from 'viem'
import { useStreakLeaderboard } from '../hooks/useStreakLeaderboard'
import { DAILY_CERTIFICATION_ATOM_ID, DAILY_VOTE_ATOM_ID } from '../services/streakService'
import { useEnsNames } from '../hooks/useEnsNames'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import SofiaLoader from '../components/ui/SofiaLoader'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { Flame } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { PAGE_COLORS } from '../config/pageColors'
import '@/components/styles/pages.css'
import '@/components/styles/streaks-page.css'

function randomColor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  return `hsl(${Math.abs(hash) % 360}, 60%, 60%)`
}

function formatShares(shares: string): string {
  const num = parseFloat(formatEther(BigInt(shares)))
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  if (num >= 100) return num.toFixed(1)
  if (num >= 1) return num.toFixed(2)
  return num.toFixed(4)
}

const PODIUM_ORDER = [1, 0, 2] as const
const PODIUM_BADGES = ['', '#1', '#2', '#3']
const PODIUM_CLASSES = ['', 'streak-pedestal--1st', 'streak-pedestal--2nd', 'streak-pedestal--3rd']
const PODIUM_AVATAR_SIZES = ['', 'h-[72px] w-[72px]', 'h-14 w-14', 'h-14 w-14']
const PODIUM_RINGS = ['', 'ring-2 ring-yellow-500/70', 'ring-2 ring-gray-400/50', 'ring-2 ring-amber-700/50']

type Tab = 'signals' | 'vote'

export default function StreaksPage() {
  const [tab, setTab] = useState<Tab>('signals')
  const signals = useStreakLeaderboard(DAILY_CERTIFICATION_ATOM_ID)
  const vote = useStreakLeaderboard(DAILY_VOTE_ATOM_ID)
  const active = tab === 'signals' ? signals : vote
  const { entries, loading, error } = active
  const addresses = entries.map((e) => e.address as Address)
  const { getDisplay, getAvatar } = useEnsNames(addresses)

  const streakData = entries.map((entry) => ({
    ...entry,
    displayName: getDisplay(entry.address as Address),
    avatar: getAvatar(entry.address as Address),
  }))

  const top3 = streakData.slice(0, 3)
  const rest = streakData.slice(3)

  const pc = PAGE_COLORS['/streaks']

  return (
    <div>
      <PageHeader color={pc.color} glow={pc.glow} title={pc.title} subtitle={pc.subtitle} />
      <div className="space-y-8 page-content page-enter">

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1">
        <Button
          variant={tab === 'signals' ? 'default' : 'ghost'}
          size="sm"
          className="flex-1"
          onClick={() => setTab('signals')}
        >
          Signals
        </Button>
        <Button
          variant={tab === 'vote' ? 'default' : 'ghost'}
          size="sm"
          className="flex-1"
          onClick={() => setTab('vote')}
        >
          Vote
        </Button>
      </div>

      {/* Streak count */}
      {!loading && (
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          <span className="font-semibold">{tab === 'signals' ? 'Signals' : 'Vote'}</span>
          <span className="text-sm text-muted-foreground">{streakData.length} streakers</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-start justify-center page-loader">
          <SofiaLoader size={96} />
        </div>
      )}

      {error && (
        <Card className="p-4 text-center text-sm text-destructive">{error}</Card>
      )}

      {/* Podium — Top 3 */}
      {!loading && top3.length >= 3 && (
        <div className="streak-podium">
          {PODIUM_ORDER.map((dataIdx) => {
            const rank = dataIdx + 1
            const entry = top3[dataIdx]
            return (
              <div key={entry.address} className={`streak-pedestal ${PODIUM_CLASSES[rank]}`}>
                {/* Avatar */}
                <div className="streak-pedestal__avatar-wrap">
                  <Avatar className={`${PODIUM_AVATAR_SIZES[rank]} ${PODIUM_RINGS[rank]}`}>
                    <img src={entry.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                    <AvatarFallback className="text-sm text-white" style={{ background: randomColor(entry.address) }}>
                      {entry.displayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Name + streak */}
                <div className="streak-pedestal__info">
                  <p className="streak-pedestal__name">{entry.displayName}</p>
                  <div className="streak-pedestal__streak">
                    <Flame className="h-3.5 w-3.5 text-orange-500" />
                    <span className="streak-pedestal__streak-text">{entry.streakDays}d</span>
                  </div>
                </div>

                {/* Pedestal block with badge */}
                <div className="streak-pedestal__block">
                  <span className="streak-badge">{PODIUM_BADGES[rank]}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Ranking list #4+ */}
      {!loading && !error && (
        <div className="streak-list">
          {rest.map((entry, i) => (
            <div key={entry.address} className="streak-row">
              <span className="streak-rank">
                {i + 4}
              </span>
              <Avatar className="h-9 w-9">
                <img src={entry.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                <AvatarFallback className="text-[10px] text-white" style={{ background: randomColor(entry.address) }}>
                  {entry.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="streak-row__user">
                <p className="streak-row__name">{entry.displayName}</p>
                <p className="streak-row__address">
                  {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                </p>
              </div>
              <div className={`streak-row__days ${entry.streakDays > 0 ? 'streak-row__days--active' : ''}`}>
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                <span className="streak-row__days-num">{entry.streakDays}</span>
              </div>
              <div className="streak-row__trust">
                <span className="streak-row__trust-value">{formatShares(entry.shares)}</span>
                <span className="streak-row__trust-label">TRUST</span>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
