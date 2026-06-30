import { useState, useMemo } from 'react'
import { useEnsNames } from '../hooks/useEnsNames'
import { EXPLORER_URL } from '../config'
import type { LeaderboardProps, AlphaTester } from '../types'
import { Card } from './ui/card'
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

function sortAlpha(data: AlphaTester[], sortBy: AlphaSortOption) {
  return [...data].sort((a, b) => {
    switch (sortBy) {
      case 'TX':
        return b.tx - a.tx
      case 'Intentions':
        return b.intentions - a.intentions
      case 'Pioneer':
        return b.pioneer - a.pioneer
      case 'Trust Volume':
        return a.trustVolume > b.trustVolume ? -1 : 1
      default:
        return 0
    }
  })
}

const ALPHA_COLUMNS: { label: string; key: AlphaSortOption }[] = [
  { label: 'Intentions', key: 'Intentions' },
  { label: 'Pioneer', key: 'Pioneer' },
  { label: 'Trust Vol.', key: 'Trust Volume' },
  { label: 'TX', key: 'TX' },
]

export default function Leaderboard({
  alphaData = [],
  alphaLoading,
  alphaError,
  connectedAddress,
}: LeaderboardProps) {
  const [alphaSortBy, setAlphaSortBy] = useState<AlphaSortOption>('TX')

  const sortedAlpha = useMemo(
    () => sortAlpha(alphaData, alphaSortBy),
    [alphaData, alphaSortBy],
  )

  const allAddresses = useMemo(
    () => alphaData.map((u) => u.address),
    [alphaData],
  )

  const { getDisplay, getAvatar } = useEnsNames(allAddresses)

  const colSpan = 2 + ALPHA_COLUMNS.length

  return (
    <Card className="overflow-hidden lb-card">
      {/* Header — single Alpha Testers view. */}
      <div className="lb-header">
        <span className="lb-title">Leaderboard</span>
        <span className="lb-subtitle">Alpha Testers</span>
      </div>

      <div className="overflow-x-auto">
        <table className="lb-table">
          <thead>
            <tr className="lb-border-row">
              <th className="lb-rank-head">#</th>
              <th className="lb-cell-head">User</th>
              {ALPHA_COLUMNS.map((col) => {
                const active = alphaSortBy === col.key
                return (
                  <th
                    key={col.key}
                    className={`lb-cell-head-num${active ? ' lb-sort-active' : ''}`}
                    onClick={() => setAlphaSortBy(col.key)}
                  >
                    {col.label}
                    {active && ' ▼'}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {alphaLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="lb-border-row">
                  <td colSpan={colSpan} className="lb-cell">
                    <div className="lb-skeleton bg-muted animate-pulse" />
                  </td>
                </tr>
              ))}

            {alphaError && (
              <tr>
                <td colSpan={colSpan} className="lb-error">
                  {alphaError}
                </td>
              </tr>
            )}

            {!alphaLoading &&
              !alphaError &&
              sortedAlpha.map((user, i) => {
                const rank = i + 1
                const isSelf =
                  connectedAddress &&
                  user.address.toLowerCase() === connectedAddress.toLowerCase()
                const cls =
                  'lb-border-row' +
                  (isSelf ? ' lb-self-row' : '') +
                  (rank <= 3 ? ' lb-top-row' : '')
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
                        <span className="lb-username">
                          {getDisplay(user.address)}
                        </span>
                      </a>
                    </td>
                    <td className="lb-cell-num">
                      {user.intentions.toLocaleString()}
                    </td>
                    <td className="lb-cell-num">{user.pioneer}</td>
                    <td className="lb-cell-num">
                      {formatTrust(user.trustVolume)}
                    </td>
                    <td className="lb-cell-num">{user.tx.toLocaleString()}</td>
                  </tr>
                )
              })}

            {!alphaLoading && !alphaError && sortedAlpha.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="lb-error">
                  No alpha testers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
