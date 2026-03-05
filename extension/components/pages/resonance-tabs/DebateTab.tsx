import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"
import { createPortal } from "react-dom"
import { formatUnits } from "viem"

import { useDebateClaims, useWalletFromStorage } from "~/hooks"
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

// ── useCardStack ────────────────────────────────────────────────────
// Declarative card deck — transforms computed during render (no DOM
// manipulation), container height measured via ResizeObserver.

function useCardStack(count: number, peekPx: number, scaleFactor: number) {
  const [userPositions, setUserPositions] = useState<number[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const [noAnim, setNoAnim] = useState(true)

  const positions = useMemo(() => {
    if (userPositions.length === count) return userPositions
    return Array.from({ length: count }, (_, i) => i)
  }, [userPositions, count])

  const backCount = Math.max(0, count - 1)

  // Pure style computation — called during render, always in sync
  const getStyle = useCallback(
    (index: number): React.CSSProperties => {
      const pos = positions[index] ?? index
      const ty = (backCount - pos) * peekPx
      const sc = 1 - pos * scaleFactor
      return { transform: `translateY(${ty}px) scale(${sc})` }
    },
    [positions, backCount, peekPx, scaleFactor]
  )

  const stackPadding = backCount * peekPx

  // Enable CSS transitions after first paint
  useEffect(() => {
    const id = requestAnimationFrame(() => setNoAnim(false))
    return () => cancelAnimationFrame(id)
  }, [])

  const selectCard = useCallback(
    (index: number) => {
      const clickedPos = positions[index]
      if (clickedPos === 0) return
      const n = positions.length
      setUserPositions(
        positions.map((p) => (p - clickedPos + n) % n)
      )
    },
    [positions]
  )

  const getPos = useCallback(
    (index: number) => positions[index] ?? index,
    [positions]
  )

  return { containerRef, getStyle, getPos, selectCard, noAnim, stackPadding }
}

// ── ClaimCard ────────────────────────────────────────────────────────

interface ClaimCardProps {
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

// ── ListCard ─────────────────────────────────────────────────────────

interface ListCardProps {
  list: FeaturedList
  pos: number
  style: React.CSSProperties
  onSelect: () => void
  onOpenEntries: (e: React.MouseEvent) => void
}

const ListCard = ({
  list,
  pos,
  style,
  onSelect,
  onOpenEntries
}: ListCardProps) => (
  <div
    className="list-card"
    data-pos={String(pos)}
    style={style}
    onClick={pos !== 0 ? onSelect : undefined}
  >
    {/* Title row — always visible */}
    <div className="list-card-header">
      <div className="list-card-header-left">
        {list.image && (
          <img
            src={list.image}
            alt=""
            className="list-card-image"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = "none"
            }}
          />
        )}
        <span className="list-card-title">{list.label}</span>
      </div>
    </div>

    {/* Body — always rendered, hidden via CSS when pos !== 0 */}
    <div className="list-card-content-visible">
      {/* Description */}
      {list.description && (
        <p className="list-card-description">{list.description}</p>
      )}

      {/* Tag chips */}
      {list.topSubjects.length > 0 && (
        <div className="list-chips-scroll">
          {list.topSubjects.map((subject, i) => (
            <span key={i} className="list-chip">
              {subject.image && (
                <img
                  src={subject.image}
                  alt=""
                  className="list-chip-image"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = "none"
                  }}
                />
              )}
              {subject.label}
            </span>
          ))}
        </div>
      )}

      {/* View all entries button */}
      <div className="list-open-btn">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onOpenEntries(e)
          }}
        >
          View all entries &rarr;
        </button>
      </div>
    </div>
  </div>
)

// ── ListModal ────────────────────────────────────────────────────────

interface ListModalProps {
  list: FeaturedList | null
  entries: DebateClaim[]
  entriesLoading: boolean
  isOpen: boolean
  onClose: () => void
  onSupport: (e: React.MouseEvent, claim: DebateClaim) => void
  onOppose: (e: React.MouseEvent, claim: DebateClaim) => void
  hasWallet: boolean
  votedItems: Map<string, "support" | "oppose">
}

const ListModal = ({
  list,
  entries,
  entriesLoading,
  isOpen,
  onClose,
  onSupport,
  onOppose,
  hasWallet,
  votedItems
}: ListModalProps) => {
  if (!list) return null

  return createPortal(
    <div
      className={`list-modal-overlay ${isOpen ? "is-open" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="list-modal">
        {/* Header */}
        <div className="list-modal-header">
          <button className="list-modal-back" onClick={onClose}>
            &larr;
          </button>
          <div className="list-modal-title-wrap">
            <div className="list-modal-title">{list.label}</div>
            <div className="list-modal-meta">
              {list.tripleCount} entries &middot;{" "}
              {list.totalPositionCount} positions
            </div>
          </div>
          <div className="list-modal-tvl">
            {formatTrust(list.totalMarketCap)} TRUST
          </div>
        </div>

        {/* Table */}
        {entriesLoading ? (
          <div className="list-modal-loader">
            <SofiaLoader />
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="list-modal-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Entry</th>
                  <th>Support</th>
                  <th>Oppose</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => {
                  const voteStatus = votedItems.get(entry.id)
                  return (
                    <tr key={entry.id}>
                      <td className="td-rank">{i + 1}</td>
                      <td>
                        <div className="td-name">
                          {entry.subject.image && (
                            <img
                              src={entry.subject.image}
                              alt=""
                              className="td-atom-icon"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).style.display =
                                  "none"
                              }}
                            />
                          )}
                          <div>
                            <div className="td-name-text">
                              {entry.subject.label}
                            </div>
                            <div className="td-name-sub">
                              {entry.supportCount} supporters
                              &middot; {entry.opposeCount} opposed
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="td-trust-support">
                        {formatTrust(entry.supportMarketCap)} TRUST
                      </td>
                      <td className="td-trust-oppose">
                        {formatTrust(entry.opposeMarketCap)} TRUST
                      </td>
                      <td>
                        <div className="td-actions">
                          <button
                            className={`claim-pill support-pill ${voteStatus === "support" ? "voted" : ""}`}
                            onClick={(e) => onSupport(e, entry)}
                            disabled={
                              !hasWallet ||
                              voteStatus === "oppose"
                            }
                          >
                            {voteStatus === "support"
                              ? "Supported"
                              : "Support"}
                          </button>
                          <button
                            className={`claim-pill oppose-pill ${voteStatus === "oppose" ? "voted" : ""}`}
                            onClick={(e) => onOppose(e, entry)}
                            disabled={
                              !hasWallet ||
                              !entry.counterTermId ||
                              voteStatus === "support"
                            }
                          >
                            {voteStatus === "oppose"
                              ? "Opposed"
                              : "Oppose"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

// ── DebateTab ────────────────────────────────────────────────────────

const DebateTab = () => {
  const { walletAddress } = useWalletFromStorage()
  const {
    sofiaClaims,
    intuitionClaims,
    featuredLists,
    loading,
    error,
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

  // Card stacks
  const sofiaStack = useCardStack(sofiaClaims.length, 52, 0.03)
  const intuitionStack = useCardStack(intuitionClaims.length, 52, 0.03)
  const listsStack = useCardStack(featuredLists.length, 48, 0.03)

  // List modal state
  const [modalListId, setModalListId] = useState<string | null>(null)
  const modalList =
    featuredLists.find((l) => l.objectTermId === modalListId) || null

  const openListModal = useCallback(
    (objectTermId: string) => {
      handleToggleList(objectTermId)
      setModalListId(objectTermId)
    },
    [handleToggleList]
  )

  const closeListModal = useCallback(() => {
    setModalListId(null)
  }, [])

  // Loading
  if (loading) {
    return (
      <div className="debate-tab">
        <SofiaLoader />
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className="debate-tab">
        <div className="debate-empty">Failed to load debate content.</div>
      </div>
    )
  }

  // No data
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
          <div
            className={`claim-stack ${sofiaStack.noAnim ? "no-anim" : ""}`}
            ref={sofiaStack.containerRef}
            style={{ paddingBottom: sofiaStack.stackPadding }}
          >
            {sofiaClaims.map((claim, i) => (
              <ClaimCard
                key={claim.id}
                claim={claim}
                voteStatus={votedItems.get(claim.id)}
                onSupport={handleSupport}
                onOppose={handleOppose}
                hasWallet={hasWallet}
                pos={sofiaStack.getPos(i)}
                style={sofiaStack.getStyle(i)}
                onSelect={() => sofiaStack.selectCard(i)}
              />
            ))}
          </div>
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
          <div
            className={`claim-stack ${intuitionStack.noAnim ? "no-anim" : ""}`}
            ref={intuitionStack.containerRef}
            style={{ paddingBottom: intuitionStack.stackPadding }}
          >
            {intuitionClaims.map((claim, i) => (
              <ClaimCard
                key={claim.id}
                claim={claim}
                voteStatus={votedItems.get(claim.id)}
                onSupport={handleSupport}
                onOppose={handleOppose}
                hasWallet={hasWallet}
                pos={intuitionStack.getPos(i)}
                style={intuitionStack.getStyle(i)}
                onSelect={() => intuitionStack.selectCard(i)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Intuition Featured Lists */}
      {featuredLists.length > 0 && (
        <div className="lists-section">
          <div className="debate-section-header">
            <h3 className="debate-section-title">Featured Lists</h3>
            <p className="debate-section-subtitle">
              Curated collections from the Intuition community
            </p>
          </div>
          <div
            className={`claim-stack ${listsStack.noAnim ? "no-anim" : ""}`}
            ref={listsStack.containerRef}
            style={{ paddingBottom: listsStack.stackPadding }}
          >
            {featuredLists.map((list, i) => (
              <ListCard
                key={list.objectTermId}
                list={list}
                pos={listsStack.getPos(i)}
                style={listsStack.getStyle(i)}
                onSelect={() => listsStack.selectCard(i)}
                onOpenEntries={() =>
                  openListModal(list.objectTermId)
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* List Entries Modal */}
      <ListModal
        list={modalList}
        entries={
          modalListId
            ? listEntries.get(modalListId) || []
            : []
        }
        entriesLoading={
          listEntriesLoading && expandedListId === modalListId
        }
        isOpen={!!modalListId}
        onClose={closeListModal}
        onSupport={handleSupport}
        onOppose={handleOppose}
        hasWallet={hasWallet}
        votedItems={votedItems}
      />

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
