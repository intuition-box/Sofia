/**
 * TopicLeaderboardTable — the "Topic" tab of the global Leaderboard. A topic
 * selector drives `useTopicLeaderboard`, which ranks accounts by how many of
 * the topic's certifications they hold. Shares the `lb-*` table styles.
 */
import { useMemo, useState } from 'react'
import type { Address } from 'viem'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { useTopicLeaderboard } from '@/hooks/useTopicLeaderboard'
import { useEnsNames } from '@/hooks/useEnsNames'
import { EXPLORER_URL } from '@/config'

interface TopicLeaderboardTableProps {
  connectedAddress: Address | null
}

export default function TopicLeaderboardTable({
  connectedAddress,
}: TopicLeaderboardTableProps) {
  const { topics } = useTaxonomy()
  const [topicId, setTopicId] = useState<string>('')
  const effectiveTopic = topicId || topics[0]?.id || ''
  const { entries, loading, error } = useTopicLeaderboard(
    effectiveTopic || null,
  )

  const addresses = useMemo(
    () => entries.map((e) => e.address as Address),
    [entries],
  )
  const { getDisplay, getAvatar } = useEnsNames(addresses)

  return (
    <>
      <div className="lb-topic-bar">
        <label className="lb-topic-label" htmlFor="lb-topic-select">
          Topic
        </label>
        <select
          id="lb-topic-select"
          className="lb-topic-select"
          value={effectiveTopic}
          onChange={(e) => setTopicId(e.target.value)}
        >
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <span className="lb-topic-hint">Ranked by EigenTrust score</span>
      </div>

      <div className="overflow-x-auto">
        <table className="lb-table">
          <thead>
            <tr className="lb-border-row">
              <th className="lb-rank-head">#</th>
              <th className="lb-cell-head">User</th>
              <th className="lb-cell-head-num">Trust</th>
              <th className="lb-cell-head-num">Certs</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="lb-border-row">
                  <td colSpan={4} className="lb-cell">
                    <div className="lb-skeleton bg-muted animate-pulse" />
                  </td>
                </tr>
              ))}

            {error && (
              <tr>
                <td colSpan={4} className="lb-error">
                  {error}
                </td>
              </tr>
            )}

            {!loading && !error && entries.length === 0 && (
              <tr>
                <td colSpan={4} className="lb-error">
                  No certifications in this topic yet.
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              entries.map((entry, i) => {
                const rank = i + 1
                const addr = entry.address as Address
                const isSelf =
                  connectedAddress &&
                  addr.toLowerCase() === connectedAddress.toLowerCase()
                const cls =
                  'lb-border-row' +
                  (isSelf ? ' lb-self-row' : '') +
                  (rank <= 3 ? ' lb-top-row' : '')
                return (
                  <tr key={addr} className={cls}>
                    {rank <= 3 ? (
                      <td className="lb-rank">
                        <span className={`lb-rank-badge lb-rank-${rank}`}>
                          {rank}
                        </span>
                      </td>
                    ) : (
                      <td className="lb-rank">{rank}</td>
                    )}
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
                    <td className="lb-cell-num">
                      {Math.round(entry.trustScore)}
                    </td>
                    <td className="lb-cell-num">{entry.certCount}</td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </>
  )
}
