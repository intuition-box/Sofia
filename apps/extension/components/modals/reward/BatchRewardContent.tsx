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

import { FeedCardView, UserBadge, VerbTag } from "@0xsofia/design-system"
import type { IntentionSlug, UserBadgeTier } from "@0xsofia/design-system"
import { useGetTriplesWithPositionsQuery } from "@0xsofia/graphql"
import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type CSSProperties
} from "react"

import {
  useBatchRewards,
  useGoldSystem,
  useTrustCircle,
  useWalletFromStorage
} from "~/hooks"
import { INTENTION_ICONS } from "~/lib/config/intentionIcons"
import { TOPIC_COLORS, TOPIC_LABELS } from "~/lib/config/topicConfig"
import type { CartItemRecord } from "~/lib/database"
import { createHookLogger, getFaviconUrl } from "~/lib/utils"
import {
  INTENTION_CONFIG,
  predicateLabelToIntentionType
} from "~/types/intentionCategories"
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

/** Leading intention glyph for a feed verb chip — same helper used by the
 *  Trust Circle feed so every verb reads the same across the side panel. */
const verbIcon = (type: IntentionType) => {
  const Icon = INTENTION_ICONS[type]
  return Icon ? <Icon className="fc-verb-ic" /> : undefined
}

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

const ordinal = (n: number): string => {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

const avInitials = (label: string): string =>
  (label || "?")
    .replace(/^0x/i, "")
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 2)
    .toUpperCase() || "?"

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
  onClose,
  onViewEchoes,
  enabled
}: BatchRewardContentProps) => {
  const { rewards, loading, claimed, totalGoldInBatch, claimAll, reset } =
    useBatchRewards(items, enabled)
  const { totalGold } = useGoldSystem()
  const { walletAddress } = useWalletFromStorage()
  // Circle members who'll see this Mark in their feed (avatars + count).
  const { accounts: circleAccounts } = useTrustCircle(walletAddress)
  const [phase, setPhase] = useState<Phase>("loading")

  // ── Consensus data for the "Amplified" (vote) screen ──
  const voteItems = items.filter((i) => i.voteAction && i.tripleTermId)
  const voteTermIds = voteItems.map((i) => i.tripleTermId as string)
  const consensusAddresses = [
    walletAddress,
    ...circleAccounts.map((a) => a.walletAddress)
  ].filter(Boolean) as string[]
  const { data: posData } = useGetTriplesWithPositionsQuery(
    {
      where: { term_id: { _in: voteTermIds } },
      addresses: consensusAddresses,
      limit: 50
    },
    { enabled: enabled && voteTermIds.length > 0 }
  )
  const [isSharing, setIsSharing] = useState(false)
  // When the cart mixes a Mark (cert) and a vote, the two ceremonies play in
  // sequence: "Mark captured" → (Next) → "Amplified".
  const [mixedStage, setMixedStage] = useState<"captured" | "amplified">(
    "captured"
  )
  const autoClaimedRef = useRef(false)

  // Drive the phase machine off of useBatchRewards state.
  useEffect(() => {
    if (loading) {
      if (phase !== "loading") setPhase("loading")
      return
    }
    if (rewards.length === 0) {
      // No discovery rewards to claim — e.g. a vote-only / amplify batch
      // (liking a circle Mark earns no Pioneer/Explorer tier). Leave the
      // loading phase so the surface shows a confirmation instead of
      // spinning on "Capturing your Marks…" forever.
      if (phase === "loading") setPhase("animation")
      return
    }

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
    setMixedStage("captured")
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
  const hasVotes = voteItems.length > 0
  // Cart with BOTH a Mark (cert reward) and a vote — play both ceremonies.
  const isMixed = rewards.length > 0 && hasVotes

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

  // No discovery rewards (vote-only / amplify batch): a like or support on a
  // circle Mark deposits on an existing triple, so there's no Pioneer/Explorer
  // tier or Gold. Show a purpose-built confirmation, not the empty reward
  // ticket (which would read "Marks captured / 0 G").
  const voteOnly = items.length > 0 && items.every((i) => i.voteAction)
  const showAmplified = voteOnly || (isMixed && mixedStage === "amplified")
  if (rewards.length === 0 || showAmplified) {
    if (showAmplified) {
      // Dedupe to the pages amplified; each cart item is one context vault, so
      // the raw count is the number of signals reinforced.
      const pages = Array.from(
        new Map(voteItems.map((i) => [i.url, i])).values()
      )
      const signalCount = voteItems.length
      const firstVote = voteItems[0]
      const triple = posData?.triples?.find(
        (t) => t.term_id === firstVote?.tripleTermId
      )
      const support = triple?.term?.vaults?.[0]?.position_count ?? 0
      const oppose = triple?.counter_term?.vaults?.[0]?.position_count ?? 0
      const didSupport = firstVote?.voteAction === "support"
      const side = didSupport ? support : oppose
      const sideBefore = Math.max(0, side - 1)
      const backers = (
        (didSupport
          ? triple?.term?.vaults?.[0]?.positions
          : triple?.counter_term?.vaults?.[0]?.positions) ?? []
      ).filter(
        (p) => p.account?.id?.toLowerCase() !== walletAddress?.toLowerCase()
      )
      const backerStack = backers.slice(0, 3)
      const total = support + oppose
      const supportPct = total > 0 ? Math.round((support / total) * 100) : 100
      const extraBackers = Math.max(0, side - backerStack.length - 1)
      const markTitle =
        firstVote?.pageTitle || firstVote?.normalizedUrl || "this Mark"
      return (
        <div className="rc">
          <div className="rc-ember" />
          <div className="rc-ticket">
            <div className="rc-body rc-amp2">
              <div className="rc-amp-head">
                <span className="rc-pulse" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round">
                    <circle cx="12" cy="12" r="2.2" />
                    <path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7" />
                    <path d="M5.7 5.7a9 9 0 0 0 0 12.6M18.3 5.7a9 9 0 0 1 0 12.6" />
                  </svg>
                </span>
                <div>
                  <h1 className="rc-h1">Amplified.</h1>
                  <p className="rc-cap-sub">
                    You {didSupport ? "backed" : "opposed"}{" "}
                    <b>
                      {pages.length} Mark{pages.length > 1 ? "s" : ""}
                    </b>{" "}
                    from your circle.
                  </p>
                </div>
              </div>

              {/* the effect — consensus moved */}
              <div className="rc-shift">
                <div className="rc-shift-nums">
                  <span className="rc-sn-old">{sideBefore}</span>
                  <span className="rc-sn-arr">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                  <span
                    className={`rc-sn-new${didSupport ? "" : " is-oppose"}`}>
                    {side}
                  </span>
                </div>
                <p className="rc-shift-k">
                  {didSupport ? "backers" : "opposers"} on this Mark —{" "}
                  <b>yours is the {ordinal(side)}</b>
                </p>

                <div className="rc-backers">
                  {backerStack.map((p) => (
                    <span
                      key={p.account.id}
                      className="rc-bk"
                      style={
                        {
                          backgroundImage: p.account.image
                            ? `url(${p.account.image})`
                            : undefined
                        } as CSSProperties
                      }>
                      {p.account.image ? "" : avInitials(p.account.label)}
                    </span>
                  ))}
                  {extraBackers > 0 && (
                    <span className="rc-bk rc-bk--more">+{extraBackers}</span>
                  )}
                  <span
                    className={`rc-bk rc-bk--you${didSupport ? "" : " is-oppose"}`}>
                    YOU
                  </span>
                  <span className="rc-bk-tag">← you</span>
                </div>

                {total > 0 && (
                  <>
                    <div className="rc-consbar">
                      <i style={{ width: `${supportPct}%` }} />
                    </div>
                    <div className="rc-consmeta">
                      <span className="s">▲ {support} back</span>
                      <span className="o">▼ {oppose} oppose</span>
                    </div>
                  </>
                )}
              </div>

              {/* the mark you amplified */}
              <p className="rc-sxs-lab">
                The Mark you {didSupport ? "backed" : "opposed"}
              </p>
              <div className="rc-sxs">
                <div className="rc-sxs-thumb">
                  <img
                    src={
                      firstVote?.faviconUrl ||
                      getFaviconUrl(firstVote?.url || "", 64)
                    }
                    alt=""
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.visibility =
                        "hidden"
                    }}
                  />
                </div>
                <div className="rc-sxs-main">
                  <h3 className="rc-sxs-title" title={markTitle}>
                    {markTitle}
                  </h3>
                  <div className="rc-sxs-foot">
                    <span className="rc-sxs-domain">
                      {hostFromUrl(firstVote?.url || "")}
                    </span>
                  </div>
                </div>
              </div>

              {/* closing the loop */}
              <div className="rc-notif">
                <span className="rc-notif-bell">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                  </svg>
                </span>
                <p className="rc-notif-tx">
                  The curator gets notified that you amplified their signal.
                </p>
              </div>

              <div className="rc-amp-foot">
                <span className="rc-amp-foot-v">+{signalCount}</span>
                Signal{signalCount > 1 ? "s" : ""} amplified · no Gold for
                amplifying
              </div>

              <div className="rc-actions">
                <button
                  className="rc-btn rc-btn--primary"
                  onClick={handleClose}>
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return (
      <div className="rc">
        <div className="rc-ember" />
        <div className="rc-ticket">
          <div className="rc-body">
            <div className="rc-headline">
              <h1 className="rc-h1">Done.</h1>
            </div>
            <p className="rc-empty-note">Your transaction is confirmed.</p>
            <div className="rc-actions">
              <button className="rc-btn rc-btn--primary" onClick={handleClose}>
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Single Mark — the "Mark captured" ceremony (Feedback Screens · 01) ──
  if (isSingle) {
    const reward = rewards[0]
    const item = reward.item
    const tierLower = reward.tier.toLowerCase() as UserBadgeTier
    const title = item.pageTitle || item.normalizedUrl
    const intentKey: IntentionType | null = item.intention
      ? (((item.intention as string) in INTENTION_CONFIG
          ? item.intention
          : (item.intention as string).replace(/^for_/, "")) as IntentionType)
      : predicateLabelToIntentionType(item.predicateName)
    const intentEntry =
      intentKey && intentKey in INTENTION_CONFIG
        ? INTENTION_CONFIG[intentKey]
        : null
    const topic = item.interestContext
      ? TOPIC_LABELS[item.interestContext]
      : null
    const circleStack = circleAccounts.slice(0, 3)
    const circleOverflow = Math.max(
      0,
      circleAccounts.length - circleStack.length
    )
    const ladder: {
      tier: UserBadgeTier
      label: string
      rank: string
      color: string
    }[] = [
      {
        tier: "pioneer",
        label: "Pioneer",
        rank: "1st",
        color: "var(--rc-pioneer)"
      },
      {
        tier: "explorer",
        label: "Explorer",
        rank: "2–10",
        color: "var(--rc-explorer)"
      },
      {
        tier: "contributor",
        label: "Contributor",
        rank: "11+",
        color: "var(--rc-contributor)"
      }
    ]

    return (
      <div className="rc">
        <div className="rc-ember" />
        <div className="rc-ticket">
          <div className="rc-body rc-cap">
            <div className="rc-headline">
              <h1 className="rc-h1">Mark captured.</h1>
            </div>
            <p className="rc-cap-sub">
              Your signal is on-chain — here's what it <b>says</b>.
            </p>

            {/* ceremony — your position on this page */}
            <div className="rc-ce">
              <div className="rc-ce-halo">
                <UserBadge
                  tier={tierLower}
                  iconUrl={BADGE_IMAGES[tierLower]}
                  size={46}
                />
              </div>
              <h2 className="rc-ce-tier">{reward.tier}</h2>
              <p className="rc-ce-rank">
                You're the <b>{ordinal(reward.rank)}</b> to mark this page
              </p>
              <div className="rc-ladder">
                {ladder.map((l, i) => (
                  <Fragment key={l.tier}>
                    {i > 0 && <span className="rc-ladder-line" />}
                    <div
                      className={`rc-ladder-step${tierLower === l.tier ? " on" : ""}`}
                      style={{ "--tc": l.color } as CSSProperties}>
                      <span className="rc-ladder-dot" />
                      <span className="rc-ladder-lab">{l.label}</span>
                      <span className="rc-ladder-rank">{l.rank}</span>
                    </div>
                  </Fragment>
                ))}
              </div>
            </div>

            {/* the Mark — shared design-system feed card (xs) */}
            <div className="rc-markcard">
              <FeedCardView
                size="xs"
                handle="you"
                when="just now"
                title={title}
                url={item.url}
                domain={hostFromUrl(item.url)}
                verbs={
                  intentEntry
                    ? [
                        {
                          label: intentEntry.label,
                          color: intentEntry.color,
                          icon: intentKey ? verbIcon(intentKey) : undefined
                        }
                      ]
                    : []
                }
                up={-1}
                down={0}
                renderMedia={(ctx) => (
                  <img
                    src={item.faviconUrl || getFaviconUrl(item.url, 64)}
                    alt=""
                    className={ctx.className}
                    style={{
                      objectFit: "contain",
                      padding: "8px",
                      background: "#fff"
                    }}
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                )}
              />
            </div>

            {/* meta strip — on-chain + who sees it */}
            <div className="rc-meta">
              <div className="rc-ms">
                <span
                  className="rc-ms-ic"
                  style={{ "--c": "#06b6d4" } as CSSProperties}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <p className="rc-ms-line">
                  <b>Signed on-chain</b> — verifiable by anyone, owned by you.
                </p>
              </div>
              <div className="rc-ms">
                <span
                  className="rc-ms-ic"
                  style={{ "--c": "var(--ds-accent)" } as CSSProperties}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <circle cx="9" cy="8" r="3.2" />
                    <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
                    <path d="M16 5.5a3 3 0 0 1 0 5.8M16.5 20a5.5 5.5 0 0 0-2-4.3" />
                  </svg>
                </span>
                <p className="rc-ms-line">
                  <b>Visible to your circle</b>
                  {topic ? <> — strengthens your {topic} expertise.</> : "."}
                </p>
                {circleStack.length > 0 && (
                  <span className="rc-avs">
                    {circleStack.map((a, i) => (
                      <span
                        key={a.id}
                        className="rc-av"
                        style={{ zIndex: 3 - i } as CSSProperties}>
                        {a.image ? (
                          <img
                            src={a.image}
                            alt=""
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).style.display =
                                "none"
                            }}
                          />
                        ) : (
                          avInitials(a.label)
                        )}
                      </span>
                    ))}
                    {circleOverflow > 0 && (
                      <span className="rc-av rc-av--more">
                        +{circleOverflow}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Gold ledger — unchanged mechanism, kept on screen */}
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
              {isMixed ? (
                <button
                  className="rc-btn rc-btn--primary"
                  onClick={() => setMixedStage("amplified")}>
                  Next: your vote →
                </button>
              ) : (
                <button
                  className="rc-btn rc-btn--primary"
                  onClick={handleViewEchoes}>
                  View my Echo →
                </button>
              )}
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

  return (
    <div className="rc">
      <div className="rc-ember" />
      <div className="rc-ticket">
        <div className="rc-body">
          <div className="rc-headline">
            <h1 className="rc-h1">{isSingle ? "Mark" : "Marks"} captured.</h1>
          </div>
          <div className="rc-marks">
            {rewards.slice(0, 8).map((reward) => {
              const item = reward.item
              const title = item.pageTitle || item.normalizedUrl
              const intentKey: IntentionType | null = item.intention
                ? (((item.intention as string) in INTENTION_CONFIG
                    ? item.intention
                    : (item.intention as string).replace(
                        /^for_/,
                        ""
                      )) as IntentionType)
                : predicateLabelToIntentionType(item.predicateName)
              const intentEntry =
                intentKey && intentKey in INTENTION_CONFIG
                  ? INTENTION_CONFIG[intentKey]
                  : null
              const tierLower = reward.tier.toLowerCase() as UserBadgeTier
              return (
                <FeedCardView
                  key={item.id}
                  size="xs"
                  handle="you"
                  when="just now"
                  title={title}
                  url={item.url}
                  domain={hostFromUrl(item.url)}
                  verbs={
                    intentEntry
                      ? [
                          {
                            label: intentEntry.label,
                            color: intentEntry.color,
                            icon: intentKey ? verbIcon(intentKey) : undefined
                          }
                        ]
                      : []
                  }
                  up={-1}
                  down={0}
                  badgeSlot={
                    <UserBadge
                      tier={tierLower}
                      iconUrl={BADGE_IMAGES[tierLower]}
                      size={18}
                    />
                  }
                  renderMedia={(ctx) => (
                    <img
                      src={item.faviconUrl || getFaviconUrl(item.url, 64)}
                      alt=""
                      className={ctx.className}
                      style={{
                        objectFit: "contain",
                        padding: "8px",
                        background: "#fff"
                      }}
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = "none"
                      }}
                    />
                  )}
                />
              )
            })}
            {rewards.length > 8 && (
              <div className="rc-mark rc-mark--more">
                <span className="rc-mark-title">
                  +{rewards.length - 8} more
                </span>
              </div>
            )}
          </div>

          {TIER_ORDER.some((tier) => tierCount(tier) > 0) && (
            <div className="rc-tiers">
              <div className="rc-tiers-k">Tier ladder</div>
              {TIER_ORDER.filter((tier) => tierCount(tier) > 0).map((tier) => {
                const count = tierCount(tier)
                return (
                  <div className="rc-tier is-earned" key={tier}>
                    <UserBadge
                      tier={tier}
                      iconUrl={BADGE_IMAGES[tier]}
                      size={32}
                    />
                    <span className="rc-tier-label">
                      {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </span>
                    <span className="rc-tier-state">{count} earned</span>
                  </div>
                )
              })}
            </div>
          )}

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
            {isMixed ? (
              <button
                className="rc-btn rc-btn--primary"
                onClick={() => setMixedStage("amplified")}>
                Next: your vote →
              </button>
            ) : (
              <button
                className="rc-btn rc-btn--primary"
                onClick={handleViewEchoes}>
                View my Echoes →
              </button>
            )}
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
