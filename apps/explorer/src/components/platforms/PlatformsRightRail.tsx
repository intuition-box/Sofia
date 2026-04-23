/**
 * PlatformsRightRail — right-sidebar content for `/platforms`.
 *
 * Rendered into `<RightSidebar>` via `useProvideRightRail()`. Three
 * modules, oriented around decision-making on the market:
 *   1. Market Pulse   — aggregate KPIs (TVL, holders, active count, top gainer).
 *   2. Most Held      — top 5 platforms by positionCount.
 *   3. Your Positions — user holdings summary; CTA when empty.
 *
 * All typography/colors from DS tokens (`--ds-*`), no shadcn Card.
 */
import { useMemo, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { formatEther } from 'viem'
import { FaviconWrapper } from '@0xsofia/design-system'
import { usePlatformMarket } from '@/hooks/usePlatformMarket'
import AtomDetailDialog from '@/components/AtomDetailDialog'
import { ATOM_ID_TO_PLATFORM } from '@/config/atomIds'
import type { PlatformVaultData } from '@/services/platformMarketService'
import '@/components/styles/platforms-right-rail.css'

function formatMCap(raw: string): string {
  const num = parseFloat(formatEther(BigInt(raw || '0')))
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  if (num >= 1) return num.toFixed(2)
  if (num >= 0.001) return num.toFixed(4)
  return '0'
}

function compactNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return String(n)
}

export default function PlatformsRightRail() {
  const { markets, isLoading } = usePlatformMarket()
  const { user, authenticated } = usePrivy()
  const walletAddress = user?.wallet?.address
  const [selected, setSelected] = useState<PlatformVaultData | null>(null)

  const pulse = useMemo(() => {
    if (markets.length === 0) {
      return { tvl: '0', holders: 0, active: 0, topGainer: null as PlatformVaultData | null }
    }
    const tvlRaw = markets.reduce((acc, m) => acc + BigInt(m.marketCap || '0'), 0n)
    const holders = markets.reduce((acc, m) => acc + m.positionCount, 0)
    const active = markets.filter((m) => m.positionCount > 0).length
    // Top gainer = highest userPnlPct (falls back to most held when no user data).
    const withPnl = markets.filter((m) => m.userPnlPct != null)
    const topGainer =
      withPnl.length > 0
        ? [...withPnl].sort((a, b) => (b.userPnlPct ?? 0) - (a.userPnlPct ?? 0))[0]
        : null
    return {
      tvl: formatMCap(tvlRaw.toString()),
      holders,
      active,
      topGainer,
    }
  }, [markets])

  const mostHeld = useMemo(
    () => [...markets].sort((a, b) => b.positionCount - a.positionCount).slice(0, 5),
    [markets],
  )

  const myPositions = useMemo(() => {
    if (!authenticated) return null
    const held = markets.filter((m) => BigInt(m.userShares || '0') > 0n)
    if (held.length === 0) return { count: 0, totalInvested: '0', best: null as PlatformVaultData | null, worst: null as PlatformVaultData | null }
    const totalRaw = held.reduce((acc, m) => acc + BigInt(m.userDeposited || '0'), 0n)
    const withPnl = held.filter((m) => m.userPnlPct != null)
    const sorted = [...withPnl].sort((a, b) => (b.userPnlPct ?? 0) - (a.userPnlPct ?? 0))
    return {
      count: held.length,
      totalInvested: formatMCap(totalRaw.toString()),
      best: sorted[0] ?? null,
      worst: sorted[sorted.length - 1] ?? null,
    }
  }, [authenticated, markets])

  return (
    <>
      {/* ── Market Pulse ──────────────────────────────────────────── */}
      <section className="prr-card">
        <h3 className="prr-card-title">Market Pulse</h3>
        <div className="prr-pulse-grid">
          <div className="prr-pulse-stat">
            <span className="prr-pulse-value">{isLoading ? '—' : pulse.tvl}</span>
            <span className="prr-pulse-label">TVL (T)</span>
          </div>
          <div className="prr-pulse-stat">
            <span className="prr-pulse-value">{isLoading ? '—' : compactNumber(pulse.holders)}</span>
            <span className="prr-pulse-label">Holders</span>
          </div>
          <div className="prr-pulse-stat">
            <span className="prr-pulse-value">{isLoading ? '—' : pulse.active}</span>
            <span className="prr-pulse-label">Active</span>
          </div>
          <div className="prr-pulse-stat">
            {pulse.topGainer ? (
              <>
                <span
                  className="prr-pulse-value prr-pulse-value--up"
                  title={pulse.topGainer.label}
                >
                  ▲ {Math.abs(pulse.topGainer.userPnlPct ?? 0).toFixed(1)}%
                </span>
                <span className="prr-pulse-label">
                  {pulse.topGainer.label.slice(0, 10)}
                </span>
              </>
            ) : (
              <>
                <span className="prr-pulse-value">—</span>
                <span className="prr-pulse-label">Top gainer</span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Most Held ─────────────────────────────────────────────── */}
      <section className="prr-card">
        <h3 className="prr-card-title">Most Held</h3>
        {isLoading ? (
          <p className="prr-empty">Loading markets…</p>
        ) : mostHeld.length === 0 ? (
          <p className="prr-empty">No markets yet.</p>
        ) : (
          <ul className="prr-list">
            {mostHeld.map((market, i) => {
              const slug = ATOM_ID_TO_PLATFORM.get(market.termId) || ''
              return (
                <li key={market.termId}>
                  <button
                    type="button"
                    className="prr-row"
                    onClick={() => setSelected(market)}
                  >
                    <span className="prr-row-rank">{i + 1}</span>
                    <FaviconWrapper
                      size={24}
                      src={`/favicons/${slug}.png`}
                      alt={market.label}
                    />
                    <span className="prr-row-name">{market.label}</span>
                    <span className="prr-row-stat">{market.positionCount}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* ── Your Positions ────────────────────────────────────────── */}
      <section className="prr-card">
        <h3 className="prr-card-title">Your Positions</h3>
        {!myPositions ? (
          <p className="prr-empty">Connect a wallet to track your positions here.</p>
        ) : myPositions.count === 0 ? (
          <p className="prr-empty">You don't hold any platform yet. Invest from any card to start tracking here.</p>
        ) : (
          <>
            <div className="prr-pulse-grid">
              <div className="prr-pulse-stat">
                <span className="prr-pulse-value">{myPositions.count}</span>
                <span className="prr-pulse-label">Platforms</span>
              </div>
              <div className="prr-pulse-stat">
                <span className="prr-pulse-value">{myPositions.totalInvested}</span>
                <span className="prr-pulse-label">Invested (T)</span>
              </div>
            </div>
            {myPositions.best && myPositions.best.userPnlPct != null && (
              <div className="prr-mover">
                <span className="prr-mover-kicker">Best</span>
                <span className="prr-mover-name">{myPositions.best.label}</span>
                <span className="prr-mover-pct prr-mover-pct--up">
                  ▲ {myPositions.best.userPnlPct.toFixed(1)}%
                </span>
              </div>
            )}
            {myPositions.worst &&
              myPositions.worst.userPnlPct != null &&
              myPositions.worst.termId !== myPositions.best?.termId && (
                <div className="prr-mover">
                  <span className="prr-mover-kicker">Worst</span>
                  <span className="prr-mover-name">{myPositions.worst.label}</span>
                  <span
                    className={`prr-mover-pct ${
                      myPositions.worst.userPnlPct >= 0
                        ? 'prr-mover-pct--up'
                        : 'prr-mover-pct--down'
                    }`}
                  >
                    {myPositions.worst.userPnlPct >= 0 ? '▲' : '▼'}{' '}
                    {Math.abs(myPositions.worst.userPnlPct).toFixed(1)}%
                  </span>
                </div>
              )}
          </>
        )}
      </section>

      {selected && (
        <AtomDetailDialog
          open={!!selected}
          onOpenChange={(open) => { if (!open) setSelected(null) }}
          market={selected}
          platformName={selected.label}
          favicon={`/favicons/${ATOM_ID_TO_PLATFORM.get(selected.termId) || ''}.png`}
          walletAddress={walletAddress}
        />
      )}
    </>
  )
}
