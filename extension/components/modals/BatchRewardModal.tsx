/**
 * BatchRewardModal
 * Shows batch reward claiming after cart submission.
 * Displays total gold at top, all items with tiers,
 * single "Claim All" action, and a receipt card for sharing on X.
 */

import { useState } from "react"
import { createPortal } from "react-dom"
import { useBatchRewards, useGoldSystem } from "~/hooks"
import { getIntentionBadge } from "~/types/intentionCategories"
import { getFaviconUrl, createHookLogger } from "~/lib/utils"
import { EXPLORER_URLS } from "~/lib/config/chainConfig"
import SofiaLoader from "../ui/SofiaLoader"
import xIcon from "../ui/social/x.svg"
import type { CartItemRecord } from "~/lib/database"
import "../styles/Modal.css"
import "../styles/BatchRewardModal.css"

const logger = createHookLogger("BatchRewardModal")
const OG_BASE_URL = "https://sofia-og.vercel.app"

const goldRewardVideoUrl = chrome.runtime.getURL("assets/bggoldreward.mp4")
const goldReward50VideoUrl = chrome.runtime.getURL(
  "assets/bggoldreward50.mp4"
)

interface BatchRewardModalProps {
  isOpen: boolean
  items: CartItemRecord[]
  txHash?: string
  onClose: () => void
}

type Phase = "loading" | "list" | "animation"

const BatchRewardModal = ({
  isOpen,
  items,
  txHash,
  onClose
}: BatchRewardModalProps) => {
  const { rewards, loading, claimed, totalGoldInBatch, claimAll, reset } =
    useBatchRewards(items, isOpen)
  const { totalGold } = useGoldSystem()
  const [phase, setPhase] = useState<Phase>("loading")
  const [isSharing, setIsSharing] = useState(false)

  // Update phase based on loading state
  if (loading && phase !== "loading") setPhase("loading")
  if (!loading && rewards.length > 0 && phase === "loading")
    setPhase("list")

  if (!isOpen || items.length === 0) return null

  const pioneerCount = rewards.filter((r) => r.tier === "Pioneer").length
  const explorerCount = rewards.filter((r) => r.tier === "Explorer").length
  const contributorCount = rewards.filter(
    (r) => r.tier === "Contributor"
  ).length

  const handleClaimAll = async () => {
    await claimAll()
    setPhase("animation")
  }

  const handleClose = () => {
    reset()
    setPhase("loading")
    onClose()
  }

  const handleShare = async () => {
    if (isSharing) return

    const win = window.open("about:blank", "_blank")
    setIsSharing(true)
    try {
      const res = await fetch(
        `${OG_BASE_URL}/api/share/certification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pageUrl: rewards[0]?.item.url || "",
            pageTitle: `${rewards.length} certifications`,
            status: pioneerCount > 0 ? "Pioneer" : "Explorer",
            rank: rewards.length,
            totalCertifiers: rewards.length
          })
        }
      )
      const { url: shareUrl } = await res.json()

      const tierParts: string[] = []
      if (pioneerCount > 0)
        tierParts.push(
          `${pioneerCount} Pioneer${pioneerCount > 1 ? "s" : ""}`
        )
      if (explorerCount > 0)
        tierParts.push(
          `${explorerCount} Explorer${explorerCount > 1 ? "s" : ""}`
        )
      if (contributorCount > 0)
        tierParts.push(
          `${contributorCount} Contributor${contributorCount > 1 ? "s" : ""}`
        )

      const tweetText =
        `I just certified ${rewards.length} page${rewards.length > 1 ? "s" : ""} on @0xSofia ` +
        `(${tierParts.join(", ")}) and earned ${totalGoldInBatch} Gold!`

      const intentUrl =
        `https://twitter.com/intent/tweet?text=` +
        `${encodeURIComponent(tweetText)}` +
        `&url=${encodeURIComponent(shareUrl)}`
      if (win) {
        win.location.href = intentUrl
      } else {
        window.open(intentUrl, "_blank")
      }
    } catch (err) {
      logger.error("Failed to create share link", err)
      if (win) win.close()
    } finally {
      setIsSharing(false)
    }
  }

  return createPortal(
    <div className="batch-reward-overlay">
      <div className="batch-reward">
        {/* Loading phase */}
        {phase === "loading" && (
          <div className="batch-reward__loading">
            <SofiaLoader size={60} />
            <p className="batch-reward__loading-text">
              Calculating rewards...
            </p>
          </div>
        )}

        {/* List phase — total gold at top, items below, claim all */}
        {phase === "list" && (
          <>
            {/* Gold total header */}
            <div className="batch-reward__gold-header">
              <span className="batch-reward__gold-amount">
                +{totalGoldInBatch}
              </span>
              <span className="batch-reward__gold-label">Gold earned</span>
              <div className="batch-reward__tier-summary">
                {pioneerCount > 0 && (
                  <span className="batch-reward__tier-pill batch-reward__tier-pill--pioneer">
                    {pioneerCount} Pioneer
                    {pioneerCount > 1 ? "s" : ""}
                  </span>
                )}
                {explorerCount > 0 && (
                  <span className="batch-reward__tier-pill batch-reward__tier-pill--explorer">
                    {explorerCount} Explorer
                    {explorerCount > 1 ? "s" : ""}
                  </span>
                )}
                {contributorCount > 0 && (
                  <span className="batch-reward__tier-pill batch-reward__tier-pill--contributor">
                    {contributorCount} Contributor
                    {contributorCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Items list */}
            <div className="batch-reward__list">
              {rewards.map((reward) => {
                const badge = getIntentionBadge(
                  reward.item.intention ?? undefined
                )
                return (
                  <div
                    key={reward.item.id}
                    className="batch-reward__item">
                    <img
                      src={
                        reward.item.faviconUrl ||
                        getFaviconUrl(reward.item.url, 32)
                      }
                      alt=""
                      className="batch-reward__item-favicon"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display =
                          "none"
                      }}
                    />
                    <div className="batch-reward__item-info">
                      <span className="batch-reward__item-title">
                        {reward.item.pageTitle ||
                          reward.item.normalizedUrl}
                      </span>
                      <div className="batch-reward__item-meta">
                        {badge && (
                          <span
                            className="batch-reward__item-badge"
                            style={{ color: badge.color }}>
                            {badge.label}
                          </span>
                        )}
                        <span className="batch-reward__item-rank">
                          {reward.rank === 1
                            ? "Pioneer — 1st!"
                            : `#${reward.rank}`}
                        </span>
                      </div>
                    </div>
                    <span className="batch-reward__item-gold">
                      +{reward.gold}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Footer with claim all + tx link */}
            <div className="batch-reward__footer">
              {txHash && (
                <a
                  href={`${EXPLORER_URLS.TRANSACTION}${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="batch-reward__tx-link">
                  View on Explorer →
                </a>
              )}
              <button
                className="claim-reward-btn claim-reward-btn--full"
                onClick={handleClaimAll}>
                Claim All Rewards
              </button>
            </div>
          </>
        )}

        {/* Animation phase — single celebration for whole batch */}
        {phase === "animation" && claimed && (
          <div className="reward-claimed-overlay">
            <video
              className="reward-claimed-bg-video"
              src={
                totalGoldInBatch >= 50
                  ? goldReward50VideoUrl
                  : goldRewardVideoUrl
              }
              autoPlay
              muted
              loop
              playsInline
            />
            <div className="reward-claimed-content">
              <div className="reward-claimed-top">
                <h2 className="reward-claimed-title">
                  Rewards
                  <br />
                  Claimed!
                </h2>
                <p className="reward-claimed-subtitle">
                  +{totalGoldInBatch} Gold added to your balance
                </p>
              </div>

              {/* Receipt card for sharing */}
              <div className="batch-receipt">
                <div className="batch-receipt__header">
                  <span className="batch-receipt__label">
                    Certification Receipt
                  </span>
                  <span className="batch-receipt__count">
                    {rewards.length} page
                    {rewards.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="batch-receipt__favicons">
                  {rewards.slice(0, 8).map((reward) => (
                    <img
                      key={reward.item.id}
                      src={
                        reward.item.faviconUrl ||
                        getFaviconUrl(reward.item.url, 24)
                      }
                      alt=""
                      className="batch-receipt__favicon"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style
                          .display = "none"
                      }}
                    />
                  ))}
                  {rewards.length > 8 && (
                    <span className="batch-receipt__more">
                      +{rewards.length - 8}
                    </span>
                  )}
                </div>
                <div className="batch-receipt__gold">
                  <span className="batch-receipt__gold-value">
                    {totalGoldInBatch}
                  </span>
                  <span className="batch-receipt__gold-unit">
                    Gold
                  </span>
                </div>
                <button
                  className="batch-receipt__share-btn"
                  onClick={handleShare}
                  disabled={isSharing}>
                  <img
                    src={xIcon}
                    alt="X"
                    className="batch-receipt__share-icon"
                  />
                  {isSharing ? "Sharing..." : "Share on X"}
                </button>
              </div>

              <div className="reward-claimed-bottom">
                <p className="reward-claimed-total">
                  Total: {totalGold} Gold
                </p>
                <button
                  className="reward-continue-btn"
                  onClick={handleClose}>
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export default BatchRewardModal
