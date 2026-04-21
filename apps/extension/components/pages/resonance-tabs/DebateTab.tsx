import { useCallback, useMemo, useState } from "react"

import {
  useCardStack,
  useDebateClaims,
  useWalletFromStorage
} from "~/hooks"
import WeightModal from "../../modals/WeightModal"
import { SofiaLoader } from "../../ui"
import ClaimCard from "./ClaimCard"
import ListCard from "./ListCard"
import ListModal from "./ListModal"
import "../../styles/DebateTab.css"

const DEBATE_ESTIMATE_OPTIONS = { isNewTriple: false, newAtomCount: 0 } as const

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
  const intuitionStack = useCardStack(intuitionClaims.length, 52, 0.03, 3)
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

  // Memoize WeightModal props to avoid unstable references
  const weightModalTriplets = useMemo(
    () =>
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
        : [],
    [selectedClaim]
  )
  const curveSelectorProps = useMemo(
    () => ({
      selected: selectedCurve,
      onChange: setSelectedCurve
    }),
    [selectedCurve, setSelectedCurve]
  )

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
        triplets={weightModalTriplets}
        isProcessing={isProcessing}
        transactionSuccess={transactionSuccess}
        transactionError={transactionError}
        transactionHash={transactionHash}
        estimateOptions={DEBATE_ESTIMATE_OPTIONS}
        showXpAnimation={true}
        submitLabel={selectedAction}
        curveSelector={curveSelectorProps}
        onClose={handleStakeModalClose}
        onSubmit={handleStakeSubmit}
      />
    </div>
  )
}

export default DebateTab
