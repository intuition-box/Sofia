import { useState, useMemo } from 'react'
import type { Address } from 'viem'
import { useEnsNames } from '../hooks/useEnsNames'
import { useTrustLeaderboard } from '../hooks/useTrustLeaderboard'
import { EXPLORER_URL } from '../config'
import type { LeaderboardProps, AlphaTester, PoolPosition } from '../types'
import type { EigentrustEntry } from '../services/mcpTrustService'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { formatTrust } from '../utils/formatting'
import './styles/leaderboard.css'

function RankCell({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <td className="lb-rank">
        <span className={`lb-rank-badge lb-rank-${rank}`}>{rank}</span>
      </td>
    )
  }
  return <td className="lb-rank">{rank}</td>
}

type AlphaSortOption = 'TX' | 'Intentions' | 'Pioneer' | 'Trust Volume'
type PoolSortOption = 'Shares' | 'Current Value' | 'P&L' | 'P&L %'
type TrustSortOption = 'Score' | 'Confidence' | 'Paths'

function sortAlpha(data: AlphaTester[], sortBy: AlphaSortOption) {
  return [...data].sort((a, b) => {
    switch (sortBy) {
      case 'TX': return b.tx - a.tx
      case 'Intentions': return b.intentions - a.intentions
      case 'Pioneer': return b.pioneer - a.pioneer
      case 'Trust Volume': return a.trustVolume > b.trustVolume ? -1 : 1
      default: return 0
    }
  })
}

function sortPool(data: PoolPosition[], sortBy: PoolSortOption) {
  return [...data].sort((a, b) => {
    switch (sortBy) {
      case 'Shares': return a.shares > b.shares ? -1 : 1
      case 'Current Value': return a.currentValue > b.currentValue ? -1 : 1
      case 'P&L': return a.pnl > b.pnl ? -1 : 1
      case 'P&L %': return b.pnlPercent - a.pnlPercent
      default: return 0
    }
  })
}

const ALPHA_COLUMNS: { label: string; key: AlphaSortOption }[] = [
  { label: 'Intentions', key: 'Intentions' },
  { label: 'Pioneer', key: 'Pioneer' },
  { label: 'Trust Vol.', key: 'Trust Volume' },
  { label: 'TX', key: 'TX' },
]

const POOL_COLUMNS: { label: string; key: PoolSortOption }[] = [
  { label: 'Value', key: 'Current Value' },
  { label: 'P&L', key: 'P&L' },
  { label: 'P&L %', key: 'P&L %' },
]

const TRUST_COLUMNS: { label: string; key: TrustSortOption }[] = [
  { label: 'Score', key: 'Score' },
  { label: 'Confidence', key: 'Confidence' },
  { label: 'Paths', key: 'Paths' },
]

function sortTrust(data: EigentrustEntry[], sortBy: TrustSortOption) {
  return [...data].sort((a, b) => {
    switch (sortBy) {
      case 'Score': return b.score - a.score
      case 'Confidence': return b.confidence - a.confidence
      case 'Paths': return b.pathCount - a.pathCount
      default: return 0
    }
  })
}

export default function Leaderboard({
  alphaData = [],
  alphaLoading,
  alphaError,
  poolData,
  poolLoading,
  poolError,
  connectedAddress,
}: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<'alpha' | 'pool' | 'trust'>('alpha')
  const { rankings: trustRankings, loading: trustLoading, error: trustError } = useTrustLeaderboard()
  const [alphaSortBy, setAlphaSortBy] = useState<AlphaSortOption>('TX')
  const [poolSortBy, setPoolSortBy] = useState<PoolSortOption>('P&L %')
  const [trustSortBy, setTrustSortBy] = useState<TrustSortOption>('Score')

  const sortedAlpha = useMemo(() => sortAlpha(alphaData, alphaSortBy), [alphaData, alphaSortBy])
  const sortedPool = useMemo(() => (poolData ? sortPool(poolData, poolSortBy) : []), [poolData, poolSortBy])
  const sortedTrust = useMemo(() => sortTrust(trustRankings, trustSortBy), [trustRankings, trustSortBy])

  const allAddresses = useMemo(() => {
    const a = alphaData.map((u) => u.address)
    const p = (poolData || []).map((pos: PoolPosition) => pos.address)
    const t = trustRankings.map((r) => r.address as Address)
    return [...a, ...p, ...t] as Address[]
  }, [alphaData, poolData, trustRankings])

  const { getDisplay, getAvatar } = useEnsNames(allAddresses)

  const isAlpha = activeTab === 'alpha'
  const isTrust = activeTab === 'trust'
  const loading = isTrust ? trustLoading : isAlpha ? alphaLoading : poolLoading
  const error = isTrust ? trustError : isAlpha ? alphaError : poolError
  const columns = isAlpha ? ALPHA_COLUMNS : POOL_COLUMNS

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="lb-header">
        <span className="lb-title">Leaderboard</span>
        <div className="lb-tab-group">
          <Button
            size="sm"
            variant={activeTab === 'alpha' ? 'default' : 'ghost'}
            data-active={activeTab === 'alpha'}
            onClick={() => setActiveTab('alpha')}
          >
            Alpha Testers
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'pool' ? 'default' : 'ghost'}
            data-active={activeTab === 'pool'}
            onClick={() => setActiveTab('pool')}
          >
            Season Pool
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'trust' ? 'default' : 'ghost'}
            data-active={activeTab === 'trust'}
            onClick={() => setActiveTab('trust')}
          >
            Trust Ranking
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="lb-table">
          {!isTrust && (
          <thead>
            <tr className="lb-border-row">
              <th className="lb-rank-head">#</th>
              <th className="lb-cell-head">User</th>
              {columns.map((col) => {
                const active = (isAlpha ? alphaSortBy : poolSortBy) === col.key
                return (
                  <th
                    key={col.key}
                    className={`lb-cell-head-num${active ? ' lb-sort-active' : ''}`}
                    onClick={() =>
                      isAlpha
                        ? setAlphaSortBy(col.key as AlphaSortOption)
                        : setPoolSortBy(col.key as PoolSortOption)
                    }
                  >
                    {col.label}
                    {active && ' ▼'}
                  </th>
                )
              })}
            </tr>
          </thead>
          )}
          {isTrust && (
          <thead>
            <tr className="lb-border-row">
              <th className="lb-rank-head">#</th>
              <th className="lb-cell-head">User</th>
              {TRUST_COLUMNS.map((col) => {
                const active = trustSortBy === col.key
                return (
                  <th
                    key={col.key}
                    className={`lb-cell-head-num${active ? ' lb-sort-active' : ''}`}
                    onClick={() => setTrustSortBy(col.key)}
                  >
                    {col.label}
                    {active && ' ▼'}
                  </th>
                )
              })}
            </tr>
          </thead>
          )}
          <tbody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="lb-border-row">
                  <td colSpan={2 + columns.length} className="lb-cell">
                    <div className="lb-skeleton bg-muted animate-pulse" />
                  </td>
                </tr>
              ))}

            {error && (
              <tr>
                <td colSpan={2 + columns.length} className="lb-error">
                  {error}
                </td>
              </tr>
            )}

            {!loading && !error && isAlpha &&
              sortedAlpha.map((user, i) => {
                const rank = i + 1
                const isSelf = connectedAddress && user.address.toLowerCase() === connectedAddress.toLowerCase()
                const cls = "lb-border-row" + (isSelf ? " lb-self-row" : "") + (rank <= 3 ? " lb-top-row" : "")
                return (
                  <tr key={user.address} className={cls}>
                    <RankCell rank={rank} />
                    <td className="lb-cell">
                      <a
                        href={`${EXPLORER_URL}/address/${user.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="lb-user-link"
                      >
                        <img
                          src={getAvatar(user.address)}
                          alt=""
                          className="lb-avatar"
                        />
                        <span className="lb-username">{getDisplay(user.address)}</span>
                      </a>
                    </td>
                    <td className="lb-cell-num">{user.intentions.toLocaleString()}</td>
                    <td className="lb-cell-num">{user.pioneer}</td>
                    <td className="lb-cell-num">{formatTrust(user.trustVolume)}</td>
                    <td className="lb-cell-num">{user.tx.toLocaleString()}</td>
                  </tr>
                )
              })}

            {!loading && !error && isTrust &&
              sortedTrust.map((entry, i) => {
                const rank = i + 1
                const addr = entry.address as Address
                const isSelf = connectedAddress && addr.toLowerCase() === connectedAddress.toLowerCase()
                const cls = "lb-border-row" + (isSelf ? " lb-self-row" : "") + (rank <= 3 ? " lb-top-row" : "")
                return (
                  <tr key={addr} className={cls}>
                    <RankCell rank={rank} />
                    <td className="lb-cell">
                      <a
                        href={`${EXPLORER_URL}/address/${addr}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="lb-user-link"
                      >
                        <img
                          src={getAvatar(addr)}
                          alt=""
                          className="lb-avatar"
                        />
                        <span className="lb-username">{getDisplay(addr)}</span>
                      </a>
                    </td>
                    <td className="lb-cell-num">{entry.score.toFixed(4)}</td>
                    <td className="lb-cell-num">{(entry.confidence * 100).toFixed(1)}%</td>
                    <td className="lb-cell-num">{entry.pathCount}</td>
                  </tr>
                )
              })}

            {!loading && !error && activeTab === 'pool' &&
              sortedPool.map((pos, i) => {
                const rank = i + 1
                const isSelf = connectedAddress && pos.address.toLowerCase() === connectedAddress.toLowerCase()
                const cls = "lb-border-row" + (isSelf ? " lb-self-row" : "") + (rank <= 3 ? " lb-top-row" : "")
                return (
                  <tr key={pos.address} className={cls}>
                    <RankCell rank={rank} />
                    <td className="lb-cell">
                      <a
                        href={`${EXPLORER_URL}/address/${pos.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="lb-user-link"
                      >
                        <img
                          src={getAvatar(pos.address)}
                          alt=""
                          className="lb-avatar"
                        />
                        <span className="lb-username">{getDisplay(pos.address)}</span>
                      </a>
                    </td>
                    <td className="lb-cell-num">{formatTrust(pos.currentValue)}</td>
                    <td className={"lb-cell-num " + (pos.pnl >= 0n ? "lb-positive" : "lb-negative")}>
                      {pos.pnl >= 0n ? '+' : ''}{formatTrust(pos.pnl)}
                    </td>
                    <td className={"lb-cell-num " + (pos.pnlPercent >= 0 ? "lb-positive" : "lb-negative")}>
                      {pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent.toFixed(1)}%
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      {isTrust && !loading && (
        <div className="lb-trust-legend">
          <p><strong>Score</strong> — Global trust level computed by EigenTrust across the entire attestation graph. Higher means more trusted by well-trusted wallets.</p>
          <p><strong>Confidence</strong> — How reliable the score is, based on the volume and diversity of attestations received.</p>
          <p><strong>Paths</strong> — Number of distinct trust paths leading to this wallet. More paths = more robust reputation.</p>
        </div>
      )}
    </Card>
  )
}
