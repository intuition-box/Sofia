import { useMemo } from "react"

import { calcPercentage } from "~/lib/utils"

import type { DebateClaim } from "~/hooks"

export interface ClaimCardProps {
  claim: DebateClaim
  voteStatus: "support" | "oppose" | undefined
  onSupport: (e: React.MouseEvent, claim: DebateClaim) => void
  onOppose: (e: React.MouseEvent, claim: DebateClaim) => void
  hasWallet: boolean
  pos: number
  style: React.CSSProperties
  onSelect: () => void
}

const ClaimCard = ({
  claim,
  voteStatus,
  onSupport,
  onOppose,
  hasWallet,
  pos,
  style,
  onSelect
}: ClaimCardProps) => {
  const { supportPct, opposePct } = useMemo(
    () => calcPercentage(claim.supportMarketCap, claim.opposeMarketCap),
    [claim.supportMarketCap, claim.opposeMarketCap]
  )

  return (
    <div
      className="claim-card"
      data-pos={String(pos)}
      style={style}
      onClick={pos !== 0 ? onSelect : undefined}
    >
      {/* Title row — always visible */}
      <div className="claim-title">
        <div className="claim-title-left">
          {claim.subject.image && (
            <img
              src={claim.subject.image}
              alt=""
              className="claim-title-icon"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = "none"
              }}
            />
          )}
          <span className="claim-title-text">
            {claim.subject.label}
            <span className="claim-title-predicate">
              {claim.predicate.label}
            </span>
            {claim.object.label}
          </span>
          {claim.object.image && (
            <img
              src={claim.object.image}
              alt=""
              className="claim-title-icon"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = "none"
              }}
            />
          )}
        </div>
      </div>

      {/* Body — always rendered, hidden via CSS when pos !== 0 */}
      <div className="claim-content-visible">
        {/* Hero percentages */}
        <div
          className="claim-hero-pct"
          style={
            {
              "--support-font-size":
                supportPct >= opposePct ? "40px" : "var(--font-size-3xl)",
              "--oppose-font-size":
                opposePct > supportPct ? "40px" : "var(--font-size-3xl)"
            } as React.CSSProperties
          }
        >
          <span className="claim-hero-value support">+{supportPct}%</span>
          <span className="claim-hero-value oppose">+{opposePct}%</span>
        </div>

        {/* Battle bar — oppose left, support right */}
        <div
          className="claim-bar"
          style={
            {
              "--support-pct": `${supportPct}%`,
              "--oppose-pct": `${opposePct}%`
            } as React.CSSProperties
          }
        />

        {/* Pill actions */}
        <div className="claim-bottom">
          <div className="claim-actions">
            <button
              className={`claim-pill support-pill ${voteStatus === "support" ? "voted" : ""}`}
              onClick={(e) => {
                e.stopPropagation()
                onSupport(e, claim)
              }}
              disabled={!hasWallet || voteStatus === "oppose"}
            >
              {voteStatus === "support" ? "Supported" : "Support"}
            </button>
            <button
              className={`claim-pill oppose-pill ${voteStatus === "oppose" ? "voted" : ""}`}
              onClick={(e) => {
                e.stopPropagation()
                onOppose(e, claim)
              }}
              disabled={
                !hasWallet ||
                !claim.counterTermId ||
                voteStatus === "support"
              }
            >
              {voteStatus === "oppose" ? "Opposed" : "Oppose"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClaimCard
