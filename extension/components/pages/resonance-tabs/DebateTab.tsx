import { useMemo } from "react"
import { formatUnits } from "viem"

import { useDebateClaims } from "~/hooks"
import { useWalletFromStorage } from "~/hooks"
import WeightModal from "../../modals/WeightModal"
import { SofiaLoader } from "../../ui"
import "../../styles/DebateTab.css"

import type { DebateClaim, FeaturedList } from "~/hooks"

// ── Helpers ─────────────────────────────────────────────────────────

function formatTrust(shares: string): string {
  try {
    const val = parseFloat(formatUnits(BigInt(shares || "0"), 18))
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`
    if (val >= 1) return val.toFixed(2)
    return val.toFixed(4)
  } catch {
    return "0"
  }
}

function calcPercentage(
  supportMarketCap: string,
  opposeMarketCap: string
): { supportPct: number; opposePct: number } {
  try {
    const s = BigInt(supportMarketCap || "0")
    const o = BigInt(opposeMarketCap || "0")
    const total = s + o
    if (total === 0n) return { supportPct: 50, opposePct: 50 }
    const pct = Number((s * 100n) / total)
    return { supportPct: pct, opposePct: 100 - pct }
  } catch {
    return { supportPct: 50, opposePct: 50 }
  }
}

// ── ClaimCard ────────────────────────────────────────────────────────

interface ClaimCardProps {
  claim: DebateClaim
  voteStatus: "support" | "oppose" | undefined
  onSupport: (e: React.MouseEvent, claim: DebateClaim) => void
  onOppose: (e: React.MouseEvent, claim: DebateClaim) => void
  hasWallet: boolean
}

const ClaimCard = ({
  claim,
  voteStatus,
  onSupport,
  onOppose,
  hasWallet
}: ClaimCardProps) => {
  const { supportPct, opposePct } = useMemo(
    () => calcPercentage(claim.supportMarketCap, claim.opposeMarketCap),
    [claim.supportMarketCap, claim.opposeMarketCap]
  )

  const totalMarketCap = useMemo(() => {
    try {
      const s = BigInt(claim.supportMarketCap || "0")
      const o = BigInt(claim.opposeMarketCap || "0")
      return formatTrust(String(s + o))
    } catch {
      return "0"
    }
  }, [claim.supportMarketCap, claim.opposeMarketCap])

  return (
    <div className="claim-card">
      {/* Subject | Predicate | Object */}
      <div className="claim-labels">
        <span className="claim-atom">
          {claim.subject.image && (
            <img
              src={claim.subject.image}
              alt=""
              className="claim-atom-image"
            />
          )}
          {claim.subject.label}
        </span>
        <span className="claim-predicate">{claim.predicate.label}</span>
        <span className="claim-atom">
          {claim.object.image && (
            <img
              src={claim.object.image}
              alt=""
              className="claim-atom-image"
            />
          )}
          {claim.object.label}
        </span>
      </div>

      {/* Support vs Oppose stats */}
      <div className="claim-stats">
        <div className="claim-stat">
          <span className="claim-stat-label support">Support</span>
          <span className="claim-stat-amount">
            {formatTrust(claim.supportMarketCap)} TRUST
          </span>
          <span className="claim-stat-count">
            {claim.supportCount} position{claim.supportCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="claim-stat" style={{ textAlign: "right" }}>
          <span className="claim-stat-label oppose">Oppose</span>
          <span className="claim-stat-amount">
            {formatTrust(claim.opposeMarketCap)} TRUST
          </span>
          <span className="claim-stat-count">
            {claim.opposeCount} position{claim.opposeCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Proportional bar */}
      <div className="claim-bar">
        <div
          className="claim-bar-support"
          style={{ width: `${supportPct}%` }}
        />
        <div
          className="claim-bar-oppose"
          style={{ width: `${opposePct}%` }}
        />
      </div>

      <div className="claim-bar-percentages">
        <span className="claim-bar-pct support">+{supportPct}%</span>
        <span className="claim-bar-pct oppose">+{opposePct}%</span>
      </div>

      {/* Bottom: MCap + Actions */}
      <div className="claim-bottom">
        <span className="claim-mcap">MCap: {totalMarketCap} TRUST</span>
        <div className="claim-actions">
          <button
            className={`claim-action-btn support-btn ${voteStatus === "support" ? "voted" : ""}`}
            onClick={(e) => onSupport(e, claim)}
            disabled={!hasWallet || voteStatus === "oppose"}
            title="Support this claim"
          >
            {voteStatus === "support" ? "Supported" : "Support"}
          </button>
          <button
            className={`claim-action-btn oppose-btn ${voteStatus === "oppose" ? "voted" : ""}`}
            onClick={(e) => onOppose(e, claim)}
            disabled={!hasWallet || !claim.counterTermId || voteStatus === "support"}
            title="Oppose this claim"
          >
            {voteStatus === "oppose" ? "Opposed" : "Oppose"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ListCard ─────────────────────────────────────────────────────────

interface ListCardProps {
  list: FeaturedList
  isExpanded: boolean
  onToggle: (objectTermId: string) => void
  entries: DebateClaim[]
  entriesLoading: boolean
  onSupport: (e: React.MouseEvent, claim: DebateClaim) => void
  onOppose: (e: React.MouseEvent, claim: DebateClaim) => void
  hasWallet: boolean
  votedItems: Map<string, "support" | "oppose">
}

const ListCard = ({
  list,
  isExpanded,
  onToggle,
  entries,
  entriesLoading,
  onSupport,
  onOppose,
  hasWallet,
  votedItems
}: ListCardProps) => (
  <div className={`list-card ${isExpanded ? "expanded" : ""}`}>
    <div
      className="list-card-header"
      onClick={() => onToggle(list.objectTermId)}
    >
      <div className="list-card-header-left">
        {list.image && (
          <img src={list.image} alt="" className="list-card-image" />
        )}
        <span className="list-card-title">{list.label}</span>
      </div>
      <span className={`list-card-arrow ${isExpanded ? "expanded" : ""}`}>
        ▾
      </span>
    </div>
    <div className="list-card-meta">
      <span className="list-card-badge">
        {list.tripleCount} entries
      </span>
      <span className="list-card-badge">
        {list.totalPositionCount} positions
      </span>
      <span className="list-card-badge trust">
        {formatTrust(list.totalMarketCap)} TRUST TVL
      </span>
    </div>
    {!isExpanded && list.topSubjects.length > 0 && (
      <div className="list-card-subjects">
        {list.topSubjects.map((subject, i) => (
          <span key={i} className="list-card-subject">
            {subject.image && (
              <img
                src={subject.image}
                alt=""
                className="list-card-subject-image"
              />
            )}
            {subject.label}
          </span>
        ))}
      </div>
    )}
    <div className={`list-card-entries ${isExpanded ? "expanded" : ""}`}>
      {entriesLoading ? (
        <div className="list-card-entries-loader">
          <SofiaLoader />
        </div>
      ) : (
        entries.map((entry) => (
          <ClaimCard
            key={entry.id}
            claim={entry}
            voteStatus={votedItems.get(entry.id)}
            onSupport={onSupport}
            onOppose={onOppose}
            hasWallet={hasWallet}
          />
        ))
      )}
    </div>
  </div>
)

// ── DebateTab ────────────────────────────────────────────────────────

const DebateTab = () => {
  const { walletAddress } = useWalletFromStorage()
  const {
    sofiaClaims,
    intuitionClaims,
    featuredLists,
    loading,
    votedItems,
    selectedClaim,
    selectedAction,
    selectedCurve,
    setSelectedCurve,
    isStakeModalOpen,
    isProcessing,
    transactionSuccess,
    transactionError,
    transactionHash,
    handleSupport,
    handleOppose,
    handleStakeSubmit,
    handleStakeModalClose,
    expandedListId,
    listEntries,
    listEntriesLoading,
    handleToggleList
  } = useDebateClaims()

  const hasWallet = !!walletAddress

  // Loading
  if (loading) {
    return (
      <div className="debate-tab">
        <SofiaLoader />
      </div>
    )
  }

  // No data at all
  const hasAnyClaims =
    sofiaClaims.length > 0 ||
    intuitionClaims.length > 0 ||
    featuredLists.length > 0
  if (!hasAnyClaims) {
    return (
      <div className="debate-tab">
        <div className="debate-empty">
          No claims or lists available yet.
        </div>
      </div>
    )
  }

  return (
    <div className="debate-tab">
      {/* Sofia Claims */}
      {sofiaClaims.length > 0 && (
        <div className="debate-section">
          <div className="debate-section-header">
            <h3 className="debate-section-title">Sofia Claims</h3>
            <p className="debate-section-subtitle">
              Community debates curated by Sofia
            </p>
          </div>
          {sofiaClaims.map((claim) => (
            <ClaimCard
              key={claim.id}
              claim={claim}
              voteStatus={votedItems.get(claim.id)}
              onSupport={handleSupport}
              onOppose={handleOppose}
              hasWallet={hasWallet}
            />
          ))}
        </div>
      )}

      {/* Intuition Featured Claims */}
      {intuitionClaims.length > 0 && (
        <div className="debate-section">
          <div className="debate-section-header">
            <h3 className="debate-section-title">Featured Claims</h3>
            <p className="debate-section-subtitle">
              Notable claims from the Intuition community
            </p>
          </div>
          {intuitionClaims.map((claim) => (
            <ClaimCard
              key={claim.id}
              claim={claim}
              voteStatus={votedItems.get(claim.id)}
              onSupport={handleSupport}
              onOppose={handleOppose}
              hasWallet={hasWallet}
            />
          ))}
        </div>
      )}

      {/* Intuition Featured Lists */}
      {featuredLists.length > 0 && (
        <div className="debate-section">
          <div className="debate-section-header">
            <h3 className="debate-section-title">Featured Lists</h3>
            <p className="debate-section-subtitle">
              Curated collections from the Intuition community
            </p>
          </div>
          {featuredLists.map((list) => (
            <ListCard
              key={list.objectTermId}
              list={list}
              isExpanded={expandedListId === list.objectTermId}
              onToggle={handleToggleList}
              entries={listEntries.get(list.objectTermId) || []}
              entriesLoading={
                listEntriesLoading &&
                expandedListId === list.objectTermId
              }
              onSupport={handleSupport}
              onOppose={handleOppose}
              hasWallet={hasWallet}
              votedItems={votedItems}
            />
          ))}
        </div>
      )}

      {/* Weight Modal for Support/Oppose */}
      <WeightModal
        isOpen={isStakeModalOpen}
        triplets={
          selectedClaim
            ? [
                {
                  id: selectedClaim.termId,
                  triplet: {
                    subject: selectedClaim.subject.label,
                    predicate: selectedClaim.predicate.label,
                    object: selectedClaim.object.label
                  },
                  description: "",
                  url: ""
                }
              ]
            : []
        }
        isProcessing={isProcessing}
        transactionSuccess={transactionSuccess}
        transactionError={transactionError}
        transactionHash={transactionHash}
        estimateOptions={{ isNewTriple: false, newAtomCount: 0 }}
        showXpAnimation={true}
        submitLabel={selectedAction}
        curveSelector={{
          selected: selectedCurve,
          onChange: setSelectedCurve
        }}
        onClose={handleStakeModalClose}
        onSubmit={handleStakeSubmit}
      />
    </div>
  )
}

export default DebateTab
