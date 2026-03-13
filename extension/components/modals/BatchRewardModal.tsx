/**
 * BatchRewardModal
 * Shows a sequential reward claiming flow after batch cart submission.
 * Lists each certified item with its reward tier and gold amount.
 * User claims one at a time with animation between claims.
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
const goldReward50VideoUrl = chrome.runtime.getURL("assets/bggoldreward50.mp4")

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
  const { rewards, loading, claimedSet, totalClaimed, claimItem, reset } =
    useBatchRewards(items, isOpen)
  const { totalGold } = useGoldSystem()
  const [phase, setPhase] = useState<Phase>("loading")
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null)
  const [isSharing, setIsSharing] = useState(false)

  // Update phase based on loading state
  if (loading && phase !== "loading") setPhase("loading")
  if (!loading && rewards.length > 0 && phase === "loading") setPhase("list")

  if (!isOpen || items.length === 0) return null

  const allClaimed = rewards.length > 0 && claimedSet.size >= rewards.length
  const firstUnclaimedIndex = rewards.findIndex(
    (_, i) => !claimedSet.has(i)
  )
  const animatingReward =
    animatingIndex !== null ? rewards[animatingIndex] : null

  const handleClaim = async (index: number) => {
    await claimItem(index)
    setAnimatingIndex(index)
    setPhase("animation")
  }

  const handleContinue = () => {
    setAnimatingIndex(null)
    // Check if all claimed after this
    if (claimedSet.size >= rewards.length) {
      handleClose()
    } else {
      setPhase("list")
    }
  }

  const handleClose = () => {
    reset()
    setPhase("loading")
    setAnimatingIndex(null)
    onClose()
  }

  const handleShare = async () => {
    if (isSharing || !animatingReward) return

    const win = window.open("about:blank", "_blank")
    setIsSharing(true)
    try {
      const res = await fetch(
        `${OG_BASE_URL}/api/share/certification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pageUrl: animatingReward.item.url,
            pageTitle:
              animatingReward.item.pageTitle ||
              animatingReward.item.normalizedUrl,
            status: animatingReward.tier,
            rank: animatingReward.rank,
            totalCertifiers: animatingReward.rank
          })
        }
      )
      const { url: shareUrl } = await res.json()
      const title =
        animatingReward.item.pageTitle ||
        animatingReward.item.normalizedUrl
      const tweetText =
        `I just certified "${title}" as ${animatingReward.tier}` +
        ` #${animatingReward.rank} on @0xSofia`
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

  const totalGoldInBatch = rewards.reduce((sum, r) => sum + r.gold, 0)

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

        {/* List phase */}
        {phase === "list" && (
          <>
            <div className="batch-reward__header">
              <h2 className="batch-reward__title">Rewards</h2>
              <p className="batch-reward__subtitle">
                {allClaimed
                  ? `All rewards claimed! +${totalClaimed} Gold`
                  : `${rewards.length} certification${rewards.length > 1 ? "s" : ""} — ${totalGoldInBatch} Gold`}
              </p>
            </div>

            <div className="batch-reward__list">
              {rewards.map((reward, index) => {
                const badge = getIntentionBadge(
                  reward.item.intention ?? undefined
                )
                const isClaimed = claimedSet.has(index)
                const isActive = index === firstUnclaimedIndex && !allClaimed

                return (
                  <div
                    key={reward.item.id}
                    className={`batch-reward__item ${isClaimed ? "batch-reward__item--claimed" : ""} ${isActive ? "batch-reward__item--active" : ""}`}
                  >
                    <div className="batch-reward__item-left">
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
                        {badge && (
                          <span
                            className="batch-reward__item-badge"
                            style={{ color: badge.color }}
                          >
                            {badge.label}
                          </span>
                        )}
                        <span className="batch-reward__item-rank">
                          {reward.rank === 1
                            ? "Pioneer — 1st!"
                            : `#${reward.rank} certifier`}
                        </span>
                      </div>
                    </div>

                    <div className="batch-reward__item-right">
                      {isClaimed ? (
                        <div className="batch-reward__item-claimed">
                          <span className="batch-reward__item-check">
                            ✓
                          </span>
                          <span className="batch-reward__item-claimed-text">
                            Claimed
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="batch-reward__item-reward">
                            <span className="batch-reward__item-tier">
                              {reward.tier}
                            </span>
                            <span className="batch-reward__item-gold">
                              +{reward.gold}
                            </span>
                          </div>
                          {isActive && (
                            <button
                              className="claim-reward-btn"
                              onClick={() => handleClaim(index)}
                            >
                              Claim
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="batch-reward__footer">
              {txHash && (
                <a
                  href={`${EXPLORER_URLS.TRANSACTION}${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="batch-reward__tx-link"
                >
                  View on Explorer →
                </a>
              )}
              {allClaimed && (
                <button
                  className="reward-continue-btn"
                  onClick={handleClose}
                >
                  Continue
                </button>
              )}
            </div>
          </>
        )}

        {/* Animation phase — overlay on top */}
        {phase === "animation" && animatingReward && (
          <div className="reward-claimed-overlay">
            <video
              className="reward-claimed-bg-video"
              src={
                animatingReward.gold >= 25
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
                  Reward
                  <br />
                  Claimed!
                </h2>
                <p className="reward-claimed-subtitle">
                  {animatingReward.gold} Gold added to your balance
                </p>
              </div>

              <div className="reward-claimed-bottom">
                <p className="reward-claimed-total">
                  Total: {totalGold} Gold
                </p>
                <button
                  className="share-certification-btn"
                  onClick={handleShare}
                  disabled={isSharing}
                >
                  <img
                    src={xIcon}
                    alt="X"
                    className="share-certification-btn__icon"
                  />
                  {isSharing ? "Sharing..." : "Share"}
                </button>
                <button
                  className="reward-continue-btn"
                  onClick={handleContinue}
                >
                  {claimedSet.size >= rewards.length
                    ? "Done"
                    : "Continue"}
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
