import { createPortal } from "react-dom"

import { formatTrust } from "~/lib/utils"
import { SofiaLoader } from "../../ui"

import type { DebateClaim, FeaturedList } from "~/hooks"

export interface ListModalProps {
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

export default ListModal
