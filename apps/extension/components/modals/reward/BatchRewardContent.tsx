/**
 * BatchRewardContent
 *
 * Inner content of the post-tx reward experience.
 * Renders inside the same surface as WeightModal (Phase 3a stitching).
 *
 * Flow: `loading` → auto-claim → `animation` (single screen). The user no longer
 * has to click "Claim All Rewards" — the gold is claimed automatically as soon as
 * the rewards are computed. The animation phase shows the Mark(s) the user just
 * created alongside the gold animation backdrop.
 *
 * Owns its phase state and consumes useBatchRewards / useGoldSystem directly.
 * Host component owns the surrounding overlay and is responsible for calling onClose.
 */

import { useEffect, useRef, useState } from "react"
import { useBatchRewards, useGoldSystem } from "~/hooks"
import { getFaviconUrl, createHookLogger } from "~/lib/utils"
import { EXPLORER_URLS } from "~/lib/config/chainConfig"
import SofiaLoader from "../../ui/SofiaLoader"
import xIcon from "../../ui/social/x.svg"
import type { CartItemRecord } from "~/lib/database"

const logger = createHookLogger("BatchRewardContent")
const OG_BASE_URL = "https://sofia-og.vercel.app"

const goldRewardVideoUrl = chrome.runtime.getURL("assets/bggoldreward.mp4")
const goldReward50VideoUrl = chrome.runtime.getURL(
  "assets/bggoldreward50.mp4"
)

type Phase = "loading" | "animation"

const hostFromUrl = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

const truncate = (text: string, max: number) =>
  text.length > max ? text.slice(0, max) + "..." : text

export interface BatchRewardContentProps {
  /** Items submitted in the batch. */
  items: CartItemRecord[]
  /** Tx hash of the batch certification (optional). */
  txHash?: string
  /** Called when the user dismisses the reward (Done button). */
  onClose: () => void
  /**
   * Optional primary CTA — when set, replaces the default close behavior with
   * a "View my Echoes" action that the host can wire to a navigation target
   * (Phase 4: mono → GroupDetailView, multi → EchoesTab bento).
   */
  onViewEchoes?: () => void
  /**
   * Whether the content is active. Mirrors the host modal's open state and
   * is forwarded to useBatchRewards so the indexer/GraphQL fetch only fires
   * when the surface is visible.
   */
  enabled: boolean
}

const BatchRewardContent = ({
  items,
  txHash,
  onClose,
  onViewEchoes,
  enabled
}: BatchRewardContentProps) => {
  const { rewards, loading, claimed, totalGoldInBatch, claimAll, reset } =
    useBatchRewards(items, enabled)
  const { totalGold } = useGoldSystem()
  const [phase, setPhase] = useState<Phase>("loading")
  const [isSharing, setIsSharing] = useState(false)
  const autoClaimedRef = useRef(false)

  // Drive the phase machine off of useBatchRewards state.
  useEffect(() => {
    if (loading) {
      if (phase !== "loading") setPhase("loading")
      return
    }
    if (rewards.length === 0) return

    // Auto-claim as soon as rewards are computed, then move to the animation phase.
    // The user no longer needs an intermediate "Claim All Rewards" click —
    // the BatchRewardContent screen acts as the single post-tx surface.
    if (!claimed && !autoClaimedRef.current && enabled) {
      autoClaimedRef.current = true
      claimAll()
        .then(() => setPhase("animation"))
        .catch((err) => {
          logger.error("Auto-claim failed", err)
          // Fall through to animation phase anyway so the user can still close —
          // the rewards remain claimable on next open.
          setPhase("animation")
        })
    } else if (claimed && phase === "loading") {
      setPhase("animation")
    }
  }, [loading, rewards.length, claimed, enabled, claimAll, phase])

  const pioneerCount = rewards.filter((r) => r.tier === "Pioneer").length
  const explorerCount = rewards.filter((r) => r.tier === "Explorer").length
  const contributorCount = rewards.filter(
    (r) => r.tier === "Contributor"
  ).length

  const handleClose = () => {
    reset()
    setPhase("loading")
    autoClaimedRef.current = false
    onClose()
  }

  const handleViewEchoes = () => {
    if (onViewEchoes) {
      reset()
      setPhase("loading")
      autoClaimedRef.current = false
      onViewEchoes()
    } else {
      handleClose()
    }
  }

  const handleShare = async () => {
    if (isSharing) return

    const win = window.open("about:blank", "_blank")
    setIsSharing(true)
    try {
      const res = await fetch(`${OG_BASE_URL}/api/share/certification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageUrl: rewards[0]?.item.url || "",
          pageTitle: `${rewards.length} Marks`,
          status: pioneerCount > 0 ? "Pioneer" : "Explorer",
          rank: rewards.length,
          totalCertifiers: rewards.length
        })
      })
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
        `I just Marked ${rewards.length} page${rewards.length > 1 ? "s" : ""} on @0xSofia ` +
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

  const isSingle = rewards.length === 1

  return (
    <>
      {phase === "loading" && (
        <div className="batch-reward__loading">
          <SofiaLoader size={60} />
          <p className="batch-reward__loading-text">Capturing your Marks…</p>
        </div>
      )}

      {phase === "animation" && (
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
                {isSingle ? "Mark captured!" : "Marks captured!"}
              </h2>
              <p className="reward-claimed-subtitle">
                +{totalGoldInBatch} Gold added to your balance
              </p>
            </div>

            {/* Mark cards — what the user just created (Phase 3b) */}
            <div
              className={`mark-claim-list ${isSingle ? "is-single" : "is-multi"}`}>
              {rewards.slice(0, isSingle ? 1 : 6).map((reward) => {
                const title =
                  reward.item.pageTitle || reward.item.normalizedUrl
                const platform = hostFromUrl(reward.item.url)
                return (
                  <div key={reward.item.id} className="mark-claim-card">
                    <img
                      src={
                        reward.item.faviconUrl ||
                        getFaviconUrl(reward.item.url, 40)
                      }
                      alt=""
                      className="mark-claim-card__favicon"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.visibility =
                          "hidden"
                      }}
                    />
                    <div className="mark-claim-card__body">
                      <span className="mark-claim-card__platform">
                        {platform}
                      </span>
                      <span
                        className="mark-claim-card__title"
                        title={title}>
                        {truncate(title, isSingle ? 64 : 32)}
                      </span>
                    </div>
                    <div className="mark-claim-card__reward">
                      <span
                        className={`mark-claim-card__tier mark-claim-card__tier--${reward.tier.toLowerCase()}`}>
                        {reward.tier}
                      </span>
                      <span className="mark-claim-card__gold">
                        +{reward.gold}
                      </span>
                    </div>
                  </div>
                )
              })}
              {!isSingle && rewards.length > 6 && (
                <div className="mark-claim-card mark-claim-card--more">
                  <span>+{rewards.length - 6} more</span>
                </div>
              )}
            </div>

            {/* Compact summary: total + share */}
            <div className="reward-claimed-summary">
              <p className="reward-claimed-total">Total: {totalGold} Gold</p>
              <button
                className="batch-receipt__share-btn"
                onClick={handleShare}
                disabled={isSharing}>
                <img
                  src={xIcon}
                  alt="X"
                  className="batch-receipt__share-icon"
                />
                {isSharing ? "Sharing…" : "Share on X"}
              </button>
            </div>

            <div className="reward-claimed-actions">
              <button
                className="reward-continue-btn reward-continue-btn--primary"
                onClick={handleViewEchoes}>
                {isSingle ? "View my Echo" : "View my Echoes"}
              </button>
              <button
                className="reward-continue-btn reward-continue-btn--ghost"
                onClick={handleClose}>
                Done
              </button>
            </div>

            {txHash && (
              <a
                href={`${EXPLORER_URLS.TRANSACTION}${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="reward-view-tx-link">
                View transaction →
              </a>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default BatchRewardContent
