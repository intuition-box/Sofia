import { useState } from 'react'
import type { Address } from 'viem'
import type { UserStats } from '../types'
import { OG_BASE_URL } from '../config'
import { useEnsNames } from '../hooks/useEnsNames'
import { formatTrust } from '../utils/formatting'
import './styles/personal-stats.css'

interface PersonalStatsProps {
  userStats: UserStats
  totalAlphaTesters: number
  totalPoolStakers: number | null
  walletAddress: Address
  displayName: string
}

type StatRow = {
  label: string
  value: string
  variant?: 'positive' | 'negative'
}

export default function PersonalStats({
  userStats,
  totalAlphaTesters,
  totalPoolStakers,
  walletAddress,
  displayName,
}: PersonalStatsProps) {
  const { isAlphaTester, alphaData, alphaRank, poolData, poolRank } = userStats
  const [sharing, setSharing] = useState(false)
  const { getDisplay, getAvatar } = useEnsNames([walletAddress])

  async function handleShare() {
    if (!alphaData || !alphaRank) return
    setSharing(true)
    try {
      const body: Record<string, string | number> = {
        wallet: walletAddress,
        name: displayName,
        alphaRank,
        totalAlpha: totalAlphaTesters,
        tx: alphaData.tx,
        intentions: alphaData.intentions,
        pioneer: alphaData.pioneer,
        trustVolume: formatTrust(alphaData.trustVolume),
      }
      if (poolData && poolRank) {
        body.poolRank = poolRank
        if (totalPoolStakers) body.totalPool = totalPoolStakers
        body.pnl = `${poolData.pnl >= 0n ? '+' : ''}${formatTrust(poolData.pnl)}`
        body.pnlPercent = `${poolData.pnlPercent >= 0 ? '+' : ''}${poolData.pnlPercent.toFixed(1)}%`
      }
      const res = await fetch(`${OG_BASE_URL}/api/share/board`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const { url } = await res.json()
      const tweetText = encodeURIComponent(
        `Check out my Sofia Season stats! Alpha Rank #${alphaRank} of ${totalAlphaTesters}`,
      )
      window.open(
        `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(url)}`,
        '_blank',
      )
    } catch (err) {
      console.error('Share failed:', err)
    } finally {
      setSharing(false)
    }
  }

  if (!isAlphaTester) {
    return (
      <section className="ps-card">
        <div className="ps-bar">
          <span className="ps-bar-title">Your Standing</span>
        </div>
        <div className="ps-empty">
          <div className="ps-empty-title">Not in the Alpha Tester Program</div>
          <div className="ps-empty-sub">Start using Sofia to claim your spot on the leaderboard.</div>
        </div>
      </section>
    )
  }

  const rank = alphaRank!
  const rankClass = rank === 1 ? 'ps-rank ps-rank--1' : rank === 2 ? 'ps-rank ps-rank--2' : rank === 3 ? 'ps-rank ps-rank--3' : 'ps-rank'

  const alphaRows: StatRow[] = [
    { label: 'Transactions', value: alphaData!.tx.toLocaleString() },
    { label: 'Intentions', value: alphaData!.intentions.toLocaleString() },
    { label: 'Pioneer', value: String(alphaData!.pioneer) },
    { label: 'Trust Volume', value: formatTrust(alphaData!.trustVolume) },
  ]

  const poolRows: StatRow[] = []
  if (poolData && poolRank) {
    poolRows.push(
      { label: 'Pool Rank', value: `#${poolRank}` },
      {
        label: 'P&L',
        value: `${poolData.pnl >= 0n ? '+' : ''}${formatTrust(poolData.pnl)}`,
        variant: poolData.pnl >= 0n ? 'positive' : 'negative',
      },
      {
        label: 'P&L %',
        value: `${poolData.pnlPercent >= 0 ? '+' : ''}${poolData.pnlPercent.toFixed(1)}%`,
        variant: poolData.pnlPercent >= 0 ? 'positive' : 'negative',
      },
    )
  }

  return (
    <section className="ps-card">
      <div className="ps-bar">
        <span className="ps-bar-title">Your Standing</span>
        <button
          className="ps-share-btn"
          onClick={handleShare}
          disabled={sharing}
          aria-label="Share on X"
        >
          <svg viewBox="0 0 1200 1227" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M714.163 519.284 1160.89 0h-105.86L667.137 450.887 357.328 0H0l468.492 681.821L0 1226.37h105.866l409.625-476.152 327.181 476.152H1200L714.137 519.284h.026ZM569.165 687.828l-47.468-67.894-377.686-540.24h162.604l304.797 435.991 47.468 67.894 396.2 566.721H892.476L569.165 687.854v-.026Z"/>
          </svg>
          {sharing ? 'Sharing…' : 'Share on X'}
        </button>
      </div>

      <div className="ps-body">
        {/* Player zone */}
        <div className="ps-player">
          <div className="ps-rank-wrap">
            <div className={rankClass}>
              <span className="ps-rank-hash">#</span>
              <span>{rank}</span>
            </div>
            <span className="ps-rank-of">of {totalAlphaTesters.toLocaleString()}</span>
          </div>

          <div className="ps-divider" />

          <div className="ps-identity">
            <img src={getAvatar(walletAddress)} alt="" className="ps-avatar" />
            <span className="ps-name">{getDisplay(walletAddress) || displayName}</span>
            <span className="ps-pill">
              <span className="ps-pill-dot" /> Alpha Tester
            </span>
          </div>
        </div>

        {/* Stats zone */}
        <div className={'ps-stats' + (poolRows.length > 0 ? ' ps-stats--split' : '')}>
          <div className="ps-stats-col">
            <div className="ps-section-title">Season Performance</div>
            <div className="ps-stat-list">
              {alphaRows.map((r) => (
                <div key={r.label} className="ps-stat-row">
                  <span className="ps-stat-label">{r.label}</span>
                  <span className="ps-stat-value">{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {poolRows.length > 0 && (
            <div className="ps-stats-col">
              <div className="ps-section-title">Season Pool</div>
              <div className="ps-stat-list">
                {poolRows.map((r) => (
                  <div key={r.label} className="ps-stat-row">
                    <span className="ps-stat-label">{r.label}</span>
                    <span
                      className={
                        'ps-stat-value' +
                        (r.variant === 'positive' ? ' ps-stat-value--positive' : '') +
                        (r.variant === 'negative' ? ' ps-stat-value--negative' : '')
                      }
                    >
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
