/**
 * PageMarketPanel — the page's market in the Page tab (ONE_MARKET_PER_PAGE
 * _SPEC §4.2): Recommend / Distrust stake, momentum, where you'd land, your
 * position and P&L, and the page's tags.
 * Props only — PageBlockchainCard owns the data and the actions.
 */
import { TrendingUp } from "lucide-react"

import type { MyPosition, PageMarket } from "~/lib/services"
import { formatTrust } from "~/lib/utils"

import "../styles/PageMarketPanel.css"

interface PageMarketPanelProps {
  market: PageMarket | null
  loading: boolean
  recommendQueued: boolean
  distrustQueued: boolean
  onRecommend: () => void
  onDistrust: () => void
  onExit: (position: MyPosition) => void
  exiting: boolean
}

/** "12.30 T", and a plain "0 T" for an empty side */
const trust = (wei: string) =>
  BigInt(wei || "0") === 0n ? "0 T" : `${formatTrust(wei)} T`

function signedTrust(wei: string): string {
  const v = BigInt(wei || "0")
  if (v === 0n) return "0 T"
  return `${v > 0n ? "+" : "−"}${formatTrust((v > 0n ? v : -v).toString())} T`
}

function pnlPct(position: MyPosition): string | null {
  const invested = BigInt(position.invested)
  if (invested <= 0n) return null
  const pct = Number((BigInt(position.pnl) * 10_000n) / invested) / 100
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`
}

function rankLabel(market: PageMarket): string {
  const of = market.pageHolders > 0 ? ` of ${market.pageHolders}` : ""
  if (market.inPosition) {
    return `You're #${market.rank}${of} on this page${market.legacyOnly ? " (legacy position)" : ""}`
  }
  if (market.rank <= 3) return `You'd be #${market.rank} · Pioneer`
  return `You'd be #${market.rank} on this page`
}

const PageMarketPanel = ({
  market,
  loading,
  recommendQueued,
  distrustQueued,
  onRecommend,
  onDistrust,
  onExit,
  exiting
}: PageMarketPanelProps) => {
  const support = market?.support
  const oppose = market?.oppose

  return (
    <section className="pm-panel" aria-label="Page market">
      <div className="pm-stats">
        <div className="pm-stat">
          <span className="pm-stat-value">
            {loading ? "—" : trust(support?.staked ?? "0")}
          </span>
          <span className="pm-stat-label">
            Recommended · {support?.holders ?? 0}
          </span>
        </div>
        <div className="pm-stat">
          <span className="pm-stat-value pm-stat-value--oppose">
            {loading ? "—" : trust(oppose?.staked ?? "0")}
          </span>
          <span className="pm-stat-label">
            Distrusted · {oppose?.holders ?? 0}
          </span>
        </div>
        <div className="pm-stat">
          <span className="pm-stat-value pm-stat-value--momentum">
            <TrendingUp size={14} aria-hidden />
            {loading ? "—" : (market?.positionsThisWeek ?? 0)}
          </span>
          <span className="pm-stat-label">Positions this week</span>
        </div>
      </div>

      {market && !loading && (
        <p
          className={`pm-rank${market.rank <= 3 ? " pm-rank--pioneer" : ""}`}>
          {rankLabel(market)}
        </p>
      )}

      <div className="pm-actions">
        <button
          type="button"
          className={`pm-btn pm-btn--support${recommendQueued ? " is-queued" : ""}`}
          aria-pressed={recommendQueued}
          onClick={onRecommend}>
          {recommendQueued ? "✓ Recommend" : "Recommend"}
        </button>
        <button
          type="button"
          className={`pm-btn pm-btn--oppose${distrustQueued ? " is-queued" : ""}`}
          aria-pressed={distrustQueued}
          onClick={onDistrust}>
          {distrustQueued ? "✓ Distrust" : "Distrust"}
        </button>
      </div>

      {(market?.mine ?? []).map((position) => {
        const up = BigInt(position.pnl) >= 0n
        const pct = pnlPct(position)
        return (
          <div key={position.side} className="pm-mine">
            <div className="pm-mine-head">
              <span className="pm-mine-title">
                Your position ·{" "}
                {position.side === "support" ? "Recommend" : "Distrust"}
              </span>
              <button
                type="button"
                className="pm-exit"
                disabled={exiting}
                onClick={() => onExit(position)}>
                {exiting ? "Exiting…" : "Exit"}
              </button>
            </div>
            <div className="pm-mine-row">
              <span className="pm-mine-value">
                {formatTrust(position.value)} T
              </span>
              <span className={`pm-pnl ${up ? "up" : "down"}`}>
                {signedTrust(position.pnl)}
                {pct && ` (${pct})`}
              </span>
            </div>
          </div>
        )
      })}

      {(market?.tags ?? []).length > 0 && (
        <div className="pm-tags">
          {market!.tags.map((tag) => (
            <span
              key={tag.termId}
              className={`pm-tag${tag.intention ? " pm-tag--intention" : ""}`}>
              {tag.label}
              <span className="pm-tag-count">{tag.count}</span>
            </span>
          ))}
        </div>
      )}

    </section>
  )
}

export default PageMarketPanel
