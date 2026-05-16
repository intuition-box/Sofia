/**
 * BatchRewardContent
 *
 * Inner content of the post-tx reward experience.
 * Renders inside the same surface as WeightModal (Phase 3a stitching).
 *
 * Flow: `loading` → auto-claim → `animation` (single screen). The user no longer
 * has to click "Claim All Rewards" — the gold is claimed automatically as soon as
 * the rewards are computed. The animation phase shows the Mark(s) the user just
 * created on the editorial reward ticket (.rc — pure-CSS ember scene, no video).
 *
 * Owns its phase state and consumes useBatchRewards / useGoldSystem directly.
 * Host component owns the surrounding overlay and is responsible for calling onClose.
 */

import { UserBadge, VerbTag } from "@0xsofia/design-system"
import type { IntentionSlug, UserBadgeTier } from "@0xsofia/design-system"
import { useEffect, useRef, useState, type CSSProperties } from "react"

import { useBatchRewards, useGoldSystem } from "~/hooks"
import { TOPIC_COLORS, TOPIC_LABELS } from "~/lib/config/topicConfig"
import type { CartItemRecord } from "~/lib/database"
import { createHookLogger, getFaviconUrl } from "~/lib/utils"
import { INTENTION_CONFIG } from "~/types/intentionCategories"
import type { IntentionType } from "~/types/intentionCategories"

import contributorBadge from "../../ui/img/badges/contributor.png"
import explorerBadge from "../../ui/img/badges/explorer.png"
import pioneerBadge from "../../ui/img/badges/pioneer.png"
import SofiaLoader from "../../ui/SofiaLoader"

const BADGE_IMAGES: Record<UserBadgeTier, string> = {
  pioneer: pioneerBadge,
  explorer: explorerBadge,
  contributor: contributorBadge
}

const logger = createHookLogger("BatchRewardContent")
const OG_BASE_URL = "https://sofia-og.vercel.app"

const TIER_ORDER = ["pioneer", "explorer", "contributor"] as const

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

  const tierCount = (tier: (typeof TIER_ORDER)[number]): number =>
    rewards.filter((r) => r.tier.toLowerCase() === tier).length

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
        tierParts.push(`${pioneerCount} Pioneer${pioneerCount > 1 ? "s" : ""}`)
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

  // Same surface/visual as the Amplify processing loader (.amp .b3-loading) so
  // the loading → reward transition has zero style jump.
  if (phase === "loading") {
    return (
      <div className="amp b3">
        <div className="b3-loading" role="status" aria-live="polite">
          <SofiaLoader size={120} />
          <p className="b3-loading-title">Capturing</p>
          <p className="b3-loading-step">your Marks…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rc">
      <div className="rc-ember" />
      <div className="rc-ticket">
        <div className="rc-stub">
          <div className="rc-stub-row">
            <span className="rc-stub-k">N°</span>
            <span className="rc-stub-v">
              {txHash ? txHash.slice(2, 10).toUpperCase() : "—"}
            </span>
          </div>
          <div className="rc-stub-row">
            <span className="rc-stub-k">DATE</span>
            <span className="rc-stub-v">
              {new Date().toLocaleDateString("fr-FR").replace(/\//g, " · ")}
            </span>
          </div>
        </div>
        <div className="rc-perf" />

        <div className="rc-body">
          <div className="rc-headline">
            <span className="rc-drop">M</span>
            <h1 className="rc-h1">
              {isSingle ? "ark" : "arks"}
              <br />
              captured.
            </h1>
          </div>
          <p className="rc-sub">
            {isSingle
              ? "Awarded for marking one page."
              : `Awarded for marking ${rewards.length} pages.`}
          </p>

          <div className="rc-marks">
            {rewards.slice(0, isSingle ? 1 : 8).map((reward) => {
              const item = reward.item
              const title = item.pageTitle || item.normalizedUrl
              // Same intent/topic resolution as the Amplify rows so the verb
              // ("visited", …) renders via the DS <VerbTag> and the context
              // pill matches it 1:1.
              const intentKey = item.intention
                ? (((item.intention as string) in INTENTION_CONFIG
                    ? item.intention
                    : (item.intention as string).replace(
                        /^for_/,
                        ""
                      )) as IntentionType)
                : null
              const intentEntry =
                intentKey && intentKey in INTENTION_CONFIG
                  ? INTENTION_CONFIG[intentKey]
                  : null
              const topic = item.interestContext
                ? TOPIC_LABELS[item.interestContext]
                : null
              const topicColor = item.interestContext
                ? TOPIC_COLORS[item.interestContext] || "#888"
                : null
              return (
                <div className="rc-mark" key={item.id}>
                  <img
                    src={item.faviconUrl || getFaviconUrl(item.url, 32)}
                    alt=""
                    className="rc-mark-fav"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.visibility =
                        "hidden"
                    }}
                  />
                  <div className="rc-mark-main">
                    <span className="rc-mark-title" title={title}>
                      {truncate(title, isSingle ? 64 : 48)}
                    </span>
                    <span className="rc-mark-host">
                      {hostFromUrl(item.url)}
                    </span>
                    <div className="rc-mark-tags">
                      {intentEntry && (
                        <VerbTag
                          intent={intentKey as IntentionSlug}
                          label={intentEntry.label}
                        />
                      )}
                      {topic && topicColor && (
                        <span
                          className="rc-mark-ctx"
                          style={
                            { "--tag-color": topicColor } as CSSProperties
                          }>
                          <span className="rc-mark-ctx-dot" />
                          {topic}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {!isSingle && rewards.length > 8 && (
              <div className="rc-mark rc-mark--more">
                <span className="rc-mark-title">
                  +{rewards.length - 8} more
                </span>
              </div>
            )}
          </div>

          <div className="rc-tiers">
            <div className="rc-tiers-k">Tier ladder</div>
            {TIER_ORDER.map((tier) => {
              const count = tierCount(tier)
              const earned = count > 0
              return (
                <div
                  className={`rc-tier${earned ? " is-earned" : ""}`}
                  key={tier}>
                  <UserBadge
                    tier={tier}
                    iconUrl={BADGE_IMAGES[tier]}
                    size={32}
                  />
                  <span className="rc-tier-label">
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </span>
                  <span className="rc-tier-state">
                    {earned ? `${count} earned` : "locked"}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="rc-ledger">
            <div className="rc-ledger-row">
              <span>Gold earned</span>
              <span>+ {totalGoldInBatch} G</span>
            </div>
            <div className="rc-ledger-row rc-ledger-total">
              <span>Balance</span>
              <span>{totalGold.toLocaleString()} G</span>
            </div>
          </div>

          <div className="rc-actions">
            <button
              className="rc-btn rc-btn--primary"
              onClick={handleViewEchoes}>
              {isSingle ? "View my Echo →" : "View my Echoes →"}
            </button>
            <button
              className="rc-btn"
              onClick={handleShare}
              disabled={isSharing}>
              {isSharing ? "Sharing…" : "Share on X"}
            </button>
            <button className="rc-btn" onClick={handleClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BatchRewardContent
