/**
 * PlatformsRightRail — right-sidebar content for `/platforms`.
 *
 * Rendered into `<RightSidebar>` via `useProvideRightRail()`. Three
 * modules:
 *   1. Platform Pulse — aggregate KPIs (total staked, positions, active
 *                       platforms, your total position value).
 *   2. Most Supported — top 5 platforms by distinct supporters.
 *   3. Your Positions — value + change in TRUST, best/worst position, exit;
 *                       CTA when empty.
 *
 * All typography/colors from DS tokens (`--ds-*`), no shadcn Card.
 */
import { useMemo, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { formatEther } from 'viem'
import { FaviconWrapper } from '@0xsofia/design-system'
import { usePlatformMarket } from '@/hooks/usePlatformMarket'
import { usePlatformCatalog } from '@/hooks/usePlatformCatalog'
import { useRedeemCert } from '@/hooks/useRedeemCert'
import AtomDetailDialog from '@/components/AtomDetailDialog'
import { ATOM_ID_TO_PLATFORM } from '@/config/atomIds'
import { formatTrustChange } from '@/utils/formatting'
import {
  resolvePlatformImage,
  type PlatformVaultData,
} from '@/services/platformMarketService'
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
  const { platformById } = usePlatformCatalog()
  const { redeemCert } = useRedeemCert()
  const { user, authenticated } = usePrivy()
  const walletAddress = user?.wallet?.address
  const [selected, setSelected] = useState<PlatformVaultData | null>(null)

  const pulse = useMemo(() => {
    if (markets.length === 0) {
      return { tvl: '0', positions: 0, active: 0 }
    }
    const tvlRaw = markets.reduce(
      (acc, m) => acc + BigInt(m.marketCap || '0'),
      0n,
    )
    // Σ distinct supporters per platform = number of (wallet, platform)
    // positions. Not a wallet count: one wallet on 3 platforms counts 3.
    const positions = markets.reduce((acc, m) => acc + m.supporterCount, 0)
    const active = markets.filter((m) => m.supporterCount > 0).length
    return {
      tvl: formatMCap(tvlRaw.toString()),
      positions,
      active,
    }
  }, [markets])

  const mostHeld = useMemo(
    () =>
      [...markets]
        .sort((a, b) => b.supporterCount - a.supporterCount)
        .slice(0, 5),
    [markets],
  )

  const myPositions = useMemo(() => {
    if (!authenticated) return null
    const held = markets.filter((m) => BigInt(m.userShares || '0') > 0n)
    if (held.length === 0)
      return {
        count: 0,
        totalStaked: '0',
        totalValue: '0',
        totalChange: 0n,
        best: null as PlatformVaultData | null,
        worst: null as PlatformVaultData | null,
        held: [] as PlatformVaultData[],
      }
    const totalRaw = held.reduce(
      (acc, m) => acc + BigInt(m.userDeposited || '0'),
      0n,
    )
    const valueRaw = held.reduce(
      (acc, m) => acc + BigInt(m.userValue || '0'),
      0n,
    )
    const withPnl = held.filter((m) => m.userPnlPct != null)
    const sorted = [...withPnl].sort(
      (a, b) => (b.userPnlPct ?? 0) - (a.userPnlPct ?? 0),
    )
    return {
      count: held.length,
      totalStaked: formatMCap(totalRaw.toString()),
      totalValue: formatMCap(valueRaw.toString()),
      totalChange: valueRaw - totalRaw,
      best: sorted[0] ?? null,
      worst: sorted[sorted.length - 1] ?? null,
      held: [...held].sort((a, b) => (b.userPnlPct ?? 0) - (a.userPnlPct ?? 0)),
    }
  }, [authenticated, markets])

  return (
    <>
      {/* ── Market Pulse ──────────────────────────────────────────── */}
      <section className="prr-card">
        <h3 className="prr-card-title">Platform Pulse</h3>
        <div className="prr-pulse-grid">
          <div className="prr-pulse-stat">
            <span className="prr-pulse-value">
              {isLoading ? '—' : pulse.tvl}
            </span>
            <span className="prr-pulse-label">Total staked (T)</span>
          </div>
          <div className="prr-pulse-stat">
            <span className="prr-pulse-value">
              {isLoading ? '—' : compactNumber(pulse.positions)}
            </span>
            <span className="prr-pulse-label">Positions</span>
          </div>
          <div className="prr-pulse-stat">
            <span className="prr-pulse-value">
              {isLoading ? '—' : pulse.active}
            </span>
            <span className="prr-pulse-label">Active platforms</span>
          </div>
          <div className="prr-pulse-stat">
            <span className="prr-pulse-value">
              {myPositions && myPositions.count > 0
                ? myPositions.totalValue
                : '—'}
            </span>
            <span className="prr-pulse-label">Your value (T)</span>
          </div>
        </div>
      </section>

      {/* ── Most Held ─────────────────────────────────────────────── */}
      <section className="prr-card">
        <h3 className="prr-card-title">Most Supported</h3>
        {isLoading ? (
          <p className="prr-empty">Loading platforms…</p>
        ) : mostHeld.length === 0 ? (
          <p className="prr-empty">No platforms yet.</p>
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
                      src={slug ? `/favicons/${slug}.png` : undefined}
                      fallbackSrc={resolvePlatformImage(market.image)}
                      alt={market.label}
                    />
                    <span className="prr-row-name">{market.label}</span>
                    <span
                      className="prr-row-stat"
                      title={`${market.supporterCount} supporters`}
                    >
                      {market.supporterCount}
                    </span>
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
          <p className="prr-empty">
            Connect a wallet to track your positions here.
          </p>
        ) : myPositions.count === 0 ? (
          <p className="prr-empty">
            You don't have a position on any platform yet. Take a position from
            any card to start tracking it here.
          </p>
        ) : (
          <>
            <div className="prr-pulse-grid">
              <div className="prr-pulse-stat">
                <span className="prr-pulse-value">{myPositions.count}</span>
                <span className="prr-pulse-label">Platforms</span>
              </div>
              <div className="prr-pulse-stat">
                <span className="prr-pulse-value">
                  {myPositions.totalStaked}
                </span>
                <span className="prr-pulse-label">Staked (T)</span>
              </div>
              <div className="prr-pulse-stat">
                <span className="prr-pulse-value">
                  {myPositions.totalValue}
                </span>
                <span className="prr-pulse-label">Position value (T)</span>
              </div>
              <div className="prr-pulse-stat">
                <span
                  className={`prr-pulse-value ${
                    myPositions.totalChange >= 0n
                      ? 'prr-pulse-value--up'
                      : 'prr-pulse-value--down'
                  }`}
                >
                  {formatTrustChange(myPositions.totalChange)}
                </span>
                <span className="prr-pulse-label">Change</span>
              </div>
            </div>
            {myPositions.best && myPositions.best.userPnlPct != null && (
              <div className="prr-mover">
                <span className="prr-mover-kicker">Best</span>
                <FaviconWrapper
                  className="prr-mover-fav"
                  size={20}
                  src={
                    ATOM_ID_TO_PLATFORM.get(myPositions.best.termId)
                      ? `/favicons/${ATOM_ID_TO_PLATFORM.get(myPositions.best.termId)}.png`
                      : undefined
                  }
                  fallbackSrc={resolvePlatformImage(myPositions.best.image)}
                  alt={myPositions.best.label}
                />
                <span className="prr-mover-name">{myPositions.best.label}</span>
                <span
                  className={`prr-mover-pct ${
                    myPositions.best.userPnlPct >= 0
                      ? 'prr-mover-pct--up'
                      : 'prr-mover-pct--down'
                  }`}
                  title={formatTrustChange(myPositions.best.userChange)}
                >
                  {myPositions.best.userPnlPct >= 0 ? '▲' : '▼'}{' '}
                  {Math.abs(myPositions.best.userPnlPct).toFixed(1)}%
                </span>
              </div>
            )}
            {myPositions.worst &&
              myPositions.worst.userPnlPct != null &&
              myPositions.worst.termId !== myPositions.best?.termId && (
                <div className="prr-mover">
                  <span className="prr-mover-kicker">Worst</span>
                  <FaviconWrapper
                    className="prr-mover-fav"
                    size={20}
                    src={
                      ATOM_ID_TO_PLATFORM.get(myPositions.worst.termId)
                        ? `/favicons/${ATOM_ID_TO_PLATFORM.get(myPositions.worst.termId)}.png`
                        : undefined
                    }
                    fallbackSrc={resolvePlatformImage(myPositions.worst.image)}
                    alt={myPositions.worst.label}
                  />
                  <span className="prr-mover-name">
                    {myPositions.worst.label}
                  </span>
                  <span
                    className={`prr-mover-pct ${
                      myPositions.worst.userPnlPct >= 0
                        ? 'prr-mover-pct--up'
                        : 'prr-mover-pct--down'
                    }`}
                    title={formatTrustChange(myPositions.worst.userChange)}
                  >
                    {myPositions.worst.userPnlPct >= 0 ? '▲' : '▼'}{' '}
                    {Math.abs(myPositions.worst.userPnlPct).toFixed(1)}%
                  </span>
                </div>
              )}

            <ul className="prr-positions">
              {myPositions.held.map((market) => {
                const slug = ATOM_ID_TO_PLATFORM.get(market.termId) || ''
                const entry = slug ? platformById(slug) : undefined
                const website = entry?.website || slug
                return (
                  <li key={market.termId} className="prr-position">
                    <FaviconWrapper
                      size={20}
                      src={slug ? `/favicons/${slug}.png` : undefined}
                      fallbackSrc={resolvePlatformImage(market.image)}
                      alt={market.label}
                    />
                    <span className="prr-position-name">{market.label}</span>
                    <button
                      type="button"
                      className="prr-redeem-btn"
                      onClick={() =>
                        redeemCert(market.termId, market.label, website)
                      }
                    >
                      Exit
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </section>

      {selected && (
        <AtomDetailDialog
          open={!!selected}
          onOpenChange={(open) => {
            if (!open) setSelected(null)
          }}
          market={selected}
          platformName={selected.label}
          favicon={`/favicons/${ATOM_ID_TO_PLATFORM.get(selected.termId) || ''}.png`}
          walletAddress={walletAddress}
          website={
            platformById(ATOM_ID_TO_PLATFORM.get(selected.termId) ?? '')
              ?.website
          }
        />
      )}
    </>
  )
}
